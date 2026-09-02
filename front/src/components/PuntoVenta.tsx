import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Product, Sale, Negocio } from '../types/tipos';
import { formatearMoneda, obtenerId } from '../utils/formato';
import { formatearHoraLocal, formatearFechaLocal } from '../utils/fechas';
import { ModalConfirmacion } from './ModalConfirmacion';

interface CartItem {
  product: Product;
  quantity: number;
}

interface PropiedadesPuntoVenta {
  products: Product[];
  recentSales: Sale[];
  negocioActivo?: Negocio;
  onSaleCompleted: () => void;
  createSale: (sale: Partial<Sale>) => Promise<Sale>;
  onDeleteSale?: (id: string) => Promise<boolean>;
  onNotify?: (msg: string) => void;
  onOpenCreateExpense?: () => void;
}

export const PuntoVenta: React.FC<PropiedadesPuntoVenta> = ({
  products,
  recentSales,
  negocioActivo,
  onSaleCompleted,
  createSale,
  onDeleteSale,
  onNotify,
  onOpenCreateExpense,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Modal de anulación de orden
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [searchRecentSale, setSearchRecentSale] = useState<string>('');

  const nombreNegocio = negocioActivo?.nombre || 'Tostiaguachiles El Harocho';

  // Listener para cerrar modal de cobro exitoso con Escape
  useEffect(() => {
    if (!lastSale) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLastSale(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastSale]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Todos los platillos del catálogo (sin exclusión por activo/inactivo)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => obtenerId(item.product) === obtenerId(product));
      if (existing) {
        return prev.map((item) =>
          obtenerId(item.product) === obtenerId(product)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (obtenerId(item.product) === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  }, [cart]);

  // Cálculo de cambio en efectivo
  const cambio = useMemo(() => {
    if (paymentMethod !== 'Efectivo' || !montoRecibido) return 0;
    const recibido = parseFloat(montoRecibido) || 0;
    return Math.max(0, recibido - total);
  }, [paymentMethod, montoRecibido, total]);

  const filteredRecentSales = useMemo(() => {
    if (!searchRecentSale) return recentSales;
    return recentSales.filter((s) => {
      const matchClient = (s.customerName || '').toLowerCase().includes(searchRecentSale.toLowerCase());
      const matchDish = s.items?.some((it) => it.name.toLowerCase().includes(searchRecentSale.toLowerCase()));
      return matchClient || matchDish;
    });
  }, [recentSales, searchRecentSale]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      setIsSubmitting(true);
      const saleData: Partial<Sale> = {
        items: cart.map((item) => {
          const unitCost = item.product.costPrice || 0;
          return {
            product: obtenerId(item.product),
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.salePrice,
            unitCost,
            subtotal: item.product.salePrice * item.quantity,
            costSubtotal: unitCost * item.quantity,
          };
        }),
        total,
        paymentMethod,
        customerName: customerName.trim() ? customerName.trim() : 'Cliente',
        notes: notes.trim(),
      };

      const saved = await createSale(saleData);
      setLastSale(saved);
      setCart([]);
      setCustomerName('');
      setNotes('');
      setMontoRecibido('');
      setPaymentMethod('Efectivo');
      onSaleCompleted();
    } catch (err) {
      console.error('Error al registrar venta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancelSale = async () => {
    if (!saleToCancel || !onDeleteSale) return;
    const ok = await onDeleteSale(obtenerId(saleToCancel));
    if (ok && onNotify) {
      onNotify('Venta anulada.');
    }
    setSaleToCancel(null);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* GRID PRINCIPAL: CATÁLOGO Y COMANDA DE COBRO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: CATÁLOGO DE PLATILLOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Barra de Filtros por Categoría */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'btn-limon' : 'btn-outline'}
                style={{ padding: '6px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                {cat === 'all' ? 'Todos los platillos' : cat}
              </button>
            ))}
          </div>

          {/* Buscador de Platillos */}
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem' }}
          />

          {/* Grid de Platillos con botón + dedicado y clic en tarjeta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {filteredProducts.map((product) => {
              const pId = obtenerId(product);
              const inCart = cart.find((it) => obtenerId(it.product) === pId);

              return (
                <div
                  key={pId}
                  onClick={() => addToCart(product)}
                  style={{
                    background: inCart ? '#FAF7EE' : '#FFFFFF',
                    border: inCart ? '2px solid #8FAE3D' : '1px solid #E8DFC2',
                    borderRadius: 6,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 92,
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#152420', lineHeight: 1.2 }}>
                      {product.name}
                    </div>
                    {product.description && (
                      <div style={{ fontSize: '0.74rem', color: '#5C6E67', marginTop: 3, lineHeight: 1.2 }}>
                        {product.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.05rem', fontWeight: 800, color: '#8FAE3D' }}>
                      {formatearMoneda(product.salePrice)}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {inCart && (
                        <span style={{ fontSize: '0.72rem', background: '#8FAE3D', color: '#FFFFFF', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>
                          {inCart.quantity}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="btn-limon"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 4,
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 800,
                        }}
                        title="Agregar a la orden"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA: COMANDA Y COBRO */}
        <div className="boleta-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8DFC2', paddingBottom: 10 }}>
            <div>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.25rem', fontWeight: 800, color: '#152420', margin: 0 }}>
                Orden en Curso
              </h2>
              <span style={{ fontSize: '0.76rem', color: '#5C6E67' }}>
                {cart.length} {cart.length === 1 ? 'platillo seleccionado' : 'platillos seleccionados'}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                style={{ background: 'none', border: 'none', color: '#D14829', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Vaciar orden
              </button>
            )}
          </div>

          {/* Lista de Platillos en la Orden */}
          {cart.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {cart.map((item) => {
                const pId = obtenerId(item.product);
                return (
                  <div
                    key={pId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: '#FAF7EE',
                      borderRadius: 4,
                      border: '1px solid #E8DFC2',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#152420' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#5C6E67' }}>
                        {formatearMoneda(item.product.salePrice)} c/u
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(pId, -1)}
                        className="btn-outline"
                        style={{ padding: '2px 8px', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', minWidth: 16, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(pId, 1)}
                        className="btn-outline"
                        style={{ padding: '2px 8px', fontSize: '0.82rem', fontWeight: 700 }}
                      >
                        +
                      </button>

                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#8FAE3D', minWidth: 54, textAlign: 'right' }}>
                        {formatearMoneda(item.product.salePrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#8E9F99', border: '1px dashed #E8DFC2', borderRadius: 4, fontSize: '0.82rem' }}>
              Toca los platillos del menú a la izquierda para agregarlos a la orden.
            </div>
          )}

          {/* Formulario de Cobro */}
          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #E8DFC2', paddingTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#152420', display: 'block', marginBottom: 3 }}>
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  placeholder="Cliente"
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#152420', display: 'block', marginBottom: 3 }}>
                  Método de Pago
                </label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
            </div>

            {/* Calculadora de Cambio para Efectivo */}
            {paymentMethod === 'Efectivo' && (
              <div style={{ background: '#FAF7EE', padding: '10px 12px', borderRadius: 4, border: '1px solid #E8DFC2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#152420' }}>
                    Paga con ($):
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[50, 100, 200, 500].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setMontoRecibido(String(b))}
                        className="btn-outline"
                        style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                      >
                        ${b}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="any"
                    placeholder="Monto recibido..."
                    className="form-input"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    style={{ width: 130, padding: '5px 8px', fontSize: '0.86rem', fontWeight: 700 }}
                  />

                  {parseFloat(montoRecibido) >= total && total > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: '#5C6E67', display: 'block' }}>Cambio a entregar:</span>
                      <strong style={{ fontSize: '1.05rem', color: '#8FAE3D', fontFamily: "'Fraunces', Georgia, serif" }}>
                        {formatearMoneda(cambio)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#152420', display: 'block', marginBottom: 3 }}>
                Nota de preparación (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Sin cebolla, extra salsa..."
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
              />
            </div>

            {/* Total y Botón Cobrar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTop: '1px solid #E8DFC2' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#5C6E67', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total a Cobrar:
                </span>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.8rem', fontWeight: 800, color: '#152420', lineHeight: 1 }}>
                  {formatearMoneda(total)}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="btn-limon"
                style={{ padding: '10px 22px', fontSize: '0.92rem', fontWeight: 700 }}
              >
                {isSubmitting ? 'Cobrando...' : 'Cobrar Orden'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: ÓRDENES RECIENTES DEL TURNO */}
      <div className="boleta-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.2rem', fontWeight: 700, color: '#152420', margin: 0 }}>
              Órdenes Cobradas en el Turno
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#5C6E67' }}>
              Historial de cobros recientes con opción de anulación inmediata
            </span>
          </div>

          <input
            type="text"
            placeholder="Buscar orden por cliente o platillo..."
            className="form-input"
            value={searchRecentSale}
            onChange={(e) => setSearchRecentSale(e.target.value)}
            style={{ width: 240, padding: '5px 10px', fontSize: '0.8rem' }}
          />
        </div>

        {filteredRecentSales.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {filteredRecentSales.map((sale) => {
              const sId = obtenerId(sale);

              return (
                <div
                  key={sId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: '#FAF7EE',
                    borderRadius: 4,
                    border: '1px solid #E8DFC2',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.9rem', color: '#152420' }}>
                        {sale.customerName || 'Cliente'}
                      </strong>
                      <span style={{ fontSize: '0.74rem', background: '#E8DFC2', padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>
                        {sale.paymentMethod}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#5C6E67' }}>
                        {formatearHoraLocal(sale.createdAt)} hrs
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#5C6E67', marginTop: 2 }}>
                      {sale.items?.map((it) => `${it.quantity}x ${it.name}`).join(' • ')}
                      {sale.notes && ` (Nota: ${sale.notes})`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.15rem', fontWeight: 800, color: '#8FAE3D' }}>
                      {formatearMoneda(sale.total)}
                    </span>

                    {onDeleteSale && (
                      <button
                        type="button"
                        onClick={() => setSaleToCancel(sale)}
                        style={{
                          background: 'rgba(209, 72, 41, 0.08)',
                          border: '1px solid rgba(209, 72, 41, 0.3)',
                          color: '#D14829',
                          padding: '4px 8px',
                          borderRadius: 3,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Anular orden"
                      >
                        Anular
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8E9F99', border: '1px dashed #E8DFC2', borderRadius: 4, fontSize: '0.82rem' }}>
            Aún no se han cobrado órdenes en este turno.
          </div>
        )}
      </div>

      {/* MODAL PORTAL DE VENTA COBRADA CON ÉXITO (100% Fullscreen y Tecla Esc) */}
      {lastSale && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(21, 36, 32, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div className="modal-content animate-fade" style={{ maxWidth: 380, width: '100%', textAlign: 'center', padding: '28px', background: '#FFFFFF', border: '1px solid #E8DFC2', borderRadius: 6, boxShadow: '0 20px 50px rgba(21, 36, 32, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -10 }}>
              <button
                type="button"
                onClick={() => setLastSale(null)}
                style={{ background: 'none', border: 'none', color: '#5C6E67', cursor: 'pointer', padding: 4 }}
                title="Cerrar (Esc)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(143, 174, 61, 0.15)', color: '#74912E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.4rem', fontWeight: 800, color: '#152420', margin: '0 0 4px' }}>
              Venta Cobrada con Éxito
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#5C6E67', margin: '0 0 14px' }}>
              Cliente: <strong>{lastSale.customerName || 'Cliente'}</strong>
            </p>

            <div style={{ background: '#FAF7EE', border: '1px dashed #E8DFC2', padding: '14px', borderRadius: 4, marginBottom: 18 }}>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '2rem', fontWeight: 800, color: '#8FAE3D' }}>
                {formatearMoneda(lastSale.total)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#5C6E67', marginTop: 2 }}>
                Pago con {lastSale.paymentMethod}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLastSale(null)}
              className="btn-limon"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.9rem' }}
            >
              Nueva Orden (Esc)
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Anulación de Venta (Renderizado con Portal Fullscreen) */}
      <ModalConfirmacion
        isOpen={Boolean(saleToCancel)}
        titulo="¿Anular esta orden?"
        mensaje="La venta será descontada inmediatamente de los ingresos y del balance de la caja."
        detalle={saleToCancel ? `${saleToCancel.customerName || 'Cliente'} — ${formatearMoneda(saleToCancel.total)} (${formatearHoraLocal(saleToCancel.createdAt)} hrs)` : ''}
        textoBotonConfirmar="Sí, Anular Orden"
        colorBoton="chile"
        onConfirm={handleConfirmCancelSale}
        onCancel={() => setSaleToCancel(null)}
      />
    </div>
  );
};
