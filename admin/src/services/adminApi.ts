export interface NegocioAdmin {
  id: string;
  codigo: string;
  nombre: string;
  telefono?: string;
  isActive: boolean;
  enLinea: boolean;
  createdAt: string;
  totalProductosCount: number;
  ultimaActividad: string | null;
  ultimoCierreSesion: string | null;
}

export interface MetricasPlataforma {
  totalNegocios: number;
  negociosActivos: number;
  negociosSuspendidos: number;
  negociosActivosSemana: number;
  dbStatus: {
    connected: boolean;
    dbName: string;
    host: string;
  };
}

const BASE_API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_API}/superadmin`;

class AdminApiClient {
  private getToken(): string {
    try {
      return localStorage.getItem('superadmin_token') || '';
    } catch {
      return '';
    }
  }

  setToken(token: string): void {
    try {
      localStorage.setItem('superadmin_token', token);
    } catch {}
  }

  logout(): void {
    try {
      localStorage.removeItem('superadmin_token');
    } catch {}
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    };
  }

  async login(password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.setToken(data.token);
        return { success: true };
      }
      return { success: false, message: data.message || 'Contraseña incorrecta' };
    } catch (err: any) {
      return { success: false, message: 'No se pudo conectar con el servidor backend' };
    }
  }

  async getMetricas(): Promise<MetricasPlataforma | null> {
    try {
      const res = await fetch(`${API_URL}/metricas`, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch {}
    return null;
  }

  async getNegocios(): Promise<NegocioAdmin[]> {
    try {
      const res = await fetch(`${API_URL}/negocios`, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.data || [];
      }
    } catch {}
    return [];
  }

  async createNegocio(data: { nombre: string; codigo: string; pin: string; telefono?: string }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await fetch(`${API_URL}/negocios`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return { success: res.ok && json.success, message: json.message, data: json.data };
    } catch (err: any) {
      return { success: false, message: 'Error de red al crear negocio' };
    }
  }

  async updateNegocio(codigo: string, data: { nombre?: string; telefono?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_URL}/negocios/${codigo}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return { success: res.ok && json.success, message: json.message };
    } catch {
      return { success: false, message: 'Error al actualizar datos' };
    }
  }

  async toggleEstado(codigo: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_URL}/negocios/${codigo}/estado`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      return { success: res.ok && json.success, message: json.message };
    } catch {
      return { success: false, message: 'Error al cambiar estado' };
    }
  }

  async resetPin(codigo: string, nuevoPin: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_URL}/negocios/${codigo}/reset-pin`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ nuevoPin }),
      });
      const json = await res.json();
      return { success: res.ok && json.success, message: json.message };
    } catch {
      return { success: false, message: 'Error al resetear PIN' };
    }
  }

  async deleteNegocio(codigo: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_URL}/negocios/${codigo}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const json = await res.json();
      return { success: res.ok && json.success, message: json.message };
    } catch {
      return { success: false, message: 'Error al eliminar negocio' };
    }
  }

  async cambiarPasswordMaestra(passwordActual: string, nuevoPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_URL}/cambiar-password-maestra`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ passwordActual, nuevoPassword }),
      });
      const json = await res.json();
      return { success: res.ok && json.success, message: json.message };
    } catch {
      return { success: false, message: 'Error al cambiar contraseña maestra' };
    }
  }
}

export const adminApi = new AdminApiClient();
