import React, { useState } from 'react';
import { adminApi } from '../services/adminApi';

interface PropiedadesVistaAjustes {
  onSuccess: (msg: string) => void;
}

export const VistaAjustes: React.FC<PropiedadesVistaAjustes> = ({ onSuccess }) => {
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passActual || !passNueva) return;
    setIsSaving(true);
    setError(null);
    const res = await adminApi.cambiarPasswordMaestra(passActual, passNueva);
    setIsSaving(false);
    if (res.success) {
      onSuccess('Contraseña maestra actualizada.');
      setPassActual('');
      setPassNueva('');
    } else {
      setError(res.message || 'Error al cambiar contraseña.');
    }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: '20px', fontWeight: 600, color: 'var(--color-grafito)', margin: 0 }}>
          Ajustes de acceso maestro
        </h1>
        <p style={{ fontSize: '12.5px', color: 'var(--color-piedra)', marginTop: 2 }}>
          Gestión de credenciales maestras de la plataforma
        </p>
      </div>

      <div className="table-container" style={{ padding: 26 }}>
        <h2 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: '16px', fontWeight: 600, margin: '0 0 14px' }}>
          Cambiar contraseña maestra
        </h2>

        {error && (
          <div style={{ background: 'var(--color-vino-suave)', border: '1px solid var(--color-linea)', color: 'var(--color-vino)', padding: '8px 12px', borderRadius: 'var(--radius-interactive)', fontSize: '12.5px', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 4 }}>
              Contraseña maestra actual
            </label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••••••"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 4 }}>
              Nueva contraseña maestra (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••••••"
              value={passNueva}
              onChange={(e) => setPassNueva(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
            style={{ alignSelf: 'flex-start', marginTop: 6 }}
          >
            {isSaving ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};
