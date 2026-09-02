import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Expense } from '../types/tipos';
import { obtenerFechaHoyLocal } from '../utils/fechas';

interface PropiedadesModalGasto {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Partial<Expense>) => Promise<any>;
}

export const ModalGasto: React.FC<PropiedadesModalGasto> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(obtenerFechaHoyLocal());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || !amount) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        concept: concept.trim(),
        category: 'Gasto',
        amount: Number(amount),
        date,
        notes: notes.trim(),
      });
      setConcept('');
      setAmount('');
      setNotes('');
      setDate(obtenerFechaHoyLocal());
      onClose();
    } catch (err) {
      console.error('Error al registrar gasto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalNode = (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(21, 36, 32, 0.65)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="modal-content animate-fade" style={{ maxWidth: 440, width: '100%', padding: '26px', background: '#FFFFFF', border: '1px solid #E8DFC2', borderRadius: 6, boxShadow: '0 20px 50px rgba(21, 36, 32, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #E8DFC2', paddingBottom: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.35rem', fontWeight: 800, color: '#152420', margin: 0 }}>
              Registrar Gasto o Compra
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#5C6E67' }}>
              Salida de dinero de la caja
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#5C6E67',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Cerrar (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#152420', display: 'block', marginBottom: 4 }}>
              Concepto del gasto *
            </label>
            <input
              type="text"
              required
              autoFocus
              className="form-input"
              placeholder="Ej. 10kg de Camarón, Gas, Hielo, Tostitos..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#152420', display: 'block', marginBottom: 4 }}>
                Monto ($ MXN) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '1rem', fontWeight: 700, color: '#D14829' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#152420', display: 'block', marginBottom: 4 }}>
                Fecha *
              </label>
              <input
                type="date"
                required
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ padding: '8px 10px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#152420', display: 'block', marginBottom: 4 }}>
              Nota o proveedor (Opcional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Mercado del Mar, Don Carlos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8, borderTop: '1px solid #E8DFC2', paddingTop: 14 }}>
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', justifyContent: 'center', fontSize: '0.88rem' }}
            >
              Cancelar (Esc)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-chile"
              style={{ flex: 1, padding: '10px', justifyContent: 'center', fontSize: '0.88rem' }}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
