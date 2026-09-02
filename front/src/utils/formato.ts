import type { Sale, Expense } from '../types/tipos';

/**
 * Utilidades centralizadas de formato de moneda, texto y reglas de negocio.
 */

export const formatearMoneda = (amount: number | undefined | null): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatearMonedaCompacta = (amount: number | undefined | null): string => {
  const val = amount || 0;
  if (val >= 10000) {
    return `$${(val / 1000).toFixed(1)}k`;
  }
  return `$${Math.round(val)}`;
};

export const formatearNombrePlatilloPlural = (nombre: string, cantidad: number): string => {
  if (cantidad <= 1) return nombre;

  const nombreNormalizado = nombre.trim().toLowerCase();

  if (nombreNormalizado === 'aguachile negro') {
    return 'Aguachiles Negros';
  }
  if (nombreNormalizado === 'tostiaguachile') {
    return 'Tostiaguachiles';
  }

  if (nombre.endsWith('s') || nombre.endsWith('x')) {
    return nombre;
  }
  if (/[aeiouáéíóú]$/i.test(nombre)) {
    return `${nombre}s`;
  }
  return `${nombre}es`;
};

export const obtenerId = (item: { _id?: string; id?: string } | undefined | null): string => {
  if (!item) return '';
  return item._id || item.id || '';
};

export interface ResumenContable {
  totalVentas: number;
  totalGastos: number;
  totalCostoInsumos: number;
  balanceNeto: number;
  margenBruto: number;
  esGanancia: boolean;
  margenGananciaPorcentaje: number;
  cantidadVentas: number;
  cantidadGastos: number;
}

/**
 * Función contable única que unifica el cálculo exacto de ingresos,
 * costos de insumos, gastos y márgenes para todas las vistas del sistema.
 */
export const calcularBalanceGlobal = (sales: Sale[], expenses: Expense[]): ResumenContable => {
  const totalVentas = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalCostoInsumos = sales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const totalGastos = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const balanceNeto = totalVentas - totalGastos;
  const margenBruto = totalVentas - totalCostoInsumos;
  const margenGananciaPorcentaje = totalVentas > 0 ? (balanceNeto / totalVentas) * 100 : 0;

  return {
    totalVentas,
    totalGastos,
    totalCostoInsumos,
    balanceNeto,
    margenBruto,
    esGanancia: balanceNeto >= 0,
    margenGananciaPorcentaje: Number(margenGananciaPorcentaje.toFixed(2)),
    cantidadVentas: sales.length,
    cantidadGastos: expenses.length,
  };
};

export const CATEGORIAS_GASTOS = [
  'Ingredientes / Mariscos frescos',
  'Limón, Verduras y Especias',
  'Tostadas, Empaques y Desechables',
  'Bebidas e Insumos de Barra',
  'Servicios (Gas, Luz, Hielo)',
  'Equipo y Utensilios',
  'Otros Gastos',
] as const;

export type CategoriaGasto = typeof CATEGORIAS_GASTOS[number];
