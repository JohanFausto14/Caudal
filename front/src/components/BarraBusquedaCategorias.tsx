import React from 'react';

interface PropiedadesBarraBusquedaCategorias {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  placeholder?: string;
}

export const BarraBusquedaCategorias: React.FC<PropiedadesBarraBusquedaCategorias> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  placeholder = 'Buscar...',
}) => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8DFC2',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        borderRadius: 2,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ maxWidth: 300 }}
        />

        <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', width: '100%', maxWidth: '100%', paddingBottom: 2 }}>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                style={{
                  background: active ? '#2C6E63' : 'transparent',
                  color: active ? '#FFFFFF' : '#5C6E67',
                  border: '1px solid ' + (active ? '#2C6E63' : '#E8DFC2'),
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.12s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
