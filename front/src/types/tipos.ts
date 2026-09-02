export interface Negocio {
  id?: string;
  codigo: string;
  nombre: string;
  telefono?: string;
  logoUrl?: string;
}

export interface Product {
  _id?: string;
  id?: string;
  negocioId?: string;
  name: string;
  category: string;
  salePrice: number;
  costPrice: number;
  description?: string;
  icon?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  costSubtotal: number;
}

export interface Sale {
  _id?: string;
  id?: string;
  negocioId?: string;
  items: SaleItem[];
  total: number;
  totalCost: number;
  profit: number;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro';
  customerName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  _id?: string;
  id?: string;
  negocioId?: string;
  concept: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  isProfit: boolean;
  profitMarginPercent: number;
  totalCostOfGoodsSold: number;
  grossMargin: number;
  totalSalesCount: number;
  totalExpensesCount: number;
  totalProductsCount: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  total: number;
  cost: number;
  profit: number;
}

export interface StatsResponse {
  summary: FinancialSummary;
  expensesByCategory: Record<string, number>;
  salesByPaymentMethod: Record<string, { count: number; total: number }>;
  topSellingProducts: TopProduct[];
}

export interface DatabaseStatus {
  connected: boolean;
  readyState: number;
  host: string;
  dbName: string;
  uri?: string;
}

export interface RespuestaAutenticacion {
  success: boolean;
  token?: string;
  negocio?: Negocio;
  message?: string;
}
