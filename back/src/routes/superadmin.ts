import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Negocio from '../models/Negocio.js';
import Producto from '../models/Producto.js';
import Venta from '../models/Venta.js';
import Gasto from '../models/Gasto.js';
import Configuracion from '../models/Configuracion.js';
import { JWT_SECRET, validarMasterKey } from '../middlewares/autenticacion.js';

const router = Router();

export async function requerirSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const tokenHeader = req.headers['x-superadmin-token'] as string;
  const masterKeyHeader = req.headers['x-master-key'] as string;

  if (masterKeyHeader && (await validarMasterKey(masterKeyHeader))) {
    return next();
  }

  let token = tokenHeader;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Acceso denegado al Panel Maestro.' });
  }

  try {
    const decodificado: any = jwt.verify(token, JWT_SECRET);
    if (decodificado.role === 'superadmin') {
      return next();
    }
  } catch {}

  return res.status(403).json({ success: false, message: 'Token de SuperAdmin no válido o expirado.' });
}

// 1. Login Maestro
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(401).json({ success: false, message: 'Contraseña maestra requerida.' });
    }

    const esValida = await validarMasterKey(password);
    if (!esValida) {
      return res.status(401).json({ success: false, message: 'Contraseña maestra incorrecta.' });
    }

    const token = jwt.sign(
      { role: 'superadmin', timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      message: '¡Bienvenido al Panel Maestro de Control!',
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// 2. Métricas Operativas de Plataforma
router.get('/metricas', requerirSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const [totalNegocios, negociosActivos, negociosSuspendidos] = await Promise.all([
      Negocio.countDocuments(),
      Negocio.countDocuments({ isActive: true }),
      Negocio.countDocuments({ isActive: false }),
    ]);

    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const negociosActivosSemana = await Negocio.countDocuments({
      ultimaActividad: { $gte: hace7Dias },
    });

    res.json({
      success: true,
      data: {
        totalNegocios,
        negociosActivos,
        negociosSuspendidos,
        negociosActivosSemana,
        dbStatus: {
          connected: true,
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error al obtener métricas.' });
  }
});

// 3. Directorio de Negocios con Estado En Línea y Última Actividad (Sin exponer pinHash)
router.get('/negocios', requerirSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const negocios = await Negocio.find().select('-pinHash').sort({ createdAt: -1 });

    const lista = await Promise.all(
      negocios.map(async (neg) => {
        const [ultimaVenta, totalProductos] = await Promise.all([
          Venta.findOne({ negocioId: neg.codigo }).sort({ createdAt: -1 }).select('createdAt'),
          Producto.countDocuments({ negocioId: neg.codigo, isActive: true }),
        ]);

        const fechasReales = [
          neg.ultimaActividad,
          neg.ultimoLogin,
          ultimaVenta ? ultimaVenta.createdAt : null,
        ].filter(Boolean) as Date[];

        let fechaActividadReal: Date | null = null;
        if (fechasReales.length > 0) {
          fechasReales.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          fechaActividadReal = fechasReales[0];
        }

        return {
          id: neg._id,
          codigo: neg.codigo,
          nombre: neg.nombre,
          telefono: neg.telefono || '',
          isActive: neg.isActive,
          enLinea: Boolean(neg.enLinea),
          createdAt: neg.createdAt,
          totalProductosCount: totalProductos,
          ultimaActividad: fechaActividadReal,
          ultimoCierreSesion: neg.ultimoCierreSesion || null,
        };
      })
    );

    res.json({ success: true, count: lista.length, data: lista });
  } catch {
    res.status(500).json({ success: false, message: 'Error al consultar negocios.' });
  }
});

// 4. Registrar Nuevo Negocio
router.post('/negocios', requerirSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { nombre, codigo, pin, telefono } = req.body;

    if (!nombre || !codigo || !pin) {
      return res.status(400).json({ success: false, message: 'Nombre, código y PIN son obligatorios.' });
    }

    const codigoNormalizado = String(codigo).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    if (codigoNormalizado.length < 3) {
      return res.status(400).json({ success: false, message: 'El código debe tener al menos 3 caracteres alfanuméricos.' });
    }

    if (String(pin).length !== 4) {
      return res.status(400).json({ success: false, message: 'El PIN debe tener exactamente 4 dígitos numéricos.' });
    }

    const existente = await Negocio.findOne({ codigo: codigoNormalizado });
    if (existente) {
      return res.status(400).json({ success: false, message: `El código "${codigoNormalizado}" ya está registrado en el sistema.` });
    }

    const pinHash = await bcrypt.hash(String(pin), 10);

    const nuevo = new Negocio({
      codigo: codigoNormalizado,
      nombre: String(nombre).trim(),
      pinHash,
      telefono: telefono ? String(telefono).trim() : '',
      isActive: true,
      enLinea: false,
      ultimaActividad: null,
      ultimoLogin: null,
      ultimoCierreSesion: null,
    });

    const guardado = await nuevo.save();

    await Producto.create([
      {
        negocioId: guardado.codigo,
        name: 'Platillo Especial 1',
        category: 'Especialidades',
        salePrice: 150,
        costPrice: 50,
        description: 'Platillo principal del menú.',
        isActive: true,
      },
      {
        negocioId: guardado.codigo,
        name: 'Bebida de la Casa',
        category: 'Bebidas',
        salePrice: 35,
        costPrice: 12,
        description: 'Bebida refrescante.',
        isActive: true,
      },
    ]);

    const resultadoSeguro = guardado.toObject();
    delete (resultadoSeguro as any).pinHash;

    res.status(201).json({
      success: true,
      data: resultadoSeguro,
      message: `¡Negocio "${guardado.nombre}" registrado con éxito!`,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error al registrar el negocio.' });
  }
});

// 5. Editar Datos de Contacto
router.put('/negocios/:codigo', requerirSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { nombre, telefono } = req.body;
    const negocio = await Negocio.findOne({ codigo: req.params.codigo }).select('-pinHash');

    if (!negocio) {
      return res.status(404).json({ success: false, message: 'Negocio no encontrado.' });
    }

    if (nombre) negocio.nombre = String(nombre).trim();
    if (telefono !== undefined) negocio.telefono = String(telefono).trim();

    await negocio.save();

    res.json({ success: true, data: negocio, message: 'Datos actualizados.' });
  } catch {
    res.status(500).json({ success: false, message: 'Error al actualizar negocio.' });
  }
});

// 6. Cambiar Estado (Activar / Suspender)
router.put('/negocios/:codigo/estado', requerirSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    const negocio = await Negocio.findOne({ codigo: req.params.codigo }).select('-pinHash');

    if (!negocio) {
      return res.status(404).json({ success: false, message: 'Negocio no encontrado.' });
    }

    negocio.isActive = Boolean(isActive);
    if (!negocio.isActive) {
      negocio.enLinea = false;
    }
    await negocio.save();

    res.json({
      success: true,
      data: negocio,
      message: `El negocio "${negocio.nombre}" ahora está ${negocio.isActive ? 'ACTIVO' : 'SUSPENDIDO'}.`,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error al cambiar estado del negocio.' });
  }
});

// 7. Resetear PIN
router.put('/negocios/:codigo/reset-pin', requerirSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { nuevoPin } = req.body;

    if (!nuevoPin || String(nuevoPin).length !== 4) {
      return res.status(400).json({ success: false, message: 'El nuevo PIN debe tener exactamente 4 dígitos numéricos.' });
    }

    const negocio = await Negocio.findOne({ codigo: req.params.codigo });
    if (!negocio) {
      return res.status(404).json({ success: false, message: 'Negocio no encontrado.' });
    }

    negocio.pinHash = await bcrypt.hash(String(nuevoPin), 10);
    await negocio.save();

    res.json({
      success: true,
      message: `¡PIN del negocio "${negocio.nombre}" actualizado correctamente!`,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error al resetear PIN.' });
  }
});

// 8. Eliminar Negocio
router.delete('/negocios/:codigo', requerirSuperAdmin, async (req: Request, res: Response) => {
  try {
    const codigo = req.params.codigo;

    if (codigo === 'elharocho') {
      return res.status(400).json({ success: false, message: 'No se puede eliminar el negocio principal base.' });
    }

    const negocio = await Negocio.findOneAndDelete({ codigo });
    if (!negocio) {
      return res.status(404).json({ success: false, message: 'Negocio no encontrado.' });
    }

    await Promise.all([
      Producto.deleteMany({ negocioId: codigo }),
      Venta.deleteMany({ negocioId: codigo }),
      Gasto.deleteMany({ negocioId: codigo }),
    ]);

    res.json({ success: true, message: `Negocio "${negocio.nombre}" eliminado.` });
  } catch {
    res.status(500).json({ success: false, message: 'Error al eliminar negocio.' });
  }
});

// 9. Cambiar Contraseña Maestra de SuperAdmin con Persistencia Segura en Base de Datos
router.post('/cambiar-password-maestra', requerirSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { passwordActual, nuevoPassword } = req.body;

    if (!passwordActual || !(await validarMasterKey(passwordActual))) {
      return res.status(401).json({ success: false, message: 'La contraseña maestra actual es incorrecta.' });
    }

    if (!nuevoPassword || String(nuevoPassword).length < 8) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    const hashNuevo = await bcrypt.hash(String(nuevoPassword), 10);

    await Configuracion.findOneAndUpdate(
      { clave: 'superadmin_master_password' },
      { clave: 'superadmin_master_password', valor: hashNuevo },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: '¡Contraseña maestra actualizada y persistida exitosamente!' });
  } catch {
    res.status(500).json({ success: false, message: 'Error al actualizar contraseña maestra.' });
  }
});

export default router;
