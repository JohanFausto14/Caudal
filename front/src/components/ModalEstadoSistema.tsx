import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { DatabaseStatus } from '../types/tipos';
import { api } from '../services/api';

interface PropiedadesModalEstadoSistema {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: {
    isOnline: boolean;
    mongoConnected: boolean;
    database?: DatabaseStatus;
  };
  onRefreshHealth: () => void;
}

export const ModalEstadoSistema: React.FC<PropiedadesModalEstadoSistema> = ({
  isOpen,
  onClose,
  dbStatus,
  onRefreshHealth,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isOnline = dbStatus.isOnline || dbStatus.mongoConnected;
  const colaPendiente = api.getColaSincronizacion();

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
      <div className="modal-content animate-fade" style={{ maxWidth: 460, width: '100%', padding: '26px', background: '#FFFFFF', border: '1px solid #E8DFC2', borderRadius: 6, boxShadow: '0 20px 50px rgba(21, 36, 32, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #E8DFC2', paddingBottom: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.35rem', fontWeight: 800, color: '#152420', margin: 0 }}>
              Estado del Sistema y Conexión
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#5C6E67' }}>
              Diagnóstico de red y sincronización local
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FAF7EE', borderRadius: 4, border: '1px solid #E8DFC2' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#152420' }}>Servidor y Base de Datos:</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isOnline ? '#8FAE3D' : '#D14829', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#8FAE3D' : '#D14829', display: 'inline-block' }} />
              {isOnline ? 'En línea' : 'Sin conexión'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FAF7EE', borderRadius: 4, border: '1px solid #E8DFC2' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#152420' }}>Registros pendientes:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: colaPendiente.length > 0 ? '#D14829' : '#8FAE3D' }}>
              {colaPendiente.length} {colaPendiente.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #E8DFC2', paddingTop: 14 }}>
          <button type="button" onClick={onRefreshHealth} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
            Comprobar Enlace
          </button>
          <button type="button" onClick={onClose} className="btn-limon" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
            Cerrar (Esc)
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
