/**
 * Utilidades de fecha 100% precisas para zona horaria local.
 * Evita desfasajes de UTC al guardar, filtrar y mostrar fechas.
 */

export const obtenerFechaHoyLocal = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const obtenerClaveFechaLocal = (val: string | Date | undefined): string => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }
  const d = typeof val === 'string' ? new Date(val) : val;
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatearFechaLocal = (val: string | Date | undefined): string => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    const [y, m, d] = val.trim().split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  const d = typeof val === 'string' ? new Date(val) : val;
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatearHoraLocal = (val: string | Date | undefined): string => {
  if (!val) return '--:--';
  const d = typeof val === 'string' ? new Date(val) : val;
  if (!d || isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

export const obtenerRangosPeriodoClaves = (periodo: 'today' | 'week' | 'month' | 'all') => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  const fmt = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  if (periodo === 'today') {
    const todayStr = fmt(y, m, d);
    return { start: todayStr, end: todayStr };
  }
  if (periodo === 'week') {
    const dayOfWeek = now.getDay() || 7; // Lunes = 1
    const monday = new Date(y, m, d - dayOfWeek + 1);
    const sunday = new Date(y, m, d - dayOfWeek + 7);
    return {
      start: fmt(monday.getFullYear(), monday.getMonth(), monday.getDate()),
      end: fmt(sunday.getFullYear(), sunday.getMonth(), sunday.getDate()),
    };
  }
  if (periodo === 'month') {
    const firstDayStr = fmt(y, m, 1);
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
    const lastDayStr = fmt(y, m, lastDayOfMonth);
    return { start: firstDayStr, end: lastDayStr };
  }
  return { start: undefined, end: undefined };
};
