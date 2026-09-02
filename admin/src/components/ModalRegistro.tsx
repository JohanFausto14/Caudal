import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminApi } from '../services/adminApi';

interface PropiedadesModalRegistro {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nombre: string) => void;
}

export const ModalRegistro: React.FC<PropiedadesModalRegistro> = ({ isOpen, onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleNombreChange = (val: string) => {
    setNombre(val);
    const sugerido = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    setCodigo(sugerido);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim() || !pin) {
      setError('Nombre, código slug y PIN son obligatorios.');
      return;
    }
    if (pin.length !== 4) {
      setError('El PIN debe tener exactamente 4 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const res = await adminApi.createNegocio({ nombre, codigo, telefono, pin });
    setIsSubmitting(false);

    if (res.success) {
      onSuccess(nombre);
      setNombre('');
      setCodigo('');
      setTelefono('');
      setPin('');
      onClose();
    } else {
      setError(res.message || 'Error al registrar el negocio.');
    }
  };

  const modalNode = (
    <div className="modal-backdrop">
      <div className="modal-panel animate-fade" style={{ maxWidth: 440, width: '100%', padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--color-linea)', paddingBottom: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--color-grafito)', margin: 0 }}>
              Registrar nuevo negocio
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--color-piedra)' }}>
              Alta en la plataforma Caudal
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 4 }}>
              Nombre comercial *
            </label>
            <input
              type="text"
              required
              autoFocus
              className="input-field"
              placeholder="Ej. Mariscos El Rey"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 4 }}>
              Código URL / Slug único *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="ej. elrey"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
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

          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 4 }}>
              PIN de acceso para la caja (4 dígitos) *
            </label>
            <input
              type="text"
              required
              maxLength={4}
              className="input-field"
              placeholder="1234"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14, borderTop: '1px solid var(--color-linea)', paddingTop: 14 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12.5px' }}>
              Cancelar (Esc)
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '8px 18px', fontSize: '12.5px' }}>
              {isSubmitting ? 'Registrando...' : 'Crear negocio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
