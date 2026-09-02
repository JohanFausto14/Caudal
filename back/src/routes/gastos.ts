import { Router, Response } from 'express';
import Gasto from '../models/Gasto.js';
import { construirFiltroFechas } from '../utils/fechas.js';
import { RequestAutenticado, requerirNegocio } from '../middlewares/autenticacion.js';

const router = Router();

router.use(requerirNegocio);

router.get('/', async (req: RequestAutenticado, res: Response) => {
  try {
    const { startDate, endDate, category } = req.query;
    const dateFilter = construirFiltroFechas(startDate, endDate, 'date');
    let query: any = { ...dateFilter, negocioId: req.negocioId };

    if (category) query.category = category;

    const expenses = await Gasto.find(query).sort({ date: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req: RequestAutenticado, res: Response) => {
  try {
    const { concept, category, amount, date, notes } = req.body;

    if (!concept || amount === undefined) {
      return res.status(400).json({ success: false, message: 'El concepto y monto son obligatorios' });
    }

    let parsedDate = new Date();
    if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      const [y, m, d] = date.trim().split('-').map(Number);
      parsedDate = new Date(y, m - 1, d, 12, 0, 0, 0);
    } else if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) parsedDate = d;
    }

    const newExpense = new Gasto({
      negocioId: req.negocioId,
      concept: concept.trim(),
      category: category || 'Ingredientes / Mariscos frescos',
      amount: Number(amount),
      date: parsedDate,
      notes: notes || '',
    });

    const saved = await newExpense.save();
    res.status(201).json({ success: true, data: saved, message: 'Gasto registrado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req: RequestAutenticado, res: Response) => {
  try {
    const deleted = await Gasto.findOneAndDelete({ _id: req.params.id, negocioId: req.negocioId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Gasto no encontrado' });
    res.json({ success: true, message: 'Gasto eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
