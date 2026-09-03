import React, { useState } from 'react';

interface PropiedadesLogoMarca {
  tamano?: 'sm' | 'md' | 'lg' | 'xl';
  logoUrl?: string | null;
  nombre?: string;
}

export const LogoMarca: React.FC<PropiedadesLogoMarca> = ({
  tamano = 'md',
  logoUrl,
  nombre,
}) => {
  const [imgError, setImgError] = useState(false);

  const dimensiones = {
    sm: { contenedor: 26, svg: 18 },
    md: { contenedor: 36, svg: 24 },
    lg: { contenedor: 46, svg: 30 },
    xl: { contenedor: 64, svg: 42 },
  }[tamano];

  // Si tiene logoUrl personalizado y no falló la carga
  if (logoUrl && !imgError) {
    return (
      <div
        style={{
          width: dimensiones.contenedor,
          height: dimensiones.contenedor,
          borderRadius: '50%',
          border: '2px solid #2C6E63',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(44, 110, 99, 0.12)',
        }}
      >
        <img
          src={logoUrl}
          alt={nombre || 'Logo del negocio'}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    );
  }

  // Isotipo Oficial del Ticket de Punto de Venta
  return (
    <div
      style={{
        width: dimensiones.contenedor,
        height: dimensiones.contenedor,
        borderRadius: '50%',
        border: '2px solid #2C6E63',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: '#FAF7EE',
        boxShadow: '0 2px 8px rgba(44, 110, 99, 0.12)',
      }}
    >
      <svg
        width={dimensiones.svg}
        height={dimensiones.svg}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Silueta del Ticket Térmico con corte en Zigzag */}
        <path
          d="M24 16C24 13.8 25.8 12 28 12H72C74.2 12 76 13.8 76 16V82L67 75L58 82L50 75L42 82L33 75L24 82V16Z"
          fill="#FFFFFF"
          stroke="#2C6E63"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Doblez / Pliegue superior del ticket */}
        <path
          d="M24 24H76"
          stroke="#E8DFC2"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />

        {/* Sello circular de verificación / cobro exitoso */}
        <circle cx="50" cy="48" r="15" fill="#8FAE3D" />

        {/* Palomita / Checkmark del cobro */}
        <path
          d="M43 48L48 53L57 43"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
