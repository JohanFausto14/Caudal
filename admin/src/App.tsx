import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, NegocioAdmin, MetricasPlataforma } from './services/adminApi';
import { ModalRegistro } from './components/ModalRegistro';
import { ModalEditar } from './components/ModalEditar';
import { ModalResetPin } from './components/ModalResetPin';
import { ModalConfirmacion } from './components/ModalConfirmacion';
import { VistaAjustes } from './components/VistaAjustes';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminApi.isAuthenticated());
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeNav, setActiveNav] = useState<'negocios' | 'ajustes'>('negocios');
  const [metricas, setMetricas] = useState<MetricasPlataforma | null>(null);
  const [negocios, setNegocios] = useState<NegocioAdmin[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const [openKebabCodigo, setOpenKebabCodigo] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editNegocio, setEditNegocio] = useState<NegocioAdmin | null>(null);
  const [resetPinNegocio, setResetPinNegocio] = useState<NegocioAdmin | null>(null);
  const [negocioAEliminar, setNegocioAEliminar] = useState<NegocioAdmin | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Caudal | Plataforma Administrativa';
  }, []);

  const mostrarToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenKebabCodigo(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      const [met, negs] = await Promise.all([
        adminApi.getMetricas(),
        adminApi.getNegocios(),
      ]);
      setMetricas(met);
      setNegocios(negs);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    cargarDatos();

    const intervalId = setInterval(() => {
      cargarDatos();
    }, 3000);

    const onFocus = () => cargarDatos();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [isAuthenticated, cargarDatos]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const res = await adminApi.login(passwordInput);
    setIsLoggingIn(false);
    if (res.success) {
      setIsAuthenticated(true);
      setPasswordInput('');
      mostrarToast('Bienvenido a Caudal. Plataforma en línea.');
    } else {
      setLoginError(res.message || 'Contraseña incorrecta');
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    adminApi.logout();
    setIsAuthenticated(false);
    mostrarToast('Sesión de Caudal cerrada.');
  };

  const handleToggleEstado = async (neg: NegocioAdmin) => {
    setOpenKebabCodigo(null);
    const nuevoEstado = !neg.isActive;
    const res = await adminApi.toggleEstado(neg.codigo, nuevoEstado);
    if (res.success) {
      mostrarToast(`Estado de "${neg.nombre}" actualizado.`);
      await cargarDatos();
    }
  };

  const handleConfirmEliminar = async () => {
    if (!negocioAEliminar) return;
    const nombre = negocioAEliminar.nombre;
    const res = await adminApi.deleteNegocio(negocioAEliminar.codigo);
    setNegocioAEliminar(null);
    if (res.success) {
      mostrarToast(`Negocio "${nombre}" eliminado.`);
      await cargarDatos();
    }
  };

  const copiarEnlace = (codigo: string) => {
    setOpenKebabCodigo(null);
    const port = window.location.port === '5174' ? ':5173' : (window.location.port ? `:${window.location.port}` : '');
    const url = `${window.location.protocol}//${window.location.hostname}${port}/${codigo}`;
    navigator.clipboard.writeText(url);
    mostrarToast(`Enlace copiado: ${url}`);
  };

  const formatearEstadoActividad = (neg: NegocioAdmin) => {
    if (neg.enLinea && neg.isActive) {
      return { texto: 'En línea ahora (Caja abierta)', enLinea: true };
    }

    const fechaRef = neg.ultimoCierreSesion || neg.ultimaActividad;
    if (!fechaRef) return { texto: 'Sin movimientos registrados', enLinea: false };

    const fecha = new Date(fechaRef);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    const prefijo = neg.ultimoCierreSesion ? 'Cerró caja' : 'Última actividad';

    if (diffMin < 2) {
      return { texto: `${prefijo} hace un momento`, enLinea: false };
    }
    if (diffMin < 60) {
      return { texto: `${prefijo} hace ${diffMin} min`, enLinea: false };
    }

    const esHoy = fecha.toDateString() === ahora.toDateString();
    if (esHoy) {
      return {
        texto: `${prefijo} hoy a las ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
        enLinea: false,
      };
    }

    const ayer = new Date(ahora);
    ayer.setDate(ahora.getDate() - 1);
    if (fecha.toDateString() === ayer.toDateString()) {
      return {
        texto: `${prefijo} ayer a las ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
        enLinea: false,
      };
    }

    return {
      texto: `${prefijo} ${fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
      enLinea: false,
    };
  };

  const negociosFiltrados = negocios.filter((n) => {
    const coincideTexto = n.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || n.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    if (!coincideTexto) return false;
    if (statusFilter === 'active') return n.isActive;
    if (statusFilter === 'suspended') return !n.isActive;
    return true;
  });

  const estaConectado = Boolean(metricas?.dbStatus?.connected ?? true);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-lino)', padding: 16 }}>
        <div className="modal-panel animate-fade" style={{ maxWidth: 380, padding: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--color-grafito)', margin: 0 }}>
              Caudal
            </h1>
            <p style={{ fontSize: '12.5px', color: 'var(--color-piedra)', marginTop: 2 }}>
              Plataforma administrativa
            </p>
          </div>

          {loginError && (
            <div style={{ background: 'var(--color-vino-suave)', border: '1px solid var(--color-linea)', color: 'var(--color-vino)', padding: '8px 12px', borderRadius: 'var(--radius-interactive)', fontSize: '12.5px', marginBottom: 16, fontWeight: 500 }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-piedra)', display: 'block', marginBottom: 5 }}>
                Contraseña de acceso
              </label>
              <input
                type="password"
                required
                autoFocus
                className="input-field"
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isLoggingIn} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 4 }}>
              {isLoggingIn ? 'Verificando...' : 'Entrar a Caudal'}
            </button>
          </form>
        </div>

        {/* Notificación Superior */}
        {toastMessage && (
          <div className="toast-top-notification">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8FAE3D', display: 'inline-block' }} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  const totalNegociosCount = metricas?.totalNegocios ?? negocios.length;
  const negociosActivosCount = metricas?.negociosActivos ?? negocios.filter(n => n.isActive).length;
  const enLineaCount = negocios.filter(n => n.enLinea && n.isActive).length;

  return (
    <div className="app-shell animate-fade">
      {/* SIDEBAR FIJO (224px) */}
      <aside className="sidebar">
        <div>
          <div style={{ padding: '0 10px' }}>
            <div className="sidebar-brand-title" style={{ fontSize: '19px', fontWeight: 800 }}>Caudal</div>
            <div className="sidebar-brand-subtitle">Plataforma administrativa</div>
          </div>

          <div className="nav-group">
            <div className="nav-group-label">General</div>
            <button onClick={() => setActiveNav('negocios')} className={`nav-item ${activeNav === 'negocios' ? 'active' : ''}`}>
              Negocios cliente
            </button>
          </div>

          <div className="nav-group" style={{ marginTop: 22 }}>
            <div className="nav-group-label">Sistema</div>
            <button onClick={() => setActiveNav('ajustes')} className={`nav-item ${activeNav === 'ajustes' ? 'active' : ''}`}>
              Ajustes de acceso
            </button>
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="nav-item"
              style={{ color: 'var(--color-piedra)', marginTop: 4 }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div style={{ padding: '0 10px', fontSize: '11.5px', color: 'var(--color-piedra)' }}>
          <div>Caudal v1.0.0</div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-viewport">
        {activeNav === 'negocios' && (
          <div>
            {/* ENCABEZADO PRINCIPAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: '20px', fontWeight: 600, color: 'var(--color-grafito)', margin: 0 }}>
                  Negocios cliente
                </h1>
                <p style={{ fontSize: '12.5px', color: 'var(--color-piedra)', marginTop: 2 }}>
                  Directorio administrativo, estado de servicio y actividad en tiempo real
                </p>
              </div>

              {/* GRUPO DE ACCIONES: INDICADOR + BOTÓN DE REGISTRO */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    background: '#FFFFFF',
                    border: '1px solid var(--color-linea)',
                    borderRadius: 'var(--radius-interactive)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: estaConectado ? '#2C6E63' : '#D14829',
                  }}
                  title={estaConectado ? 'Sistema en línea y funcionando' : 'Sin conexión'}
                >
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: estaConectado ? '#8FAE3D' : '#D14829',
                    boxShadow: estaConectado ? '0 0 6px rgba(143, 174, 61, 0.8)' : 'none',
                    display: 'inline-block',
                  }} />
                  <span>{estaConectado ? 'En línea' : 'Sin conexión'}</span>
                </div>

                <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
                  + Registrar negocio
                </button>
              </div>
            </div>

            {/* FILA ÚNICA DE MÉTRICAS (3 CELDAS SIN DUPLICACIÓN) */}
            <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
              <div className="metric-cell">
                <div className="metric-cell-label">Total registrados</div>
                <div className="metric-cell-value">
                  {totalNegociosCount}
                </div>
              </div>
              <div className="metric-cell">
                <div className="metric-cell-label">Servicios activos</div>
                <div className="metric-cell-value" style={{ color: 'var(--color-vino)' }}>
                  {negociosActivosCount}
                </div>
              </div>
              <div className="metric-cell">
                <div className="metric-cell-label">En línea ahora</div>
                <div className="metric-cell-value" style={{ color: '#2C6E63' }}>
                  {enLineaCount}
                </div>
              </div>
            </div>

            {/* Tabla de Directorio de Negocios */}
            <div className="table-container">
              <div className="table-header-block">
                <div>
                  <h2 className="table-title">Directorio de negocios</h2>
                  <span style={{ fontSize: '12px', color: 'var(--color-piedra)' }}>
                    Mostrando {negociosFiltrados.length} de {negocios.length} negocios
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o slug..."
                    className="input-field"
                    style={{ width: 220, padding: '6px 10px', fontSize: '12.5px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <select
                    className="input-field"
                    style={{ width: 130, padding: '6px 8px', fontSize: '12.5px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Solo activos</option>
                    <option value="suspended">Suspendidos</option>
                  </select>
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Negocio y contacto</th>
                    <th>Código slug (URL)</th>
                    <th>Estado de servicio</th>
                    <th>Última actividad</th>
                    <th style={{ width: 44, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {negociosFiltrados.map((neg) => {
                    const isOpenKebab = openKebabCodigo === neg.codigo;
                    const actividad = formatearEstadoActividad(neg);

                    return (
                      <tr key={neg.id || neg.codigo}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--color-grafito)' }}>
                            {neg.nombre}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--color-piedra)' }}>
                            {neg.telefono ? `Tel: ${neg.telefono}` : 'Sin teléfono registrado'}
                          </div>
                        </td>
                        <td>
                          <code style={{ background: 'var(--color-niebla)', padding: '2px 6px', borderRadius: 4, fontSize: '12px', color: 'var(--color-grafito)' }}>
                            {neg.codigo}
                          </code>
                        </td>
                        <td>
                          <div className="status-indicator">
                            <span className={`status-dot ${neg.isActive ? 'active' : 'suspended'}`} />
                            <span>{neg.isActive ? 'Activo' : 'Suspendido'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '12.5px',
                            color: actividad.enLinea ? 'var(--color-vino)' : 'var(--color-piedra)',
                            fontWeight: actividad.enLinea ? 600 : 400,
                          }}>
                            {actividad.enLinea && (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-vino)', display: 'inline-block' }} />
                            )}
                            {actividad.texto}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="kebab-wrapper" ref={isOpenKebab ? menuRef : undefined}>
                            <button
                              type="button"
                              className="btn-kebab"
                              onClick={() => setOpenKebabCodigo(isOpenKebab ? null : neg.codigo)}
                              title="Opciones del negocio"
                            >
                              ⋯
                            </button>

                            {isOpenKebab && (
                              <div className="dropdown-menu">
                                <button type="button" className="dropdown-item" onClick={() => copiarEnlace(neg.codigo)}>
                                  Copiar enlace
                                </button>
                                <button type="button" className="dropdown-item" onClick={() => { setEditNegocio(neg); setOpenKebabCodigo(null); }}>
                                  Editar contacto
                                </button>
                                <button type="button" className="dropdown-item" onClick={() => { setResetPinNegocio(neg); setOpenKebabCodigo(null); }}>
                                  Resetear PIN
                                </button>
                                <button type="button" className="dropdown-item" onClick={() => handleToggleEstado(neg)}>
                                  {neg.isActive ? 'Suspender negocio' : 'Activar negocio'}
                                </button>
                                {neg.codigo !== 'elharocho' && (
                                  <button type="button" className="dropdown-item danger" onClick={() => { setNegocioAEliminar(neg); setOpenKebabCodigo(null); }}>
                                    Eliminar negocio
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeNav === 'ajustes' && (
          <VistaAjustes onSuccess={(msg) => mostrarToast(msg)} />
        )}
      </main>

      {/* Modal Registrar Negocio */}
      <ModalRegistro
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(nom) => {
          mostrarToast(`Negocio "${nom}" registrado exitosamente.`);
          cargarDatos();
        }}
      />

      {/* Modal Editar Negocio */}
      {editNegocio && (
        <ModalEditar
          negocio={editNegocio}
          onClose={() => setEditNegocio(null)}
          onSuccess={(nom) => {
            mostrarToast(`Datos de "${nom}" actualizados.`);
            cargarDatos();
          }}
        />
      )}

      {/* Modal Resetear PIN */}
      {resetPinNegocio && (
        <ModalResetPin
          negocio={resetPinNegocio}
          onClose={() => setResetPinNegocio(null)}
          onSuccess={(pin) => {
            mostrarToast(`PIN de "${resetPinNegocio.nombre}" cambiado a "${pin}".`);
          }}
        />
      )}

      {/* Modal Confirmar Cierre de Sesión */}
      <ModalConfirmacion
        isOpen={isLogoutModalOpen}
        titulo="¿Cerrar sesión de Caudal?"
        mensaje="Se cerrará la sesión de administración activa. Necesitarás ingresar tu contraseña de acceso para volver a entrar."
        textoBotonConfirmar="Sí, Cerrar Sesión"
        textoBotonCancelar="Permanecer en Caudal"
        tipo="peligro"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* Modal Confirmar Eliminación de Negocio */}
      <ModalConfirmacion
        isOpen={Boolean(negocioAEliminar)}
        titulo="¿Eliminar permanentemente?"
        mensaje="Se eliminarán todos los platillos, ventas y registros de este negocio de la plataforma."
        detalle={negocioAEliminar ? `${negocioAEliminar.nombre} (/${negocioAEliminar.codigo})` : ''}
        textoBotonConfirmar="Sí, Eliminar Negocio"
        textoBotonCancelar="Cancelar"
        tipo="peligro"
        onConfirm={handleConfirmEliminar}
        onCancel={() => setNegocioAEliminar(null)}
      />

      {/* Notificación Toast Superior */}
      {toastMessage && (
        <div className="toast-top-notification">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8FAE3D', display: 'inline-block' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
