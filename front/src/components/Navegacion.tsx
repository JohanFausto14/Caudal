import React from 'react';
import type { DatabaseStatus, Negocio } from '../types/tipos';
import { LogoMarca } from './LogoMarca';

interface PropiedadesNavegacion {
  pestanaActiva: 'dashboard' | 'pos' | 'products' | 'expenses';
  setPestanaActiva: (pestana: 'dashboard' | 'pos' | 'products' | 'expenses') => void;
  estadoBD: { isOnline: boolean; mongoConnected: boolean; database?: DatabaseStatus };
  negocioActivo: Negocio;
  isSyncing?: boolean;
  alAbrirNuevoGasto: () => void;
  alAbrirModalLogo?: () => void;
  alCerrarSesion: () => void;
}

export const Navegacion: React.FC<PropiedadesNavegacion> = ({
  pestanaActiva,
  setPestanaActiva,
  estadoBD,
  negocioActivo,
  isSyncing = false,
  alAbrirNuevoGasto,
  alAbrirModalLogo,
  alCerrarSesion,
}) => {
  const isOnline = estadoBD.mongoConnected || estadoBD.isOnline;

  const pestanas = [
    { id: 'dashboard', label: 'Resumen' },
    { id: 'pos', label: 'Punto de venta' },
    { id: 'products', label: 'Menú' },
    { id: 'expenses', label: 'Gastos' },
  ];

  const getBeaconClass = () => {
    if (isSyncing) return 'syncing';
    return isOnline ? 'online' : 'offline';
  };

  const getBeaconTitle = () => {
    if (isSyncing) return 'Sincronizando con la base de datos...';
    return isOnline ? 'Sistema en línea y sincronizado' : 'Sin conexión con el servidor (Guardando localmente)';
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Marca Oficial del Negocio con Botón para Personalizar Logo */}
        <div className="brand-container">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (alAbrirModalLogo) alAbrirModalLogo();
            }}
            style={{ cursor: 'pointer', position: 'relative' }}
            title="Clic para cambiar o personalizar logo del negocio"
          >
            <LogoMarca tamano="md" logoUrl={negocioActivo.logoUrl} nombre={negocioActivo.nombre} />
          </div>

          <div
            onClick={() => setPestanaActiva('dashboard')}
            className="brand-text-block"
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-main-title">
              {negocioActivo.nombre || 'Tostiaguachiles El Harocho'}
            </div>
            <div className="brand-subtitle">
              Panel de Administración
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Negocio (4 Pestañas Limpias) */}
        <nav className="nav-tabs-wrapper no-scrollbar">
          {pestanas.map((item) => {
            const activo = pestanaActiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPestanaActiva(item.id as any)}
                className={`nav-tab-item ${activo ? 'active' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Acciones: Botón de Gasto + Foquito de Estado Silencioso + Botón de Bloqueo */}
        <div className="nav-actions-group">
          {pestanaActiva !== 'expenses' && (
            <button
              onClick={alAbrirNuevoGasto}
              className="btn-chile btn-gasto-header"
            >
              <span className="btn-text-desktop">+ Registrar Gasto</span>
              <span className="btn-text-mobile">+ Gasto</span>
            </button>
          )}

          {/* Indicador de Estado Silencioso (Sin modales técnicos) */}
          <div
            className="status-beacon-btn"
            title={getBeaconTitle()}
            style={{ cursor: 'default' }}
          >
            <div className={`status-beacon-light ${getBeaconClass()}`} />
          </div>

          <button
            onClick={alCerrarSesion}
            className="btn-outline"
            style={{
              padding: '6px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              color: '#5C6E67',
            }}
            title="Bloquear Terminal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Bloquear</span>
          </button>
        </div>
      </div>
    </header>
  );
};
