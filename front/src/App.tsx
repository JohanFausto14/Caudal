import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product, Sale, Expense, StatsResponse, DatabaseStatus, Negocio } from './types/tipos';
import { Navegacion } from './components/Navegacion';
import { Dashboard } from './components/Dashboard';
import { PuntoVenta } from './components/PuntoVenta';
import { GestionProductos } from './components/GestionProductos';
import { GestionGastos } from './components/GestionGastos';
import { ModalGasto } from './components/ModalGasto';
import { ModalPersonalizarLogo } from './components/ModalPersonalizarLogo';
import { ModalConfirmacion } from './components/ModalConfirmacion';
import { PantallaLoginNegocio } from './components/PantallaLoginNegocio';
import { api, detectarCodigoNegocioDesdeUrl } from './services/api';
import { obtenerRangosPeriodoClaves, obtenerClaveFechaLocal } from './utils/fechas';

export function App() {
  const [slug] = useState(() => detectarCodigoNegocioDesdeUrl());
  const [negocioInfo, setNegocioInfo] = useState<Negocio | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [estaAutenticado, setEstaAutenticado] = useState(() => api.isAuthenticated());

  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'products' | 'expenses'>('dashboard');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [dbStatus, setDbStatus] = useState<{ isOnline: boolean; mongoConnected: boolean; database?: DatabaseStatus }>({
    isOnline: false,
    mongoConnected: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevOnlineRef = useRef<boolean>(false);

  const mostrarToast = (mensaje: string) => {
    setToastMessage(mensaje);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cargar información del negocio al iniciar
  useEffect(() => {
    const cargarInfo = async () => {
      try {
        const res = await api.getInfoPublicaNegocio(slug);
        if (res.success && res.data) {
          setNegocioInfo(res.data);
          document.title = `${res.data.nombre} | Punto de Venta`;
        } else {
          setErrorCarga(res.message || 'No se pudo cargar la información del negocio.');
        }
      } catch {
        setErrorCarga('Error de conexión al cargar el negocio.');
      }
    };
    cargarInfo();
  }, [slug]);

  const loadData = useCallback(async () => {
    if (!estaAutenticado) return;

    try {
      const health = await api.getDbHealth();
      setDbStatus(health);

      const [prodData, totalSales, totalExpenses] = await Promise.all([
        api.getProducts(),
        api.getSales(),
        api.getExpenses(),
      ]);

      setProducts(prodData);
      setAllSales(totalSales);
      setAllExpenses(totalExpenses);

      const { start, end } = obtenerRangosPeriodoClaves(period);
      const statsData = await api.getStats(start, end);
      setStats(statsData);

      const filteredSales = totalSales.filter((s) => {
        const k = obtenerClaveFechaLocal(s.createdAt);
        if (start && k < start) return false;
        if (end && k > end) return false;
        return true;
      });

      const filteredExpenses = totalExpenses.filter((e) => {
        const k = obtenerClaveFechaLocal(e.date);
        if (start && k < start) return false;
        if (end && k > end) return false;
        return true;
      });

      setSales(filteredSales);
      setExpenses(filteredExpenses);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  }, [period, estaAutenticado]);

  useEffect(() => {
    if (!estaAutenticado) return;

    loadData();

    const verificarYSincronizar = async () => {
      const health = await api.getDbHealth();
      setDbStatus(health);

      const estaEnLinea = health.isOnline || health.mongoConnected;

      if (estaEnLinea) {
        const pendientes = await api.sincronizarPendientes();
        if (pendientes > 0) {
          setIsSyncing(true);
          await loadData();
          setIsSyncing(false);
        }
      }

      if (!prevOnlineRef.current && estaEnLinea) {
        loadData();
      }
      prevOnlineRef.current = estaEnLinea;
    };

    const intervalId = setInterval(verificarYSincronizar, 4000);

    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [loadData, estaAutenticado]);

  const handleCreateExpense = async (data: Partial<Expense>) => {
    try {
      await api.createExpense(data);
      mostrarToast('Gasto registrado con éxito');
      await loadData();
    } catch (err) {
      console.error('Error al crear gasto:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const ok = await api.deleteExpense(id);
      if (ok) {
        mostrarToast('Gasto eliminado');
        await loadData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      return false;
    }
  };

  const handleCreateProduct = async (prod: Partial<Product>) => {
    const nuevo = await api.createProduct(prod);
    mostrarToast(`Platillo "${nuevo.name}" agregado`);
    await loadData();
    return nuevo;
  };

  const handleUpdateProduct = async (id: string, prod: Partial<Product>) => {
    const actualizado = await api.updateProduct(id, prod);
    mostrarToast('Platillo actualizado');
    await loadData();
    return actualizado;
  };

  const handleDeleteProduct = async (id: string) => {
    const ok = await api.deleteProduct(id);
    if (ok) {
      mostrarToast('Platillo eliminado');
      await loadData();
      return true;
    }
    return false;
  };

  const handleCreateSale = async (data: Partial<Sale>) => {
    const venta = await api.createSale(data);
    mostrarToast('Venta cobrada con éxito');
    await loadData();
    return venta;
  };

  const handleDeleteSale = async (id: string) => {
    const ok = await api.deleteSale(id);
    if (ok) {
      mostrarToast('Venta anulada');
      await loadData();
      return true;
    }
    return false;
  };

  const handleGuardarLogo = async (nuevoLogo: string | null) => {
    const res = await api.actualizarLogoNegocio(nuevoLogo);
    if (res.success) {
      if (negocioInfo) {
        setNegocioInfo({ ...negocioInfo, logoUrl: nuevoLogo || undefined });
      }
      mostrarToast(nuevoLogo ? 'Logo del negocio actualizado' : 'Logo restablecido al predeterminado');
      return true;
    } else {
      mostrarToast(res.message || 'Error al guardar logo');
      return false;
    }
  };

  const handleConfirmLockTerminal = async () => {
    setIsLockModalOpen(false);
    await api.logout();
    setEstaAutenticado(false);
    mostrarToast('Terminal bloqueada.');
  };

  if (!estaAutenticado) {
    return (
      <PantallaLoginNegocio
        negocioInfo={negocioInfo}
        codigoSlug={slug}
        errorCarga={errorCarga}
        onLoginExitoso={(neg) => {
          setNegocioInfo(neg);
          setEstaAutenticado(true);
          mostrarToast(`Bienvenido a ${neg.nombre}`);
        }}
      />
    );
  }

  const negocioActivo = negocioInfo || api.getActiveBusiness();

  return (
    <div className="app-shell animate-fade">
      <Navegacion
        pestanaActiva={activeTab}
        setPestanaActiva={setActiveTab}
        estadoBD={dbStatus}
        negocioActivo={negocioActivo}
        isSyncing={isSyncing}
        alAbrirNuevoGasto={() => setIsExpenseModalOpen(true)}
        alAbrirModalLogo={() => setIsLogoModalOpen(true)}
        alCerrarSesion={() => setIsLockModalOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            recentSales={sales}
            recentExpenses={expenses}
            allSales={allSales}
            allExpenses={allExpenses}
            negocioActivo={negocioActivo}
            onNavigate={setActiveTab}
            onRefresh={loadData}
            period={period}
            setPeriod={setPeriod}
          />
        )}

        {activeTab === 'pos' && (
          <PuntoVenta
            products={products}
            recentSales={sales}
            negocioActivo={negocioActivo}
            onSaleCompleted={loadData}
            createSale={handleCreateSale}
            onDeleteSale={handleDeleteSale}
            onNotify={(msg) => mostrarToast(msg)}
          />
        )}

        {activeTab === 'products' && (
          <GestionProductos
            products={products}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'expenses' && (
          <GestionGastos
            allExpenses={allExpenses}
            onOpenCreateExpense={() => setIsExpenseModalOpen(true)}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </main>

      <ModalGasto
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleCreateExpense}
      />

      {/* Modal para Subir / Personalizar Logo del Negocio */}
      <ModalPersonalizarLogo
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        logoActual={negocioActivo.logoUrl}
        nombreNegocio={negocioActivo.nombre}
        onGuardarLogo={handleGuardarLogo}
      />

      {/* Modal de Confirmación de Bloqueo de Terminal */}
      <ModalConfirmacion
        isOpen={isLockModalOpen}
        titulo="¿Bloquear Terminal?"
        mensaje="Para volver a operar la caja necesitarás ingresar el PIN de seguridad del negocio."
        textoBotonConfirmar="Bloquear Terminal"
        textoBotonCancelar="Permanecer en la Caja"
        colorBoton="ola"
        onConfirm={handleConfirmLockTerminal}
        onCancel={() => setIsLockModalOpen(false)}
      />

      {/* Notificación Flotante Superior */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: '#152420',
          color: '#FFFFFF',
          border: '1px solid #E8DFC2',
          boxShadow: '0 8px 24px rgba(21, 36, 32, 0.22)',
          padding: '10px 18px',
          borderRadius: 4,
          fontSize: '0.82rem',
          fontWeight: 600,
          zIndex: 99999,
          animation: 'smoothFadeIn 0.2s ease-out',
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
