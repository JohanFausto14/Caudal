import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PropiedadesModalConfirmacion {
  isOpen: boolean;
  titulo: string;
  mensaje: string;
  detalle?: string;
  textoBotonConfirmar?: string;
  textoBotonCancelar?: string;
  tipo?: 'peligro' | 'primario';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ModalConfirmacion: React.FC<PropiedadesModalConfirmacion> = ({
  isOpen,
  titulo,
  mensaje,
  detalle,
  textoBotonConfirmar = 'Confirmar',
  textoBotonCancelar = 'Cancelar',
  tipo = 'peligro',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const modalNode = (
    <div className="modal-backdrop">
      <div className="modal-panel animate-fade" style={{ maxWidth: 440, width: '100%', padding: '28px', background: '#FFFFFF', border: '1px solid var(--color-linea)', borderRadius: 'var(--radius-container)', boxShadow: '0 18px 45px rgba(21, 36, 32, 0.26)' }}>
        {/* Cabecera con Icono y Título */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: tipo === 'peligro' ? 'var(--color-vino-suave)' : 'var(--color-niebla)',
              color: tipo === 'peligro' ? 'var(--color-vino)' : 'var(--color-grafito)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-serif-heading)',
                fontSize: '19px',
                fontWeight: 700,
                color: 'var(--color-grafito)',
                margin: 0,
                lineHeight: 1.2,
              }}>
                {titulo}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--color-piedra)' }}>
                Confirmación de seguridad
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-piedra)',
              padding: 6,
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

        {/* Mensaje Principal */}
        <p style={{ fontSize: '13.5px', color: 'var(--color-piedra)', margin: '0 0 14px', lineHeight: 1.5 }}>
          {mensaje}
        </p>

        {detalle && (
          <div style={{
            background: 'var(--color-niebla)',
            border: '1px solid var(--color-linea)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-interactive)',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--color-grafito)',
            marginBottom: 16,
          }}>
            {detalle}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, borderTop: '1px solid var(--color-linea)', paddingTop: 16 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            style={{ padding: '9px 18px', fontSize: '13px' }}
          >
            {textoBotonCancelar} (Esc)
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              fontSize: '13px',
              background: tipo === 'peligro' ? 'var(--color-vino)' : undefined,
              color: '#FFFFFF',
            }}
          >
            {textoBotonConfirmar}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
