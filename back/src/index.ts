import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { conectarBD } from './config/basedatos.js';
import { middlewareSanitizacion } from './middlewares/autenticacion.js';
import rutasAuth from './routes/auth.js';
import rutasSuperAdmin from './routes/superadmin.js';
import rutasProductos from './routes/productos.js';
import rutasVentas from './routes/ventas.js';
import rutasGastos from './routes/gastos.js';
import rutasEstadisticas from './routes/estadisticas.js';
import Negocio from './models/Negocio.js';
import Producto from './models/Producto.js';
import Venta from './models/Venta.js';
import Gasto from './models/Gasto.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use(middlewareSanitizacion);

// Rutas de la API
app.use('/api/superadmin', rutasSuperAdmin);
app.use('/api/auth', rutasAuth);
app.use('/api/productos', rutasProductos);
app.use('/api/ventas', rutasVentas);
app.use('/api/gastos', rutasGastos);
app.use('/api/estadisticas', rutasEstadisticas);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Función de arranque, seeding y migración automática segura
async function inicializarSistema() {
  await conectarBD();

  try {
    // 1. Verificar si existe el negocio oficial 'elharocho'
    let harocho = await Negocio.findOne({ codigo: 'elharocho' });

    if (!harocho) {
      const pinHash = await bcrypt.hash('7842', 10);
      harocho = new Negocio({
        codigo: 'elharocho',
        nombre: 'Tostiaguachiles El Harocho',
        pinHash,
        telefono: '999-000-0000',
        isActive: true,
      });
      await harocho.save();
      console.log('[Multi-Tenant] Negocio oficial "Tostiaguachiles El Harocho" inicializado.');
    }

    // 2. Migrar registros históricos sin negocioId para que no se pierda ningún dato
    const [prodsMigrados, ventasMigradas, gastosMigrados] = await Promise.all([
      Producto.updateMany({ negocioId: { $exists: false } }, { $set: { negocioId: 'elharocho' } }),
      Venta.updateMany({ negocioId: { $exists: false } }, { $set: { negocioId: 'elharocho' } }),
      Gasto.updateMany({ negocioId: { $exists: false } }, { $set: { negocioId: 'elharocho' } }),
    ]);

    if (prodsMigrados.modifiedCount || ventasMigradas.modifiedCount || gastosMigrados.modifiedCount) {
      console.log(`[Multi-Tenant] Migrados a El Harocho: ${prodsMigrados.modifiedCount} productos, ${ventasMigradas.modifiedCount} ventas, ${gastosMigrados.modifiedCount} gastos.`);
    }
  } catch (err: any) {
    console.error('[Multi-Tenant] Error en inicialización/migración:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[Finanzas Multi-Tenant Backend] Servidor activo en http://localhost:${PORT}`);
  });
}

inicializarSistema();
