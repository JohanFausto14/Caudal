import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, NegocioAdmin, MetricasPlataforma } from './services/adminApi';
import { ModalRegistro } from './components/ModalRegistro';
import { ModalEditar } from './components/ModalEditar';
import { ModalResetPin } from './components/ModalResetPin';
import { ModalConfirmacion } from './components/ModalConfirmacion';
import { VistaAjustes } from './components/VistaAjustes';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => adminApi.isAuthenticated());
  const [masterPassword, setMasterPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Navegación lateral
  const [currentView, setCurrentView] = useState<'directorio' | 'ajustes'>('directorio');

  // Datos
  const [negocios, setNegocios] = useState<NegocioAdmin[]>([]);
  const [metricas, setMetricas] = useState<MetricasPlataforma | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtros de búsqueda
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

  const mostrarToast = (mensaje: string) => {
    setToastMessage(mensaje);
    setTimeout(() => setToastMessage(null), 3000);
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
      setLoading(true);
      const [listaNegocios, dataMetricas] = await Promise.all([
        adminApi.getNegocios(),
        adminApi.getMetricas(),
      ]);

      setNegocios(listaNegocios);
      setMetricas(dataMetricas);
    } catch {
      mostrarToast('Error al conectar con la API de administración.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      cargarDatos();
      const interval = setInterval(cargarDatos, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, cargarDatos]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await adminApi.login(masterPassword);
      if (res.success) {
        setIsAuthenticated(true);
        setMasterPassword('');
      } else {
        setLoginError(res.message || 'Contraseña incorrecta.');
      }
    } catch {
      setLoginError('Error al contactar el servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    adminApi.logout();
    setIsAuthenticated(false);
    setIsLogoutModalOpen(false);
    mostrarToast('Sesión maestra cerrada.');
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

  const handleEliminarNegocio = async () => {
    if (!negocioAEliminar) return;
    const nombre = negocioAEliminar.nombre;
    const res = await adminApi.deleteNegocio(negocioAEliminar.codigo);
    setNegocioAEliminar(null);
    if (res.success) {
      mostrarToast(`Negocio "${nombre}" eliminado.`);
      await cargarDatos();
    }
  };

  const obtenerUrlPuntoVenta = (codigo: string): string => {
    const currentHost = window.location.hostname;
    const currentProto = window.location.protocol;

    let baseUrl = '';
    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
      baseUrl = `${currentProto}//${currentHost}:5173`;
    } else if (currentHost.includes('-admin.')) {
      baseUrl = `${currentProto}//${currentHost.replace('-admin.', '-pos.')}`;
    } else if (currentHost.includes('admin.')) {
      baseUrl = `${currentProto}//${currentHost.replace('admin.', 'pos.')}`;
    } else {
      baseUrl = `${currentProto}//caudal-pos.vercel.app`;
    }

    return `${baseUrl}/${codigo}`;
  };

  const copiarEnlace = (codigo: string) => {
    setOpenKebabCodigo(null);
    const url = obtenerUrlPuntoVenta(codigo);
    navigator.clipboard.writeText(url);
    mostrarToast(`Enlace de caja copiado: ${url}`);
  };

  const abrirCajaEnNuevaPestana = (codigo: string) => {
    setOpenKebabCodigo(null);
    const url = obtenerUrlPuntoVenta(codigo);
    window.open(url, '_blank');
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

    if (diffMin < 1) return { texto: 'Cerró caja hace un momento', enLinea: false };
    if (diffMin < 60) return { texto: `Cerró caja hace ${diffMin} min`, enLinea: false };

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return { texto: `Cerró caja hace ${diffHrs} hr${diffHrs > 1 ? 's' : ''}`, enLinea: false };

    return { texto: `Cerró caja el ${fecha.toLocaleDateString()}`, enLinea: false };
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-lino)',
        padding: 20,
      }}>
        <div className="modal-panel animate-fade" style={{ width: '100%', maxWidth: 360, padding: 32, textAlign: 'center' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'var(--color-vino-suave)',
            color: 'var(--color-vino)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 20,
            fontWeight: 800,
          }}>
            C
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-grafito)', margin: 0 }}>
            Caudal
          </h1>
          <p style={{ fontSize: 12, color: 'var(--color-piedra)', marginTop: 4, marginBottom: 24 }}>
            Plataforma administrativa
          </p>

          {loginError && (
            <div style={{
              backgroundColor: '#FAF7EE',
              border: '1px solid var(--color-alerta)',
              color: 'var(--color-alerta)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-interactive)',
              fontSize: 12,
              marginBottom: 16,
              textAlign: 'left',
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--color-piedra)', marginBottom: 6 }}>
                Contraseña de acceso
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••••••"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                autoFocus
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loginLoading} style={{ justifyContent: 'center', padding: '10px 16px', marginTop: 4 }}>
              {loginLoading ? 'Verificando...' : 'Entrar a Caudal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const negociosFiltrados = negocios.filter((n) => {
    const coincideTexto =
      n.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.telefono && n.telefono.includes(searchQuery));

    if (!coincideTexto) return false;
    if (statusFilter === 'active') return n.isActive;
    if (statusFilter === 'suspended') return !n.isActive;
    return true;
  });

  const enLineaCount = negocios.filter((n) => n.enLinea && n.isActive).length;

  return (
    <div className="app-shell animate-fade">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div style={{ padding: '0 10px' }}>
            <div className="sidebar-brand-title">Caudal</div>
            <div className="sidebar-brand-subtitle">Plataforma administrativa</div>
          </div>

          <div className="nav-group">
            <div className="nav-group-label">Navegación</div>
            <button
              type="button"
              className={`nav-item ${currentView === 'directorio' ? 'active' : ''}`}
              onClick={() => setCurrentView('directorio')}
            >
              Negocios cliente
            </button>
            <button
              type="button"
              className={`nav-item ${currentView === 'ajustes' ? 'active' : ''}`}
              onClick={() => setCurrentView('ajustes')}
            >
              Ajustes de acceso
            </button>
          </div>
        </div>

        <button
          type="button"
          className="nav-item"
          onClick={() => setIsLogoutModalOpen(true)}
          style={{ color: 'var(--color-alerta)' }}
        >
          Cerrar sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-viewport">
        {currentView === 'ajustes' ? (
          <VistaAjustes onSuccess={(msg) => mostrarToast(msg)} />
        ) : (
          <>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-serif-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-grafito)', margin: 0 }}>
                  Negocios cliente
                </h1>
                <p style={{ fontSize: 13, color: 'var(--color-piedra)', marginTop: 4 }}>
                  Directorio administrativo, estado de servicio y actividad en tiempo real
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'var(--color-piedra)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-interactive)',
                    backgroundColor: 'var(--color-niebla)',
                    border: '1px solid var(--color-linea)',
                  }}
                >
                  <span className="status-dot active" />
                  <span>En línea</span>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  + Registrar negocio
                </button>
              </div>
            </div>

            {/* FILA ÚNICA DE 3 MÉTRICAS LIMPIAS */}
            <div className="metrics-row">
              <div className="metric-cell">
                <div className="metric-cell-label">Total registrados</div>
                <div className="metric-cell-value">{metricas?.totalNegocios ?? negocios.length}</div>
              </div>
              <div className="metric-cell">
                <div className="metric-cell-label">Servicios activos</div>
                <div className="metric-cell-value" style={{ color: 'var(--color-vino)' }}>
                  {metricas?.negociosActivos ?? negocios.filter((n) => n.isActive).length}
                </div>
              </div>
              <div className="metric-cell">
                <div className="metric-cell-label">En línea ahora</div>
                <div className="metric-cell-value" style={{ color: '#8FAE3D' }}>
                  {enLineaCount}
                </div>
              </div>
            </div>

            {/* TABLA PRINCIPAL DE CLIENTES */}
            <div className="table-container">
              <div className="table-header-block">
                <div>
                  <h2 className="table-title">Directorio de negocios</h2>
                  <div style={{ fontSize: 12, color: 'var(--color-piedra)', marginTop: 2 }}>
                    Mostrando {negociosFiltrados.length} de {negocios.length} negocios
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Buscar por nombre o slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: 220 }}
                  />

                  <select
                    className="input-field"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    style={{ width: 130 }}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="suspended">Suspendidos</option>
                  </select>
                </div>
              </div>

              {loading && negocios.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--color-piedra)', fontSize: 13 }}>
                  Cargando directorio de negocios...
                </div>
              ) : negociosFiltrados.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--color-piedra)', fontSize: 13 }}>
                  No se encontraron negocios con los filtros aplicados.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Negocio y contacto</th>
                      <th>Código slug (URL)</th>
                      <th>Estado de servicio</th>
                      <th>Última actividad</th>
                      <th style={{ textAlign: 'center', width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {negociosFiltrados.map((neg) => {
                      const isOpenKebab = openKebabCodigo === neg.codigo;
                      const actividad = formatearEstadoActividad(neg);
                      const urlPuntoVenta = obtenerUrlPuntoVenta(neg.codigo);

                      return (
                        <tr key={neg.id || neg.codigo}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-grafito)' }}>
                              {neg.nombre}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--color-piedra)', marginTop: 2 }}>
                              Tel: {neg.telefono || 'Sin teléfono'}
                            </div>
                          </td>
                          <td>
                            <span
                              onClick={() => copiarEnlace(neg.codigo)}
                              style={{
                                fontFamily: 'monospace',
                                backgroundColor: 'var(--color-niebla)',
                                border: '1px solid var(--color-linea)',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-interactive)',
                                fontSize: 12,
                                color: 'var(--color-vino)',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                              title={`Clic para copiar enlace: ${urlPuntoVenta}`}
                            >
                              {neg.codigo}
                            </span>
                          </td>
                          <td>
                            <div className="status-indicator">
                              <span className={`status-dot ${neg.isActive ? 'active' : 'suspended'}`} />
                              <span style={{ color: neg.isActive ? 'var(--color-grafito)' : 'var(--color-alerta)' }}>
                                {neg.isActive ? 'Activo' : 'Suspendido'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {actividad.enLinea && <span className="status-dot active" />}
                              <span style={{ fontSize: 12, color: actividad.enLinea ? '#2C6E63' : 'var(--color-piedra)', fontWeight: actividad.enLinea ? 600 : 400 }}>
                                {actividad.texto}
                              </span>
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
                                  <button type="button" className="dropdown-item" onClick={() => abrirCajaEnNuevaPestana(neg.codigo)}>
                                    Abrir punto de venta
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
              )}
            </div>
          </>
        )}
      </main>

      {/* MODALES */}
      <ModalRegistro
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(nombre) => {
          cargarDatos();
          mostrarToast(`Negocio "${nombre}" registrado con éxito.`);
        }}
      />

      {editNegocio && (
        <ModalEditar
          negocio={editNegocio}
          onClose={() => setEditNegocio(null)}
          onSuccess={(nombre) => {
            cargarDatos();
            mostrarToast(`Datos de "${nombre}" actualizados.`);
          }}
        />
      )}

      {resetPinNegocio && (
        <ModalResetPin
          negocio={resetPinNegocio}
          onClose={() => setResetPinNegocio(null)}
          onSuccess={(nuevoPin) => {
            cargarDatos();
            mostrarToast(`PIN de "${resetPinNegocio.nombre}" cambiado a "${nuevoPin}".`);
          }}
        />
      )}

      <ModalConfirmacion
        isOpen={Boolean(negocioAEliminar)}
        titulo="¿Eliminar este negocio?"
        mensaje={`Esta acción eliminará de forma permanente el negocio "${negocioAEliminar?.nombre}" y todo su historial de ventas y gastos.`}
        textoBotonConfirmar="Eliminar negocio"
        textoBotonCancelar="Cancelar"
        tipo="peligro"
        onConfirm={handleEliminarNegocio}
        onCancel={() => setNegocioAEliminar(null)}
      />

      <ModalConfirmacion
        isOpen={isLogoutModalOpen}
        titulo="¿Cerrar sesión maestra?"
        mensaje="Tendrás que ingresar tu contraseña maestra para volver a acceder al panel de Caudal."
        textoBotonConfirmar="Cerrar sesión"
        textoBotonCancelar="Permanecer aquí"
        tipo="primario"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* TOAST FLOTANTE */}
      {toastMessage && (
        <div className="toast-top-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
