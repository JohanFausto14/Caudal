/**
 * Utilidad compartida de construcción de filtros de fechas para consultas de MongoDB.
 */
export function construirFiltroFechas(startDate?: any, endDate?: any, campo: string = 'date') {
  const query: any = {};
  if (!startDate && !endDate) return query;

  query[campo] = {};

  if (startDate) {
    if (typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      const [y, m, d] = startDate.trim().split('-').map(Number);
      query[campo].$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
      const s = new Date(startDate);
      if (!isNaN(s.getTime())) query[campo].$gte = s;
    }
  }

  if (endDate) {
    if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      const [y, m, d] = endDate.trim().split('-').map(Number);
      query[campo].$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      const e = new Date(endDate);
      if (!isNaN(e.getTime())) query[campo].$lte = e;
    }
  }

  return query;
}
