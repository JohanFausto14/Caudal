import { Router, Request, Response } from 'express';
import Venta from '../models/Venta.js';
import Gasto from '../models/Gasto.js';
import Producto from '../models/Producto.js';
import mongoose from 'mongoose';
import { construirFiltroFechas } from '../utils/fechas.js';
import { RequestAutenticado, requerirNegocio } from '../middlewares/autenticacion.js';

const router = Router();

// Health check público para diagnóstico de base de datos y foquito
router.get('/health', async (req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      connected: isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || '127.0.0.1',
      dbName: mongoose.connection.name || 'negocio_comida',
      uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/negocio_comida',
    },
  });
});

// Estadísticas protegidas por negocio
router.get('/', requerirNegocio, async (req: RequestAutenticado, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const salesDateFilter = construirFiltroFechas(startDate, endDate, 'createdAt');
    const expensesDateFilter = construirFiltroFechas(startDate, endDate, 'date');

    const salesQuery = { ...salesDateFilter, negocioId: req.negocioId };
    const expensesQuery = { ...expensesDateFilter, negocioId: req.negocioId };

    const [sales, expenses, productsCount] = await Promise.all([
      Venta.find(salesQuery),
      Gasto.find(expensesQuery),
      Producto.countDocuments({ negocioId: req.negocioId, isActive: true }),
    ]);

    const totalIncome = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
    const totalCostOfGoodsSold = sales.reduce((acc, sale) => acc + (sale.totalCost || 0), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

    const netBalance = totalIncome - totalExpenses;
    const isProfit = netBalance >= 0;
    const profitMarginPercent = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(2) : 0;
    const grossMargin = totalIncome - totalCostOfGoodsSold;

    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    const salesByPaymentMethod: Record<string, { count: number; total: number }> = {
      Efectivo: { count: 0, total: 0 },
      Tarjeta: { count: 0, total: 0 },
      Transferencia: { count: 0, total: 0 },
      Otro: { count: 0, total: 0 },
    };

    const productSalesMap: Record<string, { name: string; quantity: number; total: number; cost: number; profit: number }> = {};

    sales.forEach((sale) => {
      const method = sale.paymentMethod || 'Efectivo';
      if (!salesByPaymentMethod[method]) {
        salesByPaymentMethod[method] = { count: 0, total: 0 };
      }
      salesByPaymentMethod[method].count += 1;
      salesByPaymentMethod[method].total += sale.total;

      sale.items.forEach((item) => {
        const key = item.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: item.name,
            quantity: 0,
            total: 0,
            cost: 0,
            profit: 0,
          };
        }
        productSalesMap[key].quantity += item.quantity;
        productSalesMap[key].total += item.subtotal;
        productSalesMap[key].cost += item.costSubtotal;
        productSalesMap[key].profit += (item.subtotal - item.costSubtotal);
      });
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netBalance,
          isProfit,
          profitMarginPercent: Number(profitMarginPercent),
          totalCostOfGoodsSold,
          grossMargin,
          totalSalesCount: sales.length,
          totalExpensesCount: expenses.length,
          totalProductsCount: productsCount,
        },
        expensesByCategory,
        salesByPaymentMethod,
        topSellingProducts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
