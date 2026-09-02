import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PropiedadesModalConfirmacion {
  isOpen: boolean;
  titulo: string;
  mensaje: string;
  detalle?: string;
  textoBotonConfirmar?: string;
  textoBotonCancelar?: string;
  colorBoton?: 'chile' | 'ola' | 'limon';
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
  colorBoton = 'chile',
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

  const getBotonClase = () => {
    if (colorBoton === 'chile') return 'btn-chile';
    if (colorBoton === 'ola') return 'btn-ola';
    return 'btn-limon';
  };

  const modalNode = (
    <div
      style={{
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
      }}
    >
      <div
        className="modal-content animate-fade"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: '26px',
          background: '#FFFFFF',
          border: '1px solid #E8DFC2',
          borderRadius: 6,
          boxShadow: '0 20px 50px rgba(21, 36, 32, 0.3)',
        }}
      >
        {/* Cabecera con Icono y Botón Cerrar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(209, 72, 41, 0.12)',
              color: '#D14829',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              flexShrink: 0,
            }}>
              !
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#152420',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {titulo}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Mensaje */}
        <p style={{ fontSize: '0.88rem', color: '#5C6E67', margin: '0 0 14px', lineHeight: 1.45 }}>
          {mensaje}
        </p>

        {detalle && (
          <div style={{
            background: '#FAF7EE',
            border: '1px dashed #E8DFC2',
            padding: '10px 14px',
            borderRadius: 4,
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#152420',
            marginBottom: 18,
          }}>
            {detalle}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, borderTop: '1px solid #E8DFC2', paddingTop: 14 }}>
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            {textoBotonCancelar} (Esc)
          </button>
          <button
            type="button"
            className={getBotonClase()}
            onClick={onConfirm}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            {textoBotonConfirmar}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
