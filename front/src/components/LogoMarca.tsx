import React, { useState } from 'react';
import logoTicketImg from '../assets/logo-ticket.png';

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
    sm: 28,
    md: 38,
    lg: 48,
    xl: 64,
  }[tamano];

  // Si el negocio subió su logo personalizado
  if (logoUrl && !imgError) {
    return (
      <div
        style={{
          width: dimensiones,
          height: dimensiones,
          borderRadius: 8,
          border: '2px solid #2C6E63',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(44, 110, 99, 0.16)',
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

  // Isotipo Oficial: El Ticket Térmico con Sello de Verificación
  return (
    <div
      style={{
        width: dimensiones,
        height: dimensiones,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: '#FAF7EE',
        border: '1.5px solid #E8DFC2',
        boxShadow: '0 2px 8px rgba(44, 110, 99, 0.12)',
        overflow: 'hidden',
        padding: 2,
      }}
    >
      <img
        src={logoTicketImg}
        alt="Punto de Venta"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
};
