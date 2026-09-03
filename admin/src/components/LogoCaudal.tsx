import React from 'react';
import logoImg from '../assets/logo-caudal.png';

interface PropiedadesLogoCaudal {
  tamano?: number;
  mostrarTexto?: boolean;
}

export const LogoCaudal: React.FC<PropiedadesLogoCaudal> = ({
  tamano = 38,
  mostrarTexto = false,
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <img
        src={logoImg}
        alt="Caudal"
        style={{
          width: tamano,
          height: tamano,
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {mostrarTexto && (
        <span
          style={{
            fontFamily: "'Space Grotesk', -apple-system, sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: '#1C1B19',
            letterSpacing: '-0.02em',
          }}
        >
          Caudal
        </span>
      )}
    </div>
  );
};
