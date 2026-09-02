import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminApi, NegocioAdmin } from '../services/adminApi';

interface PropiedadesModalEditar {
  negocio: NegocioAdmin;
  onClose: () => void;
  onSuccess: (nombre: string) => void;
}

export const ModalEditar: React.FC<PropiedadesModalEditar> = ({ negocio, onClose, onSuccess }) => {
  const [nombre, setNombre] = useState(negocio.nombre);
  const [telefono, setTelefono] = useState(negocio.telefono || '');
  const [isSaving, setIsSaving] = useState(false);
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

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    setIsSaving(true);
    setError(null);
    const res = await adminApi.updateNegocio(negocio.codigo, { nombre, telefono });
    setIsSaving(false);

    if (res.success) {
      onSuccess(nombre);
      onClose();
    } else {
      setError(res.message || 'Error al actualizar negocio.');
    }
  };

  const modalNode = (
    <div className="modal-backdrop">
      <div className="modal-panel animate-fade" style={{ maxWidth: 400, width: '100%', padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--color-linea)', paddingBottom: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--color-grafito)', margin: 0 }}>
              Editar negocio
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--color-piedra)' }}>
              /{negocio.codigo}
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

        {error && (
          <div style={{ background: 'var(--color-vino-suave)', border: '1px solid var(--color-linea)', color: 'var(--color-vino)', padding: '8px 12px', borderRadius: 'var(--radius-interactive)', fontSize: '12.5px', marginBottom: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 4 }}>
              Nombre comercial *
            </label>
            <input
              type="text"
              required
              autoFocus
              className="input-field"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 4 }}>
              Teléfono de contacto
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="6691234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14, borderTop: '1px solid var(--color-linea)', paddingTop: 14 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12.5px' }}>
              Cancelar (Esc)
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '8px 18px', fontSize: '12.5px' }}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
