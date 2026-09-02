import mongoose, { Schema, Document } from 'mongoose';

export interface IGasto extends Document {
  negocioId: string;
  concept: string;
  category: string;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EsquemaGasto: Schema = new Schema(
  {
    negocioId: { type: String, required: true, index: true, lowercase: true, trim: true },
    concept: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'Ingredientes / Mariscos frescos' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

EsquemaGasto.index({ negocioId: 1, date: -1 });
EsquemaGasto.index({ negocioId: 1, category: 1 });

export default mongoose.model<IGasto>('Gasto', EsquemaGasto);
