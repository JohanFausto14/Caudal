import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/negocio_comida';

export const conectarBD = async (): Promise<boolean> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[MongoDB] Conectado exitosamente en: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    console.warn(`[MongoDB] No disponible (${error.message}). El backend operara con modo de respaldo.`);
    return false;
  }
};
