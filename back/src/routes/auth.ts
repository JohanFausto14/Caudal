import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Negocio from '../models/Negocio.js';
import { JWT_SECRET, requerirNegocio, RequestAutenticado } from '../middlewares/autenticacion.js';

const router = Router();

const intentosFallidosPorIp: Record<string, { intentos: number; bloqueoHasta: number }> = {};

// 1. Obtener información pública básica del negocio por código/slug
router.get('/info-publica/:codigo', async (req: Request, res: Response) => {
  try {
    const rawCodigo = req.params.codigo;
    const codigo = (Array.isArray(rawCodigo) ? rawCodigo[0] : rawCodigo || '').toLowerCase().trim();

    const negocio = await Negocio.findOne({ codigo });
    if (!negocio) {
      return res.status(404).json({ success: false, message: `El negocio con código "${codigo}" no existe.` });
    }

    if (!negocio.isActive) {
      return res.status(403).json({ success: false, message: `El negocio "${negocio.nombre}" se encuentra temporalmente suspendido.` });
    }

    res.json({
      success: true,
      data: {
        codigo: negocio.codigo,
        nombre: negocio.nombre,
        telefono: negocio.telefono,
        logoUrl: negocio.logoUrl || null,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error al consultar información del negocio.' });
  }
});

// 2. Login con código de negocio y PIN (Activa enLinea = true)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ahora = Date.now();

    if (intentosFallidosPorIp[ip] && intentosFallidosPorIp[ip].bloqueoHasta > ahora) {
      const segundosRestantes = Math.ceil((intentosFallidosPorIp[ip].bloqueoHasta - ahora) / 1000);
      return res.status(429).json({
        success: false,
        message: `Demasiados intentos fallidos. Intenta de nuevo en ${segundosRestantes} segundos.`,
      });
    }

    const { codigo, pin } = req.body;

    if (!codigo || !pin) {
      return res.status(400).json({ success: false, message: 'Se requiere el código de negocio y el PIN de seguridad.' });
    }

    const codigoNormalizado = String(codigo).toLowerCase().trim();
    const pinStr = String(pin).trim();

    const negocio = await Negocio.findOne({ codigo: codigoNormalizado });
    if (!negocio) {
      return res.status(404).json({ success: false, message: 'Código de negocio no encontrado.' });
    }

    if (!negocio.isActive) {
      return res.status(403).json({
        success: false,
        message: `El negocio "${negocio.nombre}" se encuentra suspendido. Contacta al administrador.`,
      });
    }

    const esValido = await bcrypt.compare(pinStr, negocio.pinHash);
    if (!esValido) {
      if (!intentosFallidosPorIp[ip]) {
        intentosFallidosPorIp[ip] = { intentos: 0, bloqueoHasta: 0 };
      }
      intentosFallidosPorIp[ip].intentos += 1;

      if (intentosFallidosPorIp[ip].intentos >= 5) {
        intentosFallidosPorIp[ip].bloqueoHasta = ahora + 60000;
        intentosFallidosPorIp[ip].intentos = 0;
        return res.status(429).json({
          success: false,
          message: 'PIN incorrecto. Has excedido los 5 intentos. Terminal bloqueada por 1 minuto.',
        });
      }

      const intentosRestantes = 5 - intentosFallidosPorIp[ip].intentos;
      return res.status(401).json({
        success: false,
        message: `PIN de seguridad incorrecto. Te quedan ${intentosRestantes} ${intentosRestantes === 1 ? 'intento' : 'intentos'}.`,
      });
    }

    delete intentosFallidosPorIp[ip];

    negocio.enLinea = true;
    negocio.ultimoLogin = new Date();
    negocio.ultimaActividad = new Date();
    await negocio.save();

    const token = jwt.sign(
      {
        id: negocio._id,
        codigo: negocio.codigo,
        nombre: negocio.nombre,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      negocio: {
        codigo: negocio.codigo,
        nombre: negocio.nombre,
        telefono: negocio.telefono,
        logoUrl: negocio.logoUrl || null,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error durante el inicio de sesión.' });
  }
});

// 3. Cierre de sesión voluntario (Bloquear Terminal -> enLinea = false)
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { codigo } = req.body;
    if (codigo) {
      const codigoNormalizado = String(codigo).toLowerCase().trim();
      await Negocio.updateOne(
        { codigo: codigoNormalizado },
        {
          $set: {
            enLinea: false,
            ultimoCierreSesion: new Date(),
            ultimaActividad: new Date(),
          },
        }
      );
    }
    res.json({ success: true, message: 'Sesión cerrada correctamente.' });
  } catch {
    res.status(500).json({ success: false, message: 'Error al cerrar sesión.' });
  }
});

// 4. Actualizar Logo del Negocio (Sanitizado y Blindado contra Exfiltraciones)
router.put('/logo', requerirNegocio, async (req: RequestAutenticado, res: Response) => {
  try {
    const { logoUrl } = req.body;

    // Si envía null o vacío, es para restablecer al logo predeterminado
    if (logoUrl === null || logoUrl === '') {
      await Negocio.updateOne({ codigo: req.negocioId }, { $set: { logoUrl: null } });
      return res.json({ success: true, logoUrl: null, message: 'Logo restablecido al predeterminado.' });
    }

    // Validación estricta de Data URL (solo imágenes rasterizadas: png, jpeg, webp)
    if (typeof logoUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'Formato de imagen inválido.' });
    }

    const esImagenValida = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(logoUrl);
    if (!esImagenValida) {
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten imágenes válidas en formato PNG, JPG o WebP.',
      });
    }

    // Límite de tamaño estricto (máx 2.5 MB en base64)
    if (logoUrl.length > 2.5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'La imagen excede el límite de tamaño permitido (máx 1.5MB).',
      });
    }

    await Negocio.updateOne({ codigo: req.negocioId }, { $set: { logoUrl } });

    res.json({
      success: true,
      logoUrl,
      message: 'Logo del negocio actualizado correctamente.',
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error al guardar el logo.' });
  }
});

export default router;
