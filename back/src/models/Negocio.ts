import mongoose, { Document, Schema } from 'mongoose';

export interface INegocio extends Document {
  codigo: string;
  nombre: string;
  pinHash: string;
  telefono?: string;
  logoUrl?: string | null;
  isActive: boolean;
  enLinea: boolean;
  ultimaActividad?: Date | null;
  ultimoLogin?: Date | null;
  ultimoCierreSesion?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NegocioSchema: Schema = new Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    pinHash: {
      type: String,
      required: true,
    },
    telefono: {
      type: String,
      default: '',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    enLinea: {
      type: Boolean,
      default: false,
    },
    ultimaActividad: {
      type: Date,
      default: null,
    },
    ultimoLogin: {
      type: Date,
      default: null,
    },
    ultimoCierreSesion: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Negocio || mongoose.model<INegocio>('Negocio', NegocioSchema);
