import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Product } from '../types/tipos';

interface PropiedadesModalProducto {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => Promise<any>;
  productToEdit?: Product | null;
  initialProduct?: Product | null;
}

export const ModalProducto: React.FC<PropiedadesModalProducto> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  initialProduct,
}) => {
  const targetProduct = productToEdit || initialProduct || null;

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Aguachiles');
  const [salePrice, setSalePrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (targetProduct) {
      setName(targetProduct.name || '');
      setDescription(targetProduct.description || '');
      setCategory(targetProduct.category || 'Aguachiles');
      setSalePrice(targetProduct.salePrice ? String(targetProduct.salePrice) : '');
      setCostPrice(targetProduct.costPrice ? String(targetProduct.costPrice) : '');
    } else {
      setName('');
      setDescription('');
      setCategory('Aguachiles');
      setSalePrice('');
      setCostPrice('');
    }
    setError(null);
  }, [targetProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del platillo es obligatorio.');
      return;
    }

    const precioVentaNum = parseFloat(salePrice.replace(/[^0-9.]/g, ''));
    if (isNaN(precioVentaNum) || precioVentaNum <= 0) {
      setError('Ingresa un precio de venta válido.');
      return;
    }

    const costoNum = costPrice ? parseFloat(costPrice.replace(/[^0-9.]/g, '')) : 0;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        salePrice: precioVentaNum,
        costPrice: isNaN(costoNum) ? 0 : costoNum,
        isActive: true,
      });
      onClose();
    } catch (err: any) {
      setError('Ocurrió un error al guardar el platillo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalNode = (
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
      <div className="modal-content animate-fade" style={{ maxWidth: 440, width: '100%', padding: '26px', background: '#FFFFFF', border: '1px solid #E8DFC2', borderRadius: 6, boxShadow: '0 20px 50px rgba(21, 36, 32, 0.3)' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E8DFC2', paddingBottom: 10 }}>
          <div>
            <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.3rem', fontWeight: 800, color: '#152420', margin: 0 }}>
              {targetProduct ? 'Editar Platillo' : 'Nuevo Platillo'}
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#5C6E67' }}>
              {targetProduct ? 'Actualiza los datos del menú' : 'Registra un platillo o bebida'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#5C6E67',
              cursor: 'pointer',
              padding: 4,
            }}
            title="Cerrar (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {error && (
          <div style={{ background: '#FAF7EE', border: '1px solid #D14829', color: '#D14829', padding: '8px 12px', borderRadius: 4, fontSize: '0.8rem', marginBottom: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#152420', display: 'block', marginBottom: 4 }}>
              Nombre del Platillo *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Aguachile Negro Especial"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: '0.86rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#152420', display: 'block', marginBottom: 4 }}>
                Categoría *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Aguachiles"
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.86rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#152420', display: 'block', marginBottom: 4 }}>
                Precio de Venta ($) *
              </label>
              <input
                type="text"
                required
                placeholder="0.00"
                className="form-input"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.86rem', fontWeight: 700 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#152420', display: 'block', marginBottom: 4 }}>
              Costo de Insumos ($) (Opcional)
            </label>
            <input
              type="text"
              placeholder="0.00"
              className="form-input"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: '0.86rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#152420', display: 'block', marginBottom: 4 }}>
              Descripción / Ingredientes (Opcional)
            </label>
            <textarea
              placeholder="Ej. Camarón fresco con salsa negra de la casa, pepino y cebolla morada..."
              className="form-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: '0.84rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid #E8DFC2', paddingTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              Cancelar (Esc)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-limon"
              style={{ padding: '8px 20px', fontSize: '0.86rem', fontWeight: 700 }}
            >
              {isSubmitting ? 'Guardando...' : targetProduct ? 'Guardar Cambios' : 'Crear Platillo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
