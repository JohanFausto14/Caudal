import React, { useState, useMemo } from 'react';
import type { Sale, Expense, StatsResponse, Negocio } from '../types/tipos';
import { formatearMoneda } from '../utils/formato';
import {
  obtenerClaveFechaLocal,
  formatearFechaLocal,
  obtenerRangosPeriodoClaves,
} from '../utils/fechas';
import { CalendarioHistorico } from './CalendarioHistorico';

interface PropiedadesDashboard {
  stats: StatsResponse | null;
  recentSales: Sale[];
  recentExpenses: Expense[];
  allSales: Sale[];
  allExpenses: Expense[];
  negocioActivo?: Negocio;
  onNavigate: (pestana: 'dashboard' | 'pos' | 'products' | 'expenses') => void;
  onRefresh?: () => void;
  period: 'today' | 'week' | 'month' | 'all';
  setPeriod: (period: 'today' | 'week' | 'month' | 'all') => void;
}

export const Dashboard: React.FC<PropiedadesDashboard> = ({
  allSales,
  allExpenses,
  setPeriod,
}) => {
  // Modo de visualización: 'today' | 'week' | 'month' | 'calendar' | 'all'
  const [modoActivo, setModoActivo] = useState<'today' | 'week' | 'month' | 'calendar' | 'all'>('today');

  // Modo de selección del calendario: 'single' | 'range'
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');

  // Estado de selección del Calendario
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  // 1. Determinar el rango de fechas activo y la etiqueta descriptiva
  const { startKey, endKey, labelPeriodo } = useMemo(() => {
    if (modoActivo === 'calendar') {
      if (calendarMode === 'range') {
        if (rangeStart && rangeEnd) {
          if (rangeStart === rangeEnd) {
            return {
              startKey: rangeStart,
              endKey: rangeEnd,
              labelPeriodo: formatearFechaLocal(rangeStart),
            };
          }
          return {
            startKey: rangeStart,
            endKey: rangeEnd,
            labelPeriodo: `${formatearFechaLocal(rangeStart)} al ${formatearFechaLocal(rangeEnd)}`,
          };
        }
        return {
          startKey: null,
          endKey: null,
          labelPeriodo: 'Histórico completo',
        };
      }

      // En modo 'single' (Día individual)
      if (selectedDay) {
        return {
          startKey: selectedDay,
          endKey: selectedDay,
          labelPeriodo: formatearFechaLocal(selectedDay),
        };
      }

      return {
        startKey: null,
        endKey: null,
        labelPeriodo: 'Histórico completo',
      };
    }

    if (modoActivo === 'all') {
      return {
        startKey: null,
        endKey: null,
        labelPeriodo: 'Histórico completo',
      };
    }

    const { start, end } = obtenerRangosPeriodoClaves(modoActivo as 'today' | 'week' | 'month');
    const etiquetas = {
      today: 'Hoy',
      week: 'Esta semana',
      month: 'Este mes',
    };

    return {
      startKey: start,
      endKey: end,
      labelPeriodo: etiquetas[modoActivo] || 'Hoy',
    };
  }, [modoActivo, calendarMode, selectedDay, rangeStart, rangeEnd]);

  // 2. Filtrado estricto de ventas y gastos según las fechas activas
  const filteredSales = useMemo(() => {
    return allSales.filter((s) => {
      const k = obtenerClaveFechaLocal(s.createdAt);
      if (!k) return false;
      if (startKey && k < startKey) return false;
      if (endKey && k > endKey) return false;
      return true;
    });
  }, [allSales, startKey, endKey]);

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      const k = obtenerClaveFechaLocal(e.date);
      if (!k) return false;
      if (startKey && k < startKey) return false;
      if (endKey && k > endKey) return false;
      return true;
    });
  }, [allExpenses, startKey, endKey]);

  // 3. Totales Financieros
  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  }, [filteredSales]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const netProfit = totalSalesAmount - totalExpensesAmount;

  // 4. Desglose por Método de Pago (Corte de Caja)
  const desgloseMetodosPago = useMemo(() => {
    let efectivoVentas = 0;
    let tarjetaVentas = 0;
    let transferenciaVentas = 0;
    let conteoEfectivo = 0;
    let conteoTarjeta = 0;
    let conteoTransferencia = 0;

    filteredSales.forEach((s) => {
      const m = s.paymentMethod || 'Efectivo';
      const tot = s.total || 0;
      if (m === 'Tarjeta') {
        tarjetaVentas += tot;
        conteoTarjeta += 1;
      } else if (m === 'Transferencia') {
        transferenciaVentas += tot;
        conteoTransferencia += 1;
      } else {
        efectivoVentas += tot;
        conteoEfectivo += 1;
      }
    });

    return {
      efectivoVentas,
      conteoEfectivo,
      tarjetaVentas,
      conteoTarjeta,
      transferenciaVentas,
      conteoTransferencia,
    };
  }, [filteredSales]);

  const handleCambiarModoCalendario = (nuevoModo: 'single' | 'range') => {
    setCalendarMode(nuevoModo);
    if (nuevoModo === 'single') {
      setRangeStart(null);
      setRangeEnd(null);
    } else {
      setSelectedDay(null);
    }
  };

  const handleSelectSingleDay = (day: string | null) => {
    setSelectedDay(day);
    setRangeStart(null);
    setRangeEnd(null);
  };

  const handleSelectRange = (start: string | null, end: string | null) => {
    setRangeStart(start);
    setRangeEnd(end);
    setSelectedDay(null);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Encabezado Principal y Selector de Período Limpio */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.85rem', fontWeight: 700, color: '#152420', margin: 0 }}>
            Resumen
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#5C6E67', margin: '2px 0 0' }}>
            Resultados de ventas, gastos y balance neto en caja
          </p>
        </div>

        {/* Botonera de Períodos: [ Hoy ] [ Esta semana ] [ Este mes ] [ Calendario ] [ Todo el histórico ] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', padding: 4, borderRadius: 6, border: '1px solid #E8DFC2', flexWrap: 'wrap' }}>
          {(['today', 'week', 'month'] as const).map((p) => {
            const activo = modoActivo === p;
            const labels = { today: 'Hoy', week: 'Esta semana', month: 'Este mes' };
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setModoActivo(p);
                  setPeriod(p);
                  setSelectedDay(null);
                  setRangeStart(null);
                  setRangeEnd(null);
                }}
                className={activo ? 'btn-limon' : 'btn-outline'}
                style={{ padding: '6px 14px', fontSize: '0.82rem', border: 'none' }}
              >
                {labels[p]}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              if (modoActivo === 'calendar') {
                setModoActivo('today');
                setPeriod('today');
              } else {
                setModoActivo('calendar');
                setCalendarMode('single');
                setSelectedDay(null);
                setRangeStart(null);
                setRangeEnd(null);
              }
            }}
            className={modoActivo === 'calendar' ? 'btn-limon' : 'btn-outline'}
            style={{ padding: '6px 14px', fontSize: '0.82rem', border: 'none' }}
          >
            {modoActivo === 'calendar' && (selectedDay || rangeStart) ? `Filtro: ${labelPeriodo}` : 'Calendario'}
          </button>

          <button
            type="button"
            onClick={() => {
              setModoActivo('all');
              setPeriod('all');
              setSelectedDay(null);
              setRangeStart(null);
              setRangeEnd(null);
            }}
            className={modoActivo === 'all' ? 'btn-limon' : 'btn-outline'}
            style={{ padding: '6px 14px', fontSize: '0.82rem', border: 'none' }}
          >
            Todo el histórico
          </button>
        </div>
      </div>

      {/* PANEL DEL CALENDARIO INTERACTIVO */}
      {modoActivo === 'calendar' && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E8DFC2',
          borderRadius: 6,
          padding: '16px 18px',
          boxShadow: '0 2px 10px rgba(21, 36, 32, 0.05)',
        }}>
          <CalendarioHistorico
            allSales={allSales}
            allExpenses={allExpenses}
            modoSeleccion={calendarMode}
            onCambiarModoSeleccion={handleCambiarModoCalendario}
            selectedDate={selectedDay}
            onSelectSingleDay={handleSelectSingleDay}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onSelectRange={handleSelectRange}
          />
        </div>
      )}

      {/* FILA DE 3 TARJETAS FINANCIERAS SIN REDUNDANCIA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
        {/* Tarjeta 1: Ventas Totales */}
        <div className="boleta-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.76rem', color: '#5C6E67', textTransform: 'uppercase', fontWeight: 600 }}>
            Ingresos ({labelPeriodo})
          </div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '2rem', fontWeight: 800, color: '#152420', margin: '4px 0 2px' }}>
            {formatearMoneda(totalSalesAmount)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8FAE3D', fontWeight: 600 }}>
            {filteredSales.length} {filteredSales.length === 1 ? 'orden cobrada' : 'órdenes cobradas'}
          </div>
        </div>

        {/* Tarjeta 2: Gastos Totales */}
        <div className="boleta-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.76rem', color: '#5C6E67', textTransform: 'uppercase', fontWeight: 600 }}>
            Gastos Totales ({labelPeriodo})
          </div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '2rem', fontWeight: 800, color: '#D14829', margin: '4px 0 2px' }}>
            {formatearMoneda(totalExpensesAmount)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#5C6E67' }}>
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto registrado' : 'gastos registrados'}
          </div>
        </div>

        {/* Tarjeta 3: Ganancia Neta Real */}
        <div className="boleta-card" style={{ padding: '20px', borderLeft: '4px solid #8FAE3D' }}>
          <div style={{ fontSize: '0.76rem', color: '#5C6E67', textTransform: 'uppercase', fontWeight: 600 }}>
            Ganancia Neta ({labelPeriodo})
          </div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '2rem', fontWeight: 800, color: netProfit >= 0 ? '#8FAE3D' : '#D14829', margin: '4px 0 2px' }}>
            {formatearMoneda(netProfit)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#5C6E67' }}>
            Ingresos menos gastos del período
          </div>
        </div>
      </div>

      {/* CORTE DE CAJA TOTALMENTE LIMPIO Y ESPACIOSO (3 COLUMNAS) */}
      <div className="boleta-card" style={{ padding: '22px' }}>
        <div style={{ borderBottom: '1px solid #E8DFC2', paddingBottom: 10, marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.25rem', fontWeight: 700, color: '#152420', margin: 0 }}>
            Corte de Caja ({labelPeriodo})
          </h3>
          <span style={{ fontSize: '0.76rem', color: '#5C6E67' }}>
            Balance por método de pago para cuadrar dinero físico y digital
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {/* Efectivo */}
          <div style={{ padding: '16px 18px', background: '#FAF7EE', borderRadius: 4, border: '1px solid #E8DFC2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 88 }}>
            <div>
              <strong style={{ fontSize: '0.94rem', color: '#152420' }}>Efectivo</strong>
              <div style={{ fontSize: '0.76rem', color: '#5C6E67', marginTop: 2 }}>
                {desgloseMetodosPago.conteoEfectivo} {desgloseMetodosPago.conteoEfectivo === 1 ? 'cobro en efectivo' : 'cobros en efectivo'}
              </div>
            </div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.6rem', fontWeight: 800, color: '#2C6E63', marginTop: 8 }}>
              {formatearMoneda(desgloseMetodosPago.efectivoVentas)}
            </div>
          </div>

          {/* Tarjeta */}
          <div style={{ padding: '16px 18px', background: '#FFFFFF', borderRadius: 4, border: '1px solid #E8DFC2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 88 }}>
            <div>
              <strong style={{ fontSize: '0.94rem', color: '#152420' }}>Tarjeta</strong>
              <div style={{ fontSize: '0.76rem', color: '#5C6E67', marginTop: 2 }}>
                {desgloseMetodosPago.conteoTarjeta} {desgloseMetodosPago.conteoTarjeta === 1 ? 'cobro con tarjeta' : 'cobros con tarjeta'}
              </div>
            </div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.6rem', fontWeight: 800, color: '#152420', marginTop: 8 }}>
              {formatearMoneda(desgloseMetodosPago.tarjetaVentas)}
            </div>
          </div>

          {/* Transferencia */}
          <div style={{ padding: '16px 18px', background: '#FFFFFF', borderRadius: 4, border: '1px solid #E8DFC2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 88 }}>
            <div>
              <strong style={{ fontSize: '0.94rem', color: '#152420' }}>Transferencia</strong>
              <div style={{ fontSize: '0.76rem', color: '#5C6E67', marginTop: 2 }}>
                {desgloseMetodosPago.conteoTransferencia} {desgloseMetodosPago.conteoTransferencia === 1 ? 'cobro por transferencia' : 'cobros por transferencia'}
              </div>
            </div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.6rem', fontWeight: 800, color: '#152420', marginTop: 8 }}>
              {formatearMoneda(desgloseMetodosPago.transferenciaVentas)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
