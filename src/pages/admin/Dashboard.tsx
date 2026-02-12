import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Checkout } from '@/types/checkout';
import {
  DEFAULT_THEME,
  createDigitalElements,
  createDigitalProduct,
  createEcommerceElements,
  createEcommerceProduct,
  DIGITAL_SETTINGS,
  ECOMMERCE_SETTINGS,
  type CheckoutTemplate,
} from '@/lib/default-template';
import {
  Plus, Edit3, Copy, Trash2, ExternalLink, LogOut,
  Loader2, MoreVertical, Globe, FileEdit, Search, Sun, Moon, Settings, X, Link2,
  FileDigit, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';

const Dashboard = () => {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [portopagKey, setPortopagKey] = useState('');
  const [portopagConfigured, setPortopagConfigured] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [domainModalCheckout, setDomainModalCheckout] = useState<Checkout | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const { user, session, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    loadCheckouts();
  }, []);

  useEffect(() => {
    if (settingsOpen && session?.access_token) {
      fetch(apiUrl('/api/portopag-status'), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setPortopagConfigured(data?.configured ?? false);
          setPortopagKey(data?.configured ? '••••••••••••••••' : '');
        })
        .catch(() => {
          setPortopagConfigured(false);
          setPortopagKey('');
        });
    }
  }, [settingsOpen, session?.access_token]);

  const loadCheckouts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checkouts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar checkouts');
      console.error(error);
    } else {
      setCheckouts(data || []);
    }
    setLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Math.random().toString(36).substring(2, 6);
  };

  const createCheckout = async (template: CheckoutTemplate) => {
    setCreating(true);
    setTemplateModalOpen(false);

    const settings = template === 'digital' ? DIGITAL_SETTINGS : ECOMMERCE_SETTINGS;
    const createElements = template === 'digital' ? createDigitalElements : createEcommerceElements;
    const createProduct = template === 'digital' ? createDigitalProduct : createEcommerceProduct;
    const name = template === 'digital' ? 'Checkout Produto Digital' : 'Checkout Ecommerce';
    const slug = generateSlug(name);

    try {
      const { data: checkout, error: checkoutError } = await supabase
        .from('checkouts')
        .insert({
          user_id: user!.id,
          name,
          slug,
          status: 'draft',
          theme: DEFAULT_THEME,
          settings,
        })
        .select()
        .single();

      if (checkoutError) throw checkoutError;

      const elements = createElements(checkout.id).map((el) => ({
        ...el,
        checkout_id: checkout.id,
      }));

      const { error: elemError } = await supabase
        .from('checkout_elements')
        .insert(elements);

      if (elemError) throw elemError;

      const product = createProduct(checkout.id);
      const { error: prodError } = await supabase
        .from('checkout_products')
        .insert({ ...product, checkout_id: checkout.id });

      if (prodError) throw prodError;

      toast.success('Checkout criado com sucesso!');
      navigate(`/admin/builder/${checkout.id}`);
    } catch (err: any) {
      toast.error('Erro ao criar checkout: ' + (err.message || ''));
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const duplicateCheckout = async (checkout: Checkout) => {
    setCreating(true);
    try {
      const newSlug = generateSlug(checkout.name + ' Cópia');

      const { data: newCheckout, error: checkoutError } = await supabase
        .from('checkouts')
        .insert({
          user_id: user!.id,
          name: checkout.name + ' (Cópia)',
          slug: newSlug,
          status: 'draft',
          theme: checkout.theme,
          settings: checkout.settings,
        })
        .select()
        .single();

      if (checkoutError) throw checkoutError;

      const { data: elements } = await supabase
        .from('checkout_elements')
        .select('*')
        .eq('checkout_id', checkout.id);

      if (elements && elements.length > 0) {
        const newElements = elements.map(({ id, checkout_id, created_at, updated_at, ...rest }) => ({
          ...rest,
          checkout_id: newCheckout.id,
        }));
        await supabase.from('checkout_elements').insert(newElements);
      }

      const { data: products } = await supabase
        .from('checkout_products')
        .select('*')
        .eq('checkout_id', checkout.id);

      if (products && products.length > 0) {
        const newProducts = products.map(({ id, checkout_id, created_at, updated_at, ...rest }) => ({
          ...rest,
          checkout_id: newCheckout.id,
        }));
        await supabase.from('checkout_products').insert(newProducts);
      }

      toast.success('Checkout duplicado!');
      loadCheckouts();
    } catch (err: any) {
      toast.error('Erro ao duplicar: ' + (err.message || ''));
    } finally {
      setCreating(false);
      setMenuOpen(null);
    }
  };

  const deleteCheckout = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este checkout?')) return;

    try {
      const { error } = await supabase.from('checkouts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Checkout excluído');
      setCheckouts((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + (err.message || ''));
    }
    setMenuOpen(null);
  };

  const openDomainModal = (c: Checkout) => {
    setDomainModalCheckout(c);
    setDomainInput(c.custom_domain || '');
    setMenuOpen(null);
  };

  const saveDomain = async () => {
    if (!domainModalCheckout) return;
    setSavingDomain(true);
    try {
      const raw = domainInput.trim() || null;
      const value = raw ? raw.toLowerCase().replace(/^https?:\/\//, '') : null;
      const { error } = await supabase
        .from('checkouts')
        .update({ custom_domain: value, domain_verified_at: null, updated_at: new Date().toISOString() })
        .eq('id', domainModalCheckout.id);

      if (error) throw error;
      setCheckouts((prev) =>
        prev.map((c) => (c.id === domainModalCheckout.id ? { ...c, custom_domain: value } : c))
      );
      if (value && session?.access_token) {
        try {
          const res = await fetch(apiUrl('/api/add-vercel-domain'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ domain: value, checkoutId: domainModalCheckout.id }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success('Domínio salvo e adicionado na Vercel. Configure o CNAME no DNS.');
          } else {
            toast.error(data?.error || 'Erro ao adicionar na Vercel. Configure VERCEL_API_TOKEN no Railway.');
          }
        } catch {
          toast.error('Erro ao adicionar domínio na Vercel. Verifique a conexão com o backend.');
        }
      } else {
        toast.success(value ? 'Domínio salvo. Configure o CNAME no DNS.' : 'Domínio removido.');
      }
      setDomainModalCheckout(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar domínio');
    } finally {
      setSavingDomain(false);
    }
  };

  const savePortopagKey = async () => {
    const value = portopagKey === '••••••••••••••••' ? '' : portopagKey.trim();
    if (!value && portopagConfigured) {
      setSettingsOpen(false);
      return;
    }
    setSavingKey(true);
    try {
      const res = await fetch(apiUrl('/api/save-portopag-key'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ apiKey: value || null }),
      });
      const text = await res.text();
      let data: { error?: string; success?: boolean } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        if (!res.ok) throw new Error(text || 'Resposta inválida do servidor');
      }
      if (!res.ok) throw new Error(data?.error || text || 'Erro ao salvar');
      toast.success('API Key salva com sucesso!');
      setPortopagConfigured(!!value);
      setSettingsOpen(false);
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || ''));
    } finally {
      setSavingKey(false);
    }
  };

  const toggleStatus = async (checkout: Checkout) => {
    const newStatus = checkout.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('checkouts')
        .update({ status: newStatus })
        .eq('id', checkout.id);
      if (error) throw error;
      setCheckouts((prev) =>
        prev.map((c) => (c.id === checkout.id ? { ...c, status: newStatus } : c))
      );
      toast.success(newStatus === 'published' ? 'Checkout publicado!' : 'Checkout despublicado');
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''));
    }
    setMenuOpen(null);
  };

  const filtered = checkouts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      {/* Top bar */}
      <header className="border-b border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="NextCheckout" className="w-10 h-10 object-contain sm:hidden" />
            <div className="hidden sm:flex items-center">
              <img src="/logo-light.png" alt="NextCheckout" className="h-10 object-contain dark:hidden" />
              <img src="/logo-dark.png" alt="NextCheckout" className="h-10 object-contain hidden dark:block" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 dark:text-neutral-400 text-sm hidden sm:block">{user?.email}</span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
              title="Integrações"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={signOut}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-neutral-900 dark:text-white text-2xl font-bold">Meus Checkouts</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              {checkouts.length} checkout{checkouts.length !== 1 ? 's' : ''} criado{checkouts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setTemplateModalOpen(true)}
            disabled={creating}
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-brand-500/25"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Novo Checkout
          </button>
        </div>

        {/* Search */}
        {checkouts.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar checkouts..."
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2.5 pl-10 pr-4 text-neutral-900 dark:text-white text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && checkouts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileEdit className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
            </div>
            <h3 className="text-neutral-900 dark:text-white text-lg font-semibold mb-2">Nenhum checkout ainda</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
              Crie seu primeiro checkout personalizado
            </p>
            <button
              onClick={() => setTemplateModalOpen(true)}
              disabled={creating}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all inline-flex items-center gap-2 disabled:opacity-60"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar Checkout
            </button>
          </div>
        )}

        {/* Checkout grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((checkout) => (
              <div
                key={checkout.id}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all group relative shadow-sm dark:shadow-none"
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      checkout.status === 'published'
                        ? 'bg-brand-500/15 text-brand-500 dark:text-brand-400'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {checkout.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === checkout.id ? null : checkout.id)}
                      className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === checkout.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-8 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-xl z-50 py-1 min-w-[180px]">
                          <button
                            onClick={() => toggleStatus(checkout)}
                            className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center gap-2"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            {checkout.status === 'published' ? 'Despublicar' : 'Publicar'}
                          </button>
                          <button
                            onClick={() => duplicateCheckout(checkout)}
                            className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Duplicar
                          </button>
                          <button
                            onClick={() => openDomainModal(checkout)}
                            className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center gap-2"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            Domínio personalizado
                          </button>
                          {checkout.status === 'published' && (
                            <button
                              onClick={() => {
                                const url = checkout.custom_domain
                                  ? `https://${checkout.custom_domain.replace(/^https?:\/\//, '')}/c/${checkout.slug}`
                                  : `/c/${checkout.slug}`;
                                window.open(url, '_blank');
                                setMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center gap-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Ver checkout
                            </button>
                          )}
                          <div className="border-t border-neutral-100 dark:border-neutral-600 my-1" />
                          <button
                            onClick={() => deleteCheckout(checkout.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Checkout info */}
                <h3 className="text-neutral-900 dark:text-white font-semibold text-lg mb-1 truncate">{checkout.name}</h3>
                <p className={`text-neutral-400 dark:text-neutral-500 text-xs font-mono truncate ${checkout.custom_domain ? 'mb-1' : 'mb-4'}`}>/c/{checkout.slug}</p>
                {checkout.custom_domain && (
                  <p className="text-brand-500 dark:text-brand-400 text-xs mb-4 font-mono truncate" title="Domínio próprio">
                    {checkout.custom_domain}
                  </p>
                )}

                {/* Date */}
                <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-4">
                  Criado em {new Date(checkout.created_at).toLocaleDateString('pt-BR')}
                </p>

                {/* Edit button */}
                <button
                  onClick={() => navigate(`/admin/builder/${checkout.id}`)}
                  className="w-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-white font-medium py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Integrações */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSettingsOpen(false)} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Integrações</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">API Key PortoPag</label>
              <input
                type="password"
                value={portopagKey}
                onChange={(e) => setPortopagKey(e.target.value)}
                placeholder={portopagConfigured ? '••••••••••••••••' : 'ppay_xxxxxxxx'}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl py-2.5 px-3 text-neutral-900 dark:text-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-brand-500"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Use sua chave da PortoPag para gerar cobranças PIX nos seus checkouts. Obtenha em{' '}
                <a href="https://app.portopag.com/" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">portopag.com</a>.
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                Cancelar
              </button>
              <button
                onClick={savePortopagKey}
                disabled={savingKey}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-60"
              >
                {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal escolha de predefinição */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTemplateModalOpen(false)} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Escolha uma predefinição</h3>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Comece com uma base pronta e customize do jeito que preferir.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => createCheckout('digital')}
                disabled={creating}
                className="p-5 rounded-xl border-2 border-neutral-200 dark:border-neutral-600 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-500/5 dark:hover:bg-brand-500/5 transition-all text-left group disabled:opacity-60"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center mb-3 group-hover:bg-brand-500/20 dark:group-hover:bg-brand-500/30">
                  <FileDigit className="w-6 h-6 text-brand-500" />
                </div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">Produto Digital</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  2 passos: Dados + Pagamento. Ideal para e-books, cursos e conteúdos digitais.
                </p>
              </button>
              <button
                onClick={() => createCheckout('ecommerce')}
                disabled={creating}
                className="p-5 rounded-xl border-2 border-neutral-200 dark:border-neutral-600 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-500/5 dark:hover:bg-brand-500/5 transition-all text-left group disabled:opacity-60"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center mb-3 group-hover:bg-brand-500/20 dark:group-hover:bg-brand-500/30">
                  <Package className="w-6 h-6 text-brand-500" />
                </div>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">Ecommerce</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  3 passos: Dados + Endereço + Pagamento. Ideal para produtos físicos com frete.
                </p>
              </button>
            </div>
            {creating && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Criando checkout...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Domínio personalizado */}
      {domainModalCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDomainModalCheckout(null)} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Domínio personalizado</h3>
              <button
                onClick={() => setDomainModalCheckout(null)}
                className="p-1 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              {domainModalCheckout.name}
            </p>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Domínio (ex: pagamento.minhaloja.com.br)
            </label>
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="pagamento.minhaloja.com.br"
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl py-2.5 px-3 text-neutral-900 dark:text-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-brand-500"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Configure um registro CNAME no seu DNS apontando para <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 rounded">{import.meta.env.VITE_APP_CANONICAL_HOST || 'app.nextcheckoutbr.com'}</code>. O link será <span className="font-mono">domínio.com/c/{domainModalCheckout.slug}</span>. Depois verifique em Domínios.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDomainModalCheckout(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                Cancelar
              </button>
              <button
                onClick={saveDomain}
                disabled={savingDomain}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-60 flex items-center gap-2"
              >
                {savingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
