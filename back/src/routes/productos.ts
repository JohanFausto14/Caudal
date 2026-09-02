import { Router, Response } from 'express';
import Producto from '../models/Producto.js';
import { RequestAutenticado, requerirNegocio } from '../middlewares/autenticacion.js';

const router = Router();

router.use(requerirNegocio);

router.get('/', async (req: RequestAutenticado, res: Response) => {
  try {
    const { category, isActive } = req.query;
    let query: any = { negocioId: req.negocioId };

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const products = await Producto.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req: RequestAutenticado, res: Response) => {
  try {
    const { name, category, salePrice, costPrice, description, icon } = req.body;

    if (!name || salePrice === undefined) {
      return res.status(400).json({ success: false, message: 'El nombre y precio de venta son obligatorios' });
    }

    const newProduct = new Producto({
      negocioId: req.negocioId,
      name: String(name).trim(),
      category: category || 'Especialidades',
      salePrice: Number(salePrice),
      costPrice: Number(costPrice) || 0,
      description: description || '',
      icon: icon || '',
      isActive: true,
    });

    const saved = await newProduct.save();
    res.status(201).json({ success: true, data: saved, message: 'Platillo creado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req: RequestAutenticado, res: Response) => {
  try {
    const { name, category, salePrice, costPrice, description, icon, isActive } = req.body;

    const updated = await Producto.findOneAndUpdate(
      { _id: req.params.id, negocioId: req.negocioId },
      {
        ...(name && { name: String(name).trim() }),
        ...(category && { category }),
        ...(salePrice !== undefined && { salePrice: Number(salePrice) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Platillo no encontrado en este negocio' });
    }

    res.json({ success: true, data: updated, message: 'Platillo actualizado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req: RequestAutenticado, res: Response) => {
  try {
    const deleted = await Producto.findOneAndDelete({ _id: req.params.id, negocioId: req.negocioId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Platillo no encontrado' });
    }
    res.json({ success: true, message: 'Platillo eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
