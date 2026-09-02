import mongoose, { Schema, Document } from 'mongoose';

export interface IProducto extends Document {
  negocioId: string;
  name: string;
  category: string;
  salePrice: number;
  costPrice: number;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EsquemaProducto: Schema = new Schema(
  {
    negocioId: { type: String, required: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'Especialidades' },
    salePrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

EsquemaProducto.index({ negocioId: 1, isActive: 1 });
EsquemaProducto.index({ negocioId: 1, name: 1 });

export default mongoose.model<IProducto>('Producto', EsquemaProducto);
