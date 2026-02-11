import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

const ImageUpload = ({ label, value, onChange, placeholder = 'https://...' }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG, GIF, WebP ou SVG.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('checkout-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('checkout-assets')
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast.success('Imagem enviada!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao enviar: ' + (err.message || 'Tente novamente'));
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div>
      <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1.5 block">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative mb-2 rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600">
          <img
            src={value}
            alt="Preview"
            className="w-full h-20 object-contain p-2"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-neutral-800/90 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Remover"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* URL input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 transition-all mb-1.5"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 text-xs font-medium hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400 transition-all disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            Fazer upload de imagem
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
