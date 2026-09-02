import mongoose, { Schema, Document } from 'mongoose';

export interface IItemVenta {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  costSubtotal: number;
}

export interface IVenta extends Document {
  negocioId: string;
  items: IItemVenta[];
  total: number;
  totalCost: number;
  profit: number;
  paymentMethod: string;
  customerName: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const EsquemaItemVenta = new Schema({
  productId: { type: String },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  costSubtotal: { type: Number, default: 0, min: 0 },
});

const EsquemaVenta: Schema = new Schema(
  {
    negocioId: { type: String, required: true, index: true, lowercase: true, trim: true },
    items: [EsquemaItemVenta],
    total: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    profit: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Efectivo', enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'] },
    customerName: { type: String, default: 'Cliente Mostrador' },
    notes: { type: String, default: 'Sin nota' },
  },
  {
    timestamps: true,
  }
);

EsquemaVenta.index({ negocioId: 1, createdAt: -1 });

export default mongoose.model<IVenta>('Venta', EsquemaVenta);
