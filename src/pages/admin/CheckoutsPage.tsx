import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Checkout } from '@/types/checkout';
import {
  DEFAULT_THEME,
  DIGITAL_SETTINGS,
  ECOMMERCE_SETTINGS,
  createDigitalElements,
  createDigitalProduct,
  createEcommerceElements,
  createEcommerceProduct,
  type CheckoutTemplate,
} from '@/lib/default-template';
import {
  Plus, Edit3, Copy, Trash2, ExternalLink, Loader2, MoreVertical, Globe, FileEdit, Search, X, Link2,
  FileDigit, Package,
} from 'lucide-react';
import { toast } from 'sonner';

const CheckoutsPage = () => {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [domainModalCheckout, setDomainModalCheckout] = useState<Checkout | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCheckouts();
  }, []);

  const loadCheckouts = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('checkouts')
      .select('*')
      .eq('user_id', user.id)
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
    if (!user?.id) return;
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
          user_id: user.id,
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
    if (!user?.id) return;
    setCreating(true);
    try {
      const newSlug = generateSlug(checkout.name + ' Cópia');

      const { data: newCheckout, error: checkoutError } = await supabase
        .from('checkouts')
        .insert({
          user_id: user.id,
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
      const value = domainInput.trim() || null;
      const { error } = await supabase
        .from('checkouts')
        .update({ custom_domain: value, domain_verified_at: null, updated_at: new Date().toISOString() })
        .eq('id', domainModalCheckout.id);

      if (error) throw error;
      setCheckouts((prev) =>
        prev.map((c) => (c.id === domainModalCheckout.id ? { ...c, custom_domain: value } : c))
      );
      toast.success(value ? 'Domínio salvo. Configure o DNS (CNAME) para este domínio apontar para esta aplicação.' : 'Domínio removido.');
      setDomainModalCheckout(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar domínio');
    } finally {
      setSavingDomain(false);
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
    <div className="p-6 max-w-6xl mx-auto">
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
                              window.open(`/c/${checkout.slug}`, '_blank');
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

              <h3 className="text-neutral-900 dark:text-white font-semibold text-lg mb-1 truncate">{checkout.name}</h3>
              <p className={`text-neutral-400 dark:text-neutral-500 text-xs font-mono truncate ${checkout.custom_domain ? 'mb-1' : 'mb-4'}`}>/c/{checkout.slug}</p>
              {checkout.custom_domain && (
                <p className="text-brand-500 dark:text-brand-400 text-xs mb-4 font-mono truncate" title="Domínio próprio">
                  {checkout.custom_domain}
                </p>
              )}

              <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-4">
                Criado em {new Date(checkout.created_at).toLocaleDateString('pt-BR')}
              </p>

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
              Configure um registro CNAME no seu DNS apontando para <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 rounded">{import.meta.env.VITE_APP_CANONICAL_HOST || 'app.nextcheckoutbr.com'}</code>. Depois, verifique em Domínios. Deixe em branco para usar apenas /c/{domainModalCheckout.slug}.
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

export default CheckoutsPage;
