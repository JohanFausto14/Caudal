import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminApi, NegocioAdmin } from '../services/adminApi';

interface PropiedadesModalResetPin {
  negocio: NegocioAdmin;
  onClose: () => void;
  onSuccess: (nuevoPin: string) => void;
}

export const ModalResetPin: React.FC<PropiedadesModalResetPin> = ({ negocio, onClose, onSuccess }) => {
  const [nuevoPin, setNuevoPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPin || nuevoPin.length !== 4) {
      setError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }
    setIsResetting(true);
    setError(null);
    const res = await adminApi.resetPin(negocio.codigo, nuevoPin);
    setIsResetting(false);

    if (res.success) {
      onSuccess(nuevoPin);
      onClose();
    } else {
      setError(res.message || 'Error al resetear PIN.');
    }
  };

  const modalNode = (
    <div className="modal-backdrop">
      <div className="modal-panel animate-fade" style={{ maxWidth: 380, width: '100%', padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--color-linea)', paddingBottom: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--color-grafito)', margin: 0 }}>
              Resetear PIN
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--color-piedra)' }}>
              {negocio.nombre}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-piedra)',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Cerrar (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--color-piedra)', margin: '0 0 14px', lineHeight: 1.4 }}>
          Ingresa el nuevo PIN de seguridad de 4 dígitos para que el dueño vuelva a ingresar a su caja.
        </p>

        {error && (
          <div style={{ background: 'var(--color-vino-suave)', border: '1px solid var(--color-linea)', color: 'var(--color-vino)', padding: '8px 12px', borderRadius: 'var(--radius-interactive)', fontSize: '12.5px', marginBottom: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 4 }}>
              Nuevo PIN (4 dígitos) *
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={4}
              className="input-field"
              placeholder="0000"
              value={nuevoPin}
              onChange={(e) => setNuevoPin(e.target.value.replace(/[^0-9]/g, ''))}
              style={{ fontSize: '18px', letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14, borderTop: '1px solid var(--color-linea)', paddingTop: 14 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12.5px' }}>
              Cancelar (Esc)
            </button>
            <button type="submit" disabled={isResetting} className="btn-primary" style={{ padding: '8px 18px', fontSize: '12.5px' }}>
              {isResetting ? 'Guardando...' : 'Asignar PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
