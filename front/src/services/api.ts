import {
  Product,
  Sale,
  Expense,
  StatsResponse,
  Negocio,
  RespuestaAutenticacion,
} from '../types/tipos';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export function detectarCodigoNegocioDesdeUrl(): string {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const segmentos = path.split('/');
  const primerSegmento = segmentos[0];

  if (primerSegmento && primerSegmento !== 'admin' && primerSegmento !== 'index.html' && primerSegmento !== 'login') {
    return primerSegmento.toLowerCase();
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const paramCodigo = params.get('negocio') || params.get('slug');
    if (paramCodigo) return paramCodigo.toLowerCase();
  } catch {}

  return 'elharocho';
}

class ApiService {
  private getStorageKey(): string {
    const slug = detectarCodigoNegocioDesdeUrl();
    return `finanzas_token_${slug}`;
  }

  private getToken(): string {
    try {
      return localStorage.getItem(this.getStorageKey()) || '';
    } catch {
      return '';
    }
  }

  public setToken(token: string): void {
    try {
      localStorage.setItem(this.getStorageKey(), token);
    } catch {}
  }

  public async logout(): Promise<void> {
    const slug = detectarCodigoNegocioDesdeUrl();
    try {
      localStorage.removeItem(this.getStorageKey());
      // Notificar al backend de forma asíncrona que se cerró la sesión
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: slug }),
      });
    } catch {}
  }

  public isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  public getActiveBusiness(): Negocio {
    const slug = detectarCodigoNegocioDesdeUrl();
    try {
      const guardado = localStorage.getItem(`finanzas_negocio_${slug}`);
      if (guardado) return JSON.parse(guardado);
    } catch {}
    return {
      codigo: slug,
      nombre: slug === 'elharocho' ? 'Tostiaguachiles El Harocho' : `Negocio ${slug}`,
    };
  }

  public setActiveBusiness(negocio: Negocio): void {
    try {
      localStorage.setItem(`finanzas_negocio_${negocio.codigo}`, JSON.stringify(negocio));
    } catch {}
  }

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    const slug = detectarCodigoNegocioDesdeUrl();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-negocio-codigo': slug,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-negocio-token'] = token;
    }

    return headers;
  }

  async getInfoPublicaNegocio(codigo: string): Promise<{ success: boolean; data?: Negocio; message?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/info-publica/${codigo}`);
      const json = await res.json();
      return json;
    } catch {
      return { success: false, message: 'No se pudo conectar con el servidor.' };
    }
  }

  async login(codigo: string, pin: string): Promise<RespuestaAutenticacion> {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, pin }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        this.setToken(data.token);
        if (data.negocio) {
          this.setActiveBusiness(data.negocio);
        }
      }

      return data;
    } catch {
      return { success: false, message: 'Error de conexión al iniciar sesión.' };
    }
  }

  async actualizarLogoNegocio(logoUrl: string | null): Promise<{ success: boolean; logoUrl?: string | null; message?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/logo`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ logoUrl }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const activo = this.getActiveBusiness();
        activo.logoUrl = json.logoUrl || undefined;
        this.setActiveBusiness(activo);
      }
      return json;
    } catch {
      return { success: false, message: 'Error de conexión al actualizar logo.' };
    }
  }

  private guardarEnStorage(key: string, data: any): void {
    try {
      const slug = detectarCodigoNegocioDesdeUrl();
      localStorage.setItem(`finanzas_${slug}_${key}`, JSON.stringify(data));
    } catch {}
  }

  private leerDeStorage<T>(key: string, valorPorDefecto: T): T {
    try {
      const slug = detectarCodigoNegocioDesdeUrl();
      const item = localStorage.getItem(`finanzas_${slug}_${key}`);
      return item ? JSON.parse(item) : valorPorDefecto;
    } catch {
      return valorPorDefecto;
    }
  }

  private agregarAColaSincronizacion(tipo: 'venta' | 'gasto', payload: any): void {
    const slug = detectarCodigoNegocioDesdeUrl();
    const colaKey = `finanzas_cola_${slug}`;
    try {
      const actual = JSON.parse(localStorage.getItem(colaKey) || '[]');
      actual.push({ tipo, payload, timestamp: Date.now() });
      localStorage.setItem(colaKey, JSON.stringify(actual));
    } catch {}
  }

  public getColaSincronizacion(): Array<{ tipo: 'venta' | 'gasto'; payload: any }> {
    const slug = detectarCodigoNegocioDesdeUrl();
    try {
      return JSON.parse(localStorage.getItem(`finanzas_cola_${slug}`) || '[]');
    } catch {
      return [];
    }
  }

  public limpiarColaSincronizacion(): void {
    const slug = detectarCodigoNegocioDesdeUrl();
    try {
      localStorage.removeItem(`finanzas_cola_${slug}`);
    } catch {}
  }

  async getDbHealth(): Promise<{ isOnline: boolean; mongoConnected: boolean; database?: any }> {
    try {
      const res = await fetch(`${BASE_URL}/health`, { method: 'GET' });
      const online = res.ok;
      return { isOnline: online, mongoConnected: online };
    } catch {
      return { isOnline: false, mongoConnected: false };
    }
  }

  async sincronizarPendientes(): Promise<number> {
    const cola = this.getColaSincronizacion();
    if (cola.length === 0) return 0;

    let sincronizados = 0;
    const restantes = [];

    for (const item of cola) {
      try {
        if (item.tipo === 'venta') {
          const res = await fetch(`${BASE_URL}/ventas`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(item.payload),
          });
          if (res.ok) sincronizados++;
          else restantes.push(item);
        } else if (item.tipo === 'gasto') {
          const res = await fetch(`${BASE_URL}/gastos`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(item.payload),
          });
          if (res.ok) sincronizados++;
          else restantes.push(item);
        }
      } catch {
        restantes.push(item);
      }
    }

    const slug = detectarCodigoNegocioDesdeUrl();
    localStorage.setItem(`finanzas_cola_${slug}`, JSON.stringify(restantes));
    return sincronizados;
  }

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${BASE_URL}/productos`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        this.guardarEnStorage('productos', data);
        return data;
      }
    } catch {}
    return this.leerDeStorage<Product[]>('productos', []);
  }

  async createProduct(prod: Partial<Product>): Promise<Product> {
    try {
      const res = await fetch(`${BASE_URL}/productos`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(prod),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    throw new Error('No se pudo crear el producto');
  }

  async updateProduct(id: string, prod: Partial<Product>): Promise<Product | null> {
    try {
      const res = await fetch(`${BASE_URL}/productos/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(prod),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    return null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/productos/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getSales(startDate?: string, endDate?: string): Promise<Sale[]> {
    try {
      let url = `${BASE_URL}/ventas`;
      const p = new URLSearchParams();
      if (startDate) p.append('startDate', startDate);
      if (endDate) p.append('endDate', endDate);
      if (p.toString()) url += `?${p.toString()}`;

      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        if (!startDate && !endDate) {
          this.guardarEnStorage('ventas', data);
        }
        return data;
      }
    } catch {}
    return this.leerDeStorage<Sale[]>('ventas', []);
  }

  async createSale(sale: Partial<Sale>): Promise<Sale> {
    try {
      const res = await fetch(`${BASE_URL}/ventas`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(sale),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const localSale: Sale = {
      _id: 'local_' + Date.now(),
      id: 'local_' + Date.now(),
      items: sale.items || [],
      total: sale.total || 0,
      totalCost: sale.totalCost || 0,
      profit: (sale.total || 0) - (sale.totalCost || 0),
      paymentMethod: sale.paymentMethod || 'Efectivo',
      customerName: sale.customerName || 'Cliente Mostrador',
      notes: sale.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.agregarAColaSincronizacion('venta', sale);
    const ventas = this.leerDeStorage<Sale[]>('ventas', []);
    ventas.unshift(localSale);
    this.guardarEnStorage('ventas', ventas);
    return localSale;
  }

  async deleteSale(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/ventas/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
    try {
      let url = `${BASE_URL}/gastos`;
      const p = new URLSearchParams();
      if (startDate) p.append('startDate', startDate);
      if (endDate) p.append('endDate', endDate);
      if (p.toString()) url += `?${p.toString()}`;

      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        if (!startDate && !endDate) {
          this.guardarEnStorage('gastos', data);
        }
        return data;
      }
    } catch {}
    return this.leerDeStorage<Expense[]>('gastos', []);
  }

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    try {
      const res = await fetch(`${BASE_URL}/gastos`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(expense),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const localExpense: Expense = {
      _id: 'local_gasto_' + Date.now(),
      id: 'local_gasto_' + Date.now(),
      concept: expense.concept || 'Gasto General',
      amount: expense.amount || 0,
      category: expense.category || 'Insumos',
      date: expense.date || new Date().toISOString(),
      notes: expense.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.agregarAColaSincronizacion('gasto', expense);
    const gastos = this.leerDeStorage<Expense[]>('gastos', []);
    gastos.unshift(localExpense);
    this.guardarEnStorage('gastos', gastos);
    return localExpense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/gastos/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getStats(startDate?: string, endDate?: string): Promise<StatsResponse | null> {
    try {
      let url = `${BASE_URL}/estadisticas`;
      const p = new URLSearchParams();
      if (startDate) p.append('startDate', startDate);
      if (endDate) p.append('endDate', endDate);
      if (p.toString()) url += `?${p.toString()}`;

      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    return null;
  }
}

export const api = new ApiService();
