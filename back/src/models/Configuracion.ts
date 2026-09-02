import mongoose, { Schema, Document } from 'mongoose';

export interface IConfiguracion extends Document {
  clave: string;
  valor: string;
  updatedAt: Date;
}

const EsquemaConfiguracion: Schema = new Schema(
  {
    clave: { type: String, required: true, unique: true, trim: true },
    valor: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IConfiguracion>('Configuracion', EsquemaConfiguracion);
