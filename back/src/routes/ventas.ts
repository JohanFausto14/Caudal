import { Router, Response } from 'express';
import Venta from '../models/Venta.js';
import { construirFiltroFechas } from '../utils/fechas.js';
import { RequestAutenticado, requerirNegocio } from '../middlewares/autenticacion.js';

const router = Router();

router.use(requerirNegocio);

router.get('/', async (req: RequestAutenticado, res: Response) => {
  try {
    const { startDate, endDate, limit = 200 } = req.query;
    const dateQuery = construirFiltroFechas(startDate, endDate, 'createdAt');
    const query = { ...dateQuery, negocioId: req.negocioId };

    const sales = await Venta.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: sales.length, data: sales });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req: RequestAutenticado, res: Response) => {
  try {
    const { items, paymentMethod, customerName, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'La venta debe contener al menos un platillo' });
    }

    let calculatedTotal = 0;
    let calculatedCost = 0;

    const processedItems = items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const cost = Number(item.unitCost) || 0;
      const subtotal = qty * price;
      const costSubtotal = qty * cost;

      calculatedTotal += subtotal;
      calculatedCost += costSubtotal;

      return {
        productId: item.productId,
        name: item.name,
        quantity: qty,
        unitPrice: price,
        unitCost: cost,
        subtotal,
        costSubtotal,
      };
    });

    const newSale = new Venta({
      negocioId: req.negocioId,
      items: processedItems,
      total: calculatedTotal,
      totalCost: calculatedCost,
      profit: calculatedTotal - calculatedCost,
      paymentMethod: paymentMethod || 'Efectivo',
      customerName: customerName ? customerName.trim() : 'Cliente Mostrador',
      notes: notes && notes.trim() ? notes.trim() : 'Sin nota',
    });

    const saved = await newSale.save();
    res.status(201).json({ success: true, data: saved, message: 'Venta registrada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req: RequestAutenticado, res: Response) => {
  try {
    const deleted = await Venta.findOneAndDelete({ _id: req.params.id, negocioId: req.negocioId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Venta no encontrada' });
    res.json({ success: true, message: 'Venta eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
