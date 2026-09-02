import React, { useState, useEffect, useRef } from 'react';
import type { Negocio } from '../types/tipos';
import { api } from '../services/api';
import { LogoMarca } from './LogoMarca';

interface PropiedadesLoginNegocio {
  negocioInfo: Negocio | null;
  codigoSlug: string;
  errorCarga: string | null;
  onLoginExitoso: (negocio: Negocio) => void;
}

export const PantallaLoginNegocio: React.FC<PropiedadesLoginNegocio> = ({
  negocioInfo,
  codigoSlug,
  errorCarga,
  onLoginExitoso,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nombreNegocio = negocioInfo?.nombre || (codigoSlug === 'elharocho' ? 'Tostiaguachiles El Harocho' : `Negocio ${codigoSlug}`);
  const logoUrl = negocioInfo?.logoUrl;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleNumeroClick = (num: string) => {
    if (pin.length < 4) {
      const nuevoPin = pin + num;
      setPin(nuevoPin);
      if (nuevoPin.length === 4) {
        procesarLogin(nuevoPin);
      }
    }
  };

  const handleBorrar = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const procesarLogin = async (pinAProbar: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(codigoSlug, pinAProbar);

      if (res.success && res.token && res.negocio) {
        onLoginExitoso(res.negocio);
      } else {
        setError(res.message || 'PIN de seguridad incorrecto.');
        setPin('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Error de conexión con el servidor.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pin.length === 4) {
      procesarLogin(pin);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F4EFE6',
      padding: '20px',
    }}>
      <div className="boleta-card animate-fade" style={{
        maxWidth: 380,
        width: '100%',
        padding: '32px 28px',
        textAlign: 'center',
        boxShadow: '0 12px 36px rgba(21, 36, 32, 0.12)',
      }}>
        {/* Isotipo o Logo Personalizado */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <LogoMarca tamano="lg" logoUrl={logoUrl} nombre={nombreNegocio} />
        </div>

        {/* Nombre del Negocio */}
        <h1 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: '1.45rem',
          fontWeight: 800,
          color: '#152420',
          margin: '0 0 4px',
          lineHeight: 1.2,
        }}>
          {nombreNegocio}
        </h1>

        <p style={{
          fontSize: '0.82rem',
          color: '#5C6E67',
          margin: '0 0 20px',
        }}>
          Ingresa el PIN de seguridad de 4 dígitos
        </p>

        {errorCarga && (
          <div style={{
            background: '#FAF7EE',
            border: '1px solid #D14829',
            color: '#D14829',
            padding: '8px 12px',
            borderRadius: 4,
            fontSize: '0.8rem',
            marginBottom: 16,
            fontWeight: 600,
          }}>
            {errorCarga}
          </div>
        )}

        {error && (
          <div style={{
            background: '#FAF7EE',
            border: '1px solid #D14829',
            color: '#D14829',
            padding: '8px 12px',
            borderRadius: 4,
            fontSize: '0.8rem',
            marginBottom: 16,
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {/* Indicadores Visuales de los 4 Dígitos */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          marginBottom: 24,
        }}>
          {[0, 1, 2, 3].map((idx) => {
            const lleno = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid #2C6E63',
                  background: lleno ? '#8FAE3D' : '#FAF7EE',
                  boxShadow: lleno ? '0 0 8px rgba(143, 174, 61, 0.6)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
        </div>

        {/* Input invisible para teclados físicos o móviles */}
        <input
          ref={inputRef}
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            setPin(val);
            if (val.length === 4) {
              procesarLogin(val);
            }
          }}
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Teclado Numérico en Pantalla */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 16,
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleNumeroClick(num)}
              className="btn-outline"
              style={{
                height: 48,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#152420',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
              }}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={() => setPin('')}
            className="btn-outline"
            style={{
              height: 48,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#5C6E67',
              background: '#FAF7EE',
            }}
          >
            Limpiar
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleNumeroClick('0')}
            className="btn-outline"
            style={{
              height: 48,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#152420',
              background: '#FFFFFF',
            }}
          >
            0
          </button>

          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleBorrar}
            className="btn-outline"
            style={{
              height: 48,
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#D14829',
              background: '#FAF7EE',
            }}
          >
            ⌫
          </button>
        </div>

        <div style={{ fontSize: '0.74rem', color: '#8E9F99' }}>
          {loading ? 'Verificando PIN...' : 'Puedes usar el teclado numérico de tu pantalla o teclado físico'}
        </div>
      </div>
    </div>
  );
};
