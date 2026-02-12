import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Camera, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const PerfilPage = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meta = (user?.user_metadata || {}) as Record<string, string>;
  const currentName = meta.full_name ?? meta.name ?? '';
  const currentAvatar = meta.avatar_url ?? '';

  useEffect(() => {
    setDisplayName(currentName);
    setAvatarUrl(currentAvatar);
  }, [currentName, currentAvatar]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSize) {
      toast.error('Imagem muito grande. Máximo 3MB.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Use JPG, PNG, GIF ou WebP.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const path = `uploads/avatars/${user.id}/${uuidv4()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('checkout-assets')
          .upload(path, avatarFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('checkout-assets').getPublicUrl(path);
        finalAvatarUrl = data.publicUrl;
      }
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim() || undefined,
          avatar_url: finalAvatarUrl || undefined,
        },
      });
      if (error) throw error;
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Alterações salvas!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const showAvatar = avatarPreview || avatarUrl;
  const hasChanges =
    displayName !== currentName || avatarFile !== null || (avatarUrl !== currentAvatar && !avatarFile);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Perfil</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Gerencie suas informações pessoais</p>
      </div>

      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-600">
              {showAvatar ? (
                <img
                  src={showAvatar}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <User className="w-12 h-12 text-neutral-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors shadow"
              title="Enviar foto"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="flex-1 w-full space-y-4">
            {user?.email && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  E-mail
                </label>
                <p className="text-sm text-neutral-900 dark:text-white py-2 px-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-600">
                  {user.email}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Nome ou apelido
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl py-2.5 px-3 text-neutral-900 dark:text-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-brand-500"
              />
            </div>
            {(avatarFile || avatarUrl) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
              >
                Remover foto
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;
