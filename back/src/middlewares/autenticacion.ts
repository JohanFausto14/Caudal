import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Negocio from '../models/Negocio.js';
import Configuracion from '../models/Configuracion.js';
import bcrypt from 'bcryptjs';

export const JWT_SECRET = process.env.JWT_SECRET || 'finanzas_super_secret_key_9823471029837419';
const DEFAULT_MASTER_PASSWORD = process.env.SUPERADMIN_MASTER_PASSWORD || 'AdminMaestroFinanzas2026!#';

// Estructura extendida de Request de Express
export interface RequestAutenticado extends Request {
  negocioId?: string;
  negocio?: any;
}

// Sanitizador estricto contra Inyección NoSQL y Prototype Pollution
export function sanitizarEntrada(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizarEntrada);
  }

  const limpio: any = {};
  for (const key of Object.keys(obj)) {
    // Bloqueo de operadores NoSQL y Prototype Pollution
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    ) {
      continue;
    }
    limpio[key] = sanitizarEntrada(obj[key]);
  }
  return limpio;
}

export function middlewareSanitizacion(req: Request, res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizarEntrada(req.body);
  if (req.query) req.query = sanitizarEntrada(req.query);
  if (req.params) req.params = sanitizarEntrada(req.params);
  next();
}

// Obtener la clave maestra actual validada contra BD o fallback seguro
export async function validarMasterKey(providedKey: string): Promise<boolean> {
  if (!providedKey || typeof providedKey !== 'string' || providedKey.trim().length === 0) {
    return false;
  }

  try {
    const configMaster = await Configuracion.findOne({ clave: 'superadmin_master_password' });
    if (configMaster && configMaster.valor) {
      if (configMaster.valor.startsWith('$2a$') || configMaster.valor.startsWith('$2b$')) {
        return await bcrypt.compare(providedKey, configMaster.valor);
      }
      return providedKey === configMaster.valor;
    }
  } catch {}

  return providedKey === DEFAULT_MASTER_PASSWORD;
}

// Middleware de Aislamiento y Autenticación ESTRICTA
export async function requerirNegocio(req: RequestAutenticado, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const tokenHeader = req.headers['x-negocio-token'] as string;
    const masterKeyHeader = req.headers['x-master-key'] as string;

    // Acceso permitido con Master Key de SuperAdmin validada de forma estricta
    if (masterKeyHeader && (await validarMasterKey(masterKeyHeader))) {
      const codigoSlug = (req.headers['x-negocio-codigo'] as string) || 'elharocho';
      req.negocioId = codigoSlug;
      return next();
    }

    let token = tokenHeader;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Se requiere iniciar sesión con el PIN de seguridad del negocio.',
      });
    }

    try {
      const decodificado: any = jwt.verify(token, JWT_SECRET);
      if (!decodificado.codigo) {
        return res.status(401).json({ success: false, message: 'Token de acceso inválido.' });
      }

      const negocio = await Negocio.findOne({ codigo: decodificado.codigo, isActive: true });
      if (!negocio) {
        return res.status(403).json({ success: false, message: 'El negocio no existe o se encuentra suspendido.' });
      }

      // Actualizar última actividad en tiempo real de forma asíncrona
      Negocio.updateOne({ codigo: negocio.codigo }, { $set: { ultimaActividad: new Date() } }).exec();

      req.negocioId = negocio.codigo;
      req.negocio = negocio;
      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Sesión expirada o token inválido. Ingresa tu PIN de nuevo.' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error interno de autenticación.' });
  }
}
