import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LogoMarca } from './LogoMarca';

interface PropiedadesModalPersonalizarLogo {
  isOpen: boolean;
  onClose: () => void;
  logoActual?: string | null;
  nombreNegocio: string;
  onGuardarLogo: (logoBase64: string | null) => Promise<boolean>;
}

export const ModalPersonalizarLogo: React.FC<PropiedadesModalPersonalizarLogo> = ({
  isOpen,
  onClose,
  logoActual,
  nombreNegocio,
  onGuardarLogo,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(logoActual || null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPreviewUrl(logoActual || null);
    setError(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, logoActual, onClose]);

  if (!isOpen) return null;

  const procesarArchivoImagen = (file: File) => {
    setError(null);

    // 1. Validar Tipo MIME (solo imágenes seguras rasterizadas)
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      setError('Formato no válido. Solo se permiten imágenes PNG, JPG o WebP.');
      return;
    }

    // 2. Validar tamaño inicial (máximo 5MB para procesar)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo original es demasiado pesado (máximo 5 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar y recortar a un cuadrado perfecto de 256x256 en Canvas
        // Esto elimina cualquier metadato sensible o scripts maliciosos del archivo original
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setError('Error al procesar la imagen.');
          return;
        }

        // Centrado y recorte proporcional (object-fit: cover)
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 256, 256);

        // Convertir a WebP ligero de alta calidad (generalmente < 30KB)
        const optimizedBase64 = canvas.toDataURL('image/webp', 0.88);
        setPreviewUrl(optimizedBase64);
      };

      img.onerror = () => {
        setError('No se pudo cargar la imagen seleccionada.');
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setError('Error al leer el archivo.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      procesarArchivoImagen(file);
    }
  };

  const handleGuardar = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const ok = await onGuardarLogo(previewUrl);
      if (ok) {
        onClose();
      } else {
        setError('No se pudo guardar el logo en el servidor.');
      }
    } catch {
      setError('Error de conexión al guardar el logo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestablecer = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const ok = await onGuardarLogo(null);
      if (ok) {
        setPreviewUrl(null);
        onClose();
      } else {
        setError('No se pudo restablecer el logo.');
      }
    } catch {
      setError('Error de conexión al restablecer el logo.');
    } finally {
      setIsSaving(false);
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
      <div className="modal-content animate-fade" style={{ maxWidth: 420, width: '100%', padding: '26px', background: '#FFFFFF', border: '1px solid #E8DFC2', borderRadius: 6, boxShadow: '0 20px 50px rgba(21, 36, 32, 0.3)', textAlign: 'center' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E8DFC2', paddingBottom: 10 }}>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '1.25rem', fontWeight: 800, color: '#152420', margin: 0 }}>
              Personalizar Logo
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#5C6E67' }}>
              {nombreNegocio}
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
          <div style={{ background: '#FAF7EE', border: '1px solid #D14829', color: '#D14829', padding: '8px 12px', borderRadius: 4, fontSize: '0.8rem', marginBottom: 14, fontWeight: 600, textAlign: 'left' }}>
            {error}
          </div>
        )}

        {/* Vista Previa del Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '14px 0' }}>
          <LogoMarca tamano="xl" logoUrl={previewUrl} nombre={nombreNegocio} />
          
          <div style={{ fontSize: '0.78rem', color: '#5C6E67' }}>
            {previewUrl ? 'Vista previa del logo personalizado' : 'Isotipo predeterminado de la plataforma'}
          </div>
        </div>

        {/* Selector de Archivo Oculto */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          style={{ display: 'none' }}
        />

        {/* Botones de Selección */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-outline"
            style={{ padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600 }}
          >
            Seleccionar imagen
          </button>

          {previewUrl && (
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              style={{ background: 'none', border: 'none', color: '#D14829', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Quitar logo
            </button>
          )}
        </div>

        <p style={{ fontSize: '0.74rem', color: '#8E9F99', margin: '0 0 16px', lineHeight: 1.3 }}>
          Formatos admitidos: PNG, JPG o WebP. Se optimiza y recorta en formato circular automáticamente.
        </p>

        {/* Botones de Acción */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #E8DFC2', paddingTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            Cancelar (Esc)
          </button>

          {logoActual && !previewUrl ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleRestablecer}
              className="btn-limon"
              style={{ padding: '8px 18px', fontSize: '0.86rem', fontWeight: 700 }}
            >
              {isSaving ? 'Guardando...' : 'Restablecer'}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving || previewUrl === logoActual}
              onClick={handleGuardar}
              className="btn-limon"
              style={{ padding: '8px 20px', fontSize: '0.86rem', fontWeight: 700 }}
            >
              {isSaving ? 'Guardando...' : 'Guardar Logo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
