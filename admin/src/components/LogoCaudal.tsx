import React from 'react';

interface PropiedadesLogoCaudal {
  tamano?: number;
  mostrarTexto?: boolean;
}

export const LogoCaudal: React.FC<PropiedadesLogoCaudal> = ({
  tamano = 32,
  mostrarTexto = false,
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={tamano}
        height={tamano}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Isotipo Caudal: Monograma C con corte de flujo a 45° */}
        <path
          d="M68 28C62 20 53 16 43 16C23 16 12 31 12 50C12 69 23 84 43 84C53 84 62 80 68 72L57 61C53 66 48 68 43 68C32 68 26 59 26 50C26 41 32 32 43 32C48 32 53 34 57 39L68 28Z"
          fill="#7A2530"
        />
        {/* Corte diagonal de flujo ascendente (Slash) */}
        <polygon
          points="88,14 36,86 28,86 80,14"
          fill="#7A2530"
        />
      </svg>

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
