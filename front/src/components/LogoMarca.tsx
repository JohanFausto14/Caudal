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
    sm: { contenedor: 26, anillo: 16, nucleo: 6 },
    md: { contenedor: 36, anillo: 22, nucleo: 8 },
    lg: { contenedor: 44, anillo: 28, nucleo: 10 },
    xl: { contenedor: 64, anillo: 42, nucleo: 16 },
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

  // Isotipo elegante predeterminado
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
        background: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(44, 110, 99, 0.12)',
      }}
    >
      <div
        style={{
          width: dimensiones.anillo,
          height: dimensiones.anillo,
          borderRadius: '50%',
          border: '1.5px dashed #D4C9A7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: dimensiones.nucleo,
            height: dimensiones.nucleo,
            borderRadius: '50%',
            background: '#8FAE3D',
          }}
        />
      </div>
    </div>
  );
};
