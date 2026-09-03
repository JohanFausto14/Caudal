import React from 'react';

interface PropiedadesLogoCaudal {
  tamano?: number;
  mostrarTexto?: boolean;
}

export const LogoCaudal: React.FC<PropiedadesLogoCaudal> = ({
  tamano = 36,
  mostrarTexto = false,
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <svg
        width={tamano}
        height={tamano}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <defs>
          <mask id="caudal-slash-mask">
            {/* Fondo blanco completo para revelar todo */}
            <rect width="120" height="120" fill="#FFFFFF" />
            {/* Franja de corte diagonal negativa a 45 grados */}
            <polygon points="12,108 24,108 108,24 96,24" fill="#000000" />
          </mask>
        </defs>

        {/* Monograma C sólido y arquitectónico con corte de máscara */}
        <g mask="url(#caudal-slash-mask)">
          <path
            d="M84,30 C76,17 61,10 44,10 C19.7,10 0,29.7 0,54 C0,78.3 19.7,98 44,98 C61,98 76,91 84,78 L65,65 C60,72 53,76 44,76 C31.8,76 22,66.2 22,54 C22,41.8 31.8,32 44,32 C53,32 60,36 65,43 L84,30 Z"
            fill="#7A2530"
            transform="translate(16, 6)"
          />
        </g>

        {/* Barra diagonal afilada de flujo ascendente (Lanza / Slash a 45 grados) */}
        <polygon
          points="20,100 28,100 100,28 100,20 92,20 20,92"
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
