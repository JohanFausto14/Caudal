import React, { useState, useMemo } from 'react';
import type { Sale, Expense } from '../types/tipos';
import { formatearMonedaCompacta } from '../utils/formato';
import {
  obtenerFechaHoyLocal,
  obtenerClaveFechaLocal,
} from '../utils/fechas';

interface PropiedadesCalendarioHistorico {
  allSales: Sale[];
  allExpenses: Expense[];
  // Modo de selección controlado
  modoSeleccion: 'single' | 'range';
  onCambiarModoSeleccion: (modo: 'single' | 'range') => void;
  // Día individual
  selectedDate: string | null;
  onSelectSingleDay: (dateKey: string | null) => void;
  // Rango
  rangeStart: string | null;
  rangeEnd: string | null;
  onSelectRange: (start: string | null, end: string | null) => void;
}

export const CalendarioHistorico: React.FC<PropiedadesCalendarioHistorico> = ({
  allSales,
  allExpenses,
  modoSeleccion,
  onCambiarModoSeleccion,
  selectedDate,
  onSelectSingleDay,
  rangeStart,
  rangeEnd,
  onSelectRange,
}) => {
  // Estado temporal de inicio de rango
  const [tempRangeStart, setTempRangeStart] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(() => {
    const ref = selectedDate || rangeStart;
    if (ref) {
      const [y, m] = ref.split('-');
      return new Date(parseInt(y), parseInt(m) - 1, 1);
    }
    return new Date();
  });

  // Agrupar ventas y gastos por fecha local YYYY-MM-DD
  const dailyDataMap = useMemo(() => {
    const map: Record<string, { salesTotal: number; salesCount: number; expensesTotal: number; expensesCount: number }> = {};

    allSales.forEach((s) => {
      const dateKey = obtenerClaveFechaLocal(s.createdAt);
      if (!dateKey) return;
      if (!map[dateKey]) {
        map[dateKey] = { salesTotal: 0, salesCount: 0, expensesTotal: 0, expensesCount: 0 };
      }
      map[dateKey].salesTotal += (s.total || 0);
      map[dateKey].salesCount += 1;
    });

    allExpenses.forEach((e) => {
      const dateKey = obtenerClaveFechaLocal(e.date);
      if (!dateKey) return;
      if (!map[dateKey]) {
        map[dateKey] = { salesTotal: 0, salesCount: 0, expensesTotal: 0, expensesCount: 0 };
      }
      map[dateKey].expensesTotal += (e.amount || 0);
      map[dateKey].expensesCount += 1;
    });

    return map;
  }, [allSales, allExpenses]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = obtenerFechaHoyLocal();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Manejador estricto de clics
  const handleDayClick = (dateKey: string) => {
    if (modoSeleccion === 'single') {
      // Modo Día: Clic selecciona o deselecciona inmediatamente ese día
      if (selectedDate === dateKey) {
        onSelectSingleDay(null);
      } else {
        onSelectSingleDay(dateKey);
      }
    } else {
      // Modo Rango: Primer clic marca inicio, segundo clic marca fin
      if (!tempRangeStart) {
        setTempRangeStart(dateKey);
        onSelectRange(dateKey, dateKey);
      } else {
        let s = tempRangeStart;
        let e = dateKey;
        if (s > e) {
          const t = s;
          s = e;
          e = t;
        }
        onSelectRange(s, e);
        setTempRangeStart(null);
      }
    }
  };

  const handleSwitchModo = (nuevoModo: 'single' | 'range') => {
    setTempRangeStart(null);
    onCambiarModoSeleccion(nuevoModo);
  };

  const monthStr = String(month + 1).padStart(2, '0');

  const dayCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<div key={`empty-${i}`} className="calendar-day-cell empty" style={{ opacity: 0.15 }} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const dayData = dailyDataMap[dateKey];
    const isToday = dateKey === todayKey;

    // Determinar si está seleccionado de forma 100% aislada por modo
    const isSingleSelected = modoSeleccion === 'single' && selectedDate === dateKey;
    const isRangeSelected = modoSeleccion === 'range' && rangeStart && rangeEnd && dateKey >= rangeStart && dateKey <= rangeEnd;
    const isTempStart = modoSeleccion === 'range' && tempRangeStart === dateKey;
    const isHighlighted = isSingleSelected || isRangeSelected || isTempStart;

    const hasSales = dayData && dayData.salesTotal > 0;
    const hasExpenses = dayData && dayData.expensesTotal > 0;

    dayCells.push(
      <button
        type="button"
        key={dateKey}
        onClick={() => handleDayClick(dateKey)}
        style={{
          minHeight: '64px',
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderRadius: '4px',
          border: isHighlighted
            ? '2px solid #2C6E63'
            : isToday
            ? '1.5px solid #8FAE3D'
            : '1px solid #E8DFC2',
          background: isHighlighted
            ? 'rgba(44, 110, 99, 0.14)'
            : isToday
            ? '#FAF7EE'
            : '#FFFFFF',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.12s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.82rem',
            fontWeight: isToday || isHighlighted ? 800 : 600,
            color: isHighlighted ? '#2C6E63' : isToday ? '#8FAE3D' : '#152420',
          }}>
            {day}
          </span>
          {isToday && (
            <span style={{ fontSize: '0.62rem', background: '#8FAE3D', color: '#FFFFFF', padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>
              HOY
            </span>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
          {hasSales && (
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#8FAE3D', whiteSpace: 'nowrap' }}>
              +{formatearMonedaCompacta(dayData.salesTotal)}
            </div>
          )}
          {hasExpenses && (
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#D14829', whiteSpace: 'nowrap' }}>
              -{formatearMonedaCompacta(dayData.expensesTotal)}
            </div>
          )}
          {!hasSales && !hasExpenses && (
            <div style={{ fontSize: '0.68rem', color: '#C8D2CE' }}>—</div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Cabecera del Calendario: Mes y Switch de Modo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Navegación del Mes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn-outline"
            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
          >
            ← Mes anterior
          </button>

          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.25rem', fontWeight: 800, color: '#152420', minWidth: 160, textAlign: 'center' }}>
            {monthNames[month]} {year}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="btn-outline"
            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
          >
            Siguiente mes →
          </button>
        </div>

        {/* Switch de Modo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FAF7EE', padding: 3, borderRadius: 6, border: '1px solid #E8DFC2' }}>
          <button
            type="button"
            onClick={() => handleSwitchModo('single')}
            className={modoSeleccion === 'single' ? 'btn-limon' : 'btn-outline'}
            style={{ padding: '5px 12px', fontSize: '0.78rem', border: 'none' }}
          >
            Día individual
          </button>
          <button
            type="button"
            onClick={() => handleSwitchModo('range')}
            className={modoSeleccion === 'range' ? 'btn-limon' : 'btn-outline'}
            style={{ padding: '5px 12px', fontSize: '0.78rem', border: 'none' }}
          >
            Rango de días
          </button>
        </div>
      </div>

      {/* Días de la Semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', fontWeight: 700, fontSize: '0.74rem', color: '#5C6E67', textTransform: 'uppercase' }}>
        <div>Lun</div>
        <div>Mar</div>
        <div>Mié</div>
        <div>Jue</div>
        <div>Vie</div>
        <div>Sáb</div>
        <div>Dom</div>
      </div>

      {/* Matriz de Días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {dayCells}
      </div>
    </div>
  );
};
