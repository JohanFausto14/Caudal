import React, { useState, useMemo } from 'react';
import type { Expense } from '../types/tipos';
import { formatearMoneda, obtenerId } from '../utils/formato';
import {
  formatearFechaLocal,
  obtenerClaveFechaLocal,
  obtenerRangosPeriodoClaves,
} from '../utils/fechas';
import { CalendarioHistorico } from './CalendarioHistorico';
import { ModalConfirmacion } from './ModalConfirmacion';

interface PropiedadesGestionGastos {
  allExpenses: Expense[];
  onOpenCreateExpense: () => void;
  onDeleteExpense: (id: string) => Promise<boolean>;
}

export const GestionGastos: React.FC<PropiedadesGestionGastos> = ({
  allExpenses,
  onOpenCreateExpense,
  onDeleteExpense,
}) => {
  // Modo de visualización: 'today' | 'week' | 'month' | 'calendar' | 'all'
  const [modoActivo, setModoActivo] = useState<'today' | 'week' | 'month' | 'calendar' | 'all'>('today');

  // Modo de selección del calendario: 'single' | 'range'
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');

  // Estado del Calendario (Día o Rango)
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  // Buscador de texto en tiempo real
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal para confirmar eliminación
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Normalizador de texto para búsqueda insensible a acentos y mayúsculas
  const normalizarTexto = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // 1. Determinar el rango de fechas activo y la etiqueta descriptiva con aislamiento estricto
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

  // 2. Filtrado de gastos por fecha y por texto de búsqueda
  const filteredExpenses = useMemo(() => {
    const queryNorm = normalizarTexto(searchQuery);

    return allExpenses.filter((e) => {
      const expenseDate = obtenerClaveFechaLocal(e.date);

      // Filtro de Fecha
      if (startKey && expenseDate < startKey) return false;
      if (endKey && expenseDate > endKey) return false;

      // Filtro de Texto (concepto, notas o monto)
      if (queryNorm) {
        const conceptNorm = normalizarTexto(e.concept || '');
        const notesNorm = normalizarTexto(e.notes || '');
        const amountStr = String(e.amount || '');

        const matchesConcept = conceptNorm.includes(queryNorm);
        const matchesNotes = notesNorm.includes(queryNorm);
        const matchesAmount = amountStr.includes(queryNorm);

        if (!matchesConcept && !matchesNotes && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [allExpenses, startKey, endKey, searchQuery]);

  const totalFiltered = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    await onDeleteExpense(obtenerId(expenseToDelete));
    setExpenseToDelete(null);
  };

  const handleCambiarModoCalendario = (nuevoModo: 'single' | 'range') => {
    setCalendarMode(nuevoModo);
    // Limpieza total del estado opuesto para que jamás se mezclen
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
      {/* Encabezado Principal y Botón Registrar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.85rem', fontWeight: 700, color: '#152420', margin: 0 }}>
            Gastos y Compras
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#5C6E67', margin: '2px 0 0' }}>
            Registro y control de salidas de dinero e insumos
          </p>
        </div>

        <button onClick={onOpenCreateExpense} className="btn-chile" style={{ padding: '9px 18px', fontSize: '0.88rem' }}>
          + Registrar Gasto
        </button>
      </div>

      {/* Barra de Control: Botonera de Períodos + Buscador */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        background: '#FFFFFF',
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #E8DFC2',
      }}>
        {/* Botonera de Períodos */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['today', 'week', 'month'] as const).map((p) => {
            const activo = modoActivo === p;
            const labels = { today: 'Hoy', week: 'Esta semana', month: 'Este mes' };
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setModoActivo(p);
                  setSelectedDay(null);
                  setRangeStart(null);
                  setRangeEnd(null);
                }}
                className={activo ? 'btn-limon' : 'btn-outline'}
                style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none' }}
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
              } else {
                setModoActivo('calendar');
                setCalendarMode('single');
                setSelectedDay(null);
                setRangeStart(null);
                setRangeEnd(null);
              }
            }}
            className={modoActivo === 'calendar' ? 'btn-limon' : 'btn-outline'}
            style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none' }}
          >
            {modoActivo === 'calendar' && (selectedDay || rangeStart) ? `Filtro: ${labelPeriodo}` : 'Calendario'}
          </button>

          <button
            type="button"
            onClick={() => {
              setModoActivo('all');
              setSelectedDay(null);
              setRangeStart(null);
              setRangeEnd(null);
            }}
            className={modoActivo === 'all' ? 'btn-limon' : 'btn-outline'}
            style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none' }}
          >
            Todo el histórico
          </button>
        </div>

        {/* Buscador en Tiempo Real */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="text"
            placeholder="Buscar concepto o monto..."
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 230, padding: '5px 10px', fontSize: '0.82rem' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#D14829', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Limpiar
            </button>
          )}
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
            allSales={[]}
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

      {/* Tarjeta de Resumen del Total Gastado */}
      <div className="boleta-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #D14829' }}>
        <div>
          <div style={{ fontSize: '0.76rem', color: '#5C6E67', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Gastado ({labelPeriodo})
            {searchQuery && ` • Búsqueda: "${searchQuery}"`}
          </div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '2.1rem', fontWeight: 800, color: '#D14829', margin: '2px 0' }}>
            {formatearMoneda(totalFiltered)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#5C6E67' }}>
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto registrado' : 'gastos registrados'}
          </div>
        </div>
      </div>

      {/* Lista Detallada de Gastos */}
      <div className="boleta-card" style={{ padding: '20px' }}>
        <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.2rem', fontWeight: 700, color: '#152420', margin: '0 0 14px' }}>
          Detalle de Gastos ({labelPeriodo})
        </h3>

        {filteredExpenses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredExpenses.map((expense) => {
              const eId = obtenerId(expense);

              return (
                <div
                  key={eId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#FAF7EE',
                    border: '1px solid #E8DFC2',
                    borderRadius: 4,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#152420' }}>
                      {expense.concept}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#5C6E67', marginTop: 2 }}>
                      {formatearFechaLocal(expense.date)}
                      {expense.notes && ` • Nota: ${expense.notes}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.25rem', fontWeight: 800, color: '#D14829' }}>
                      -{formatearMoneda(expense.amount)}
                    </div>

                    <button
                      onClick={() => setExpenseToDelete(expense)}
                      style={{
                        background: 'rgba(209, 72, 41, 0.08)',
                        border: '1px solid rgba(209, 72, 41, 0.3)',
                        color: '#D14829',
                        padding: '5px 10px',
                        borderRadius: 3,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Eliminar gasto"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8E9F99', border: '1px dashed #E8DFC2', borderRadius: 4, fontSize: '0.86rem' }}>
            <div style={{ fontWeight: 700, color: '#152420', marginBottom: 4 }}>
              {searchQuery ? `No se encontraron gastos con "${searchQuery}"` : `No hay gastos registrados en ${labelPeriodo}`}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#5C6E67' }}>
              {searchQuery ? 'Intenta buscar con otra palabra.' : 'Haz clic en + Registrar Gasto para ingresar una compra o salida de dinero.'}
            </div>
          </div>
        )}
      </div>

      {/* Modal Confirmar Eliminación (Renderizado con Portal Fullscreen) */}
      <ModalConfirmacion
        isOpen={Boolean(expenseToDelete)}
        titulo="¿Eliminar este gasto?"
        mensaje="El monto será reintegrado inmediatamente al balance de la caja."
        detalle={expenseToDelete ? `${expenseToDelete.concept} — ${formatearMoneda(expenseToDelete.amount)}` : ''}
        textoBotonConfirmar="Sí, Eliminar Gasto"
        colorBoton="chile"
        onConfirm={handleConfirmDelete}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
