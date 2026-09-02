import React, { useState } from 'react';
import type { Product } from '../types/tipos';
import { formatearMoneda, obtenerId } from '../utils/formato';
import { ModalProducto } from './ModalProducto';
import { ModalConfirmacion } from './ModalConfirmacion';

interface PropiedadesGestionProductos {
  products: Product[];
  onCreateProduct: (prod: Partial<Product>) => Promise<Product>;
  onUpdateProduct: (id: string, prod: Partial<Product>) => Promise<Product | null>;
  onDeleteProduct: (id: string) => Promise<boolean>;
}

export const GestionProductos: React.FC<PropiedadesGestionProductos> = ({
  products,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (data: Partial<Product>) => {
    if (editingProduct) {
      await onUpdateProduct(obtenerId(editingProduct), data);
    } else {
      await onCreateProduct(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await onDeleteProduct(obtenerId(productToDelete));
    setProductToDelete(null);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Encabezado Limpio */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '2rem', fontWeight: 700, color: '#152420', margin: 0 }}>
          Menú
        </h1>

        <button onClick={handleOpenCreate} className="btn-limon" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
          + Agregar Platillo
        </button>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: '#FFFFFF', padding: '12px 16px', borderRadius: 6, border: '1px solid #E8DFC2' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'btn-limon' : 'btn-outline'}
              style={{ padding: '5px 12px', fontSize: '0.82rem' }}
            >
              {cat === 'all' ? 'Todos los platillos' : cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar platillo..."
          className="form-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 220, padding: '6px 12px', fontSize: '0.84rem' }}
        />
      </div>

      {/* Grid de Platillos del Menú */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filteredProducts.map((prod) => {
          const pId = obtenerId(prod);

          return (
            <div
              key={pId}
              className="boleta-card"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.15rem', fontWeight: 700, color: '#152420', margin: 0 }}>
                    {prod.name}
                  </h3>
                  <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.25rem', fontWeight: 800, color: '#8FAE3D', whiteSpace: 'nowrap' }}>
                    {formatearMoneda(prod.salePrice)}
                  </span>
                </div>

                <span style={{ fontSize: '0.72rem', background: '#FAF7EE', border: '1px solid #E8DFC2', color: '#5C6E67', padding: '2px 8px', borderRadius: 3, fontWeight: 600, display: 'inline-block', marginBottom: 8 }}>
                  {prod.category}
                </span>

                {prod.description && (
                  <p style={{ fontSize: '0.82rem', color: '#5C6E67', margin: 0, lineHeight: 1.4 }}>
                    {prod.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #E8DFC2' }}>
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="btn-outline"
                  style={{ flex: 1, padding: '6px', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => setProductToDelete(prod)}
                  style={{
                    background: 'rgba(209, 72, 41, 0.08)',
                    border: '1px solid rgba(209, 72, 41, 0.25)',
                    color: '#D14829',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#FFFFFF', border: '1px dashed #E8DFC2', borderRadius: 6, color: '#8E9F99' }}>
          No se encontraron platillos con ese criterio. Haz clic en <strong>+ Agregar Platillo</strong> para añadir uno nuevo.
        </div>
      )}

      {/* Modal Crear / Editar Platillo */}
      <ModalProducto
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveProduct}
        initialProduct={editingProduct}
      />

      {/* Modal Confirmar Eliminación */}
      <ModalConfirmacion
        isOpen={Boolean(productToDelete)}
        titulo="¿Eliminar platillo del menú?"
        mensaje="El platillo dejará de aparecer en la pantalla de cobro del Punto de Venta."
        detalle={productToDelete ? `${productToDelete.name} — ${formatearMoneda(productToDelete.salePrice)}` : ''}
        textoBotonConfirmar="Sí, Eliminar"
        colorBoton="chile"
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
