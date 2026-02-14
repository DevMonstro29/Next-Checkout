import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { apiUrl } from '@/lib/api';
import { Checkout } from '@/types/checkout';
import {
  Globe,
  Loader2,
  Plus,
  Check,
  X,
  ExternalLink,
  Edit3,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Alvo CNAME para domínios customizados (Vercel)
const CNAME_TARGET = import.meta.env.VITE_VERCEL_CNAME_TARGET || 'c2565340da7c1d78.vercel-dns-017.com';

const DominiosPage = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainModalCheckout, setDomainModalCheckout] = useState<Checkout | null>(null);
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) loadCheckouts();
  }, [user?.id]);

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

  const openDomainModal = (c: Checkout) => {
    setDomainModalCheckout(c);
    setDomainInput(c.custom_domain || '');
  };

  const saveDomain = async () => {
    if (!domainModalCheckout) return;
    setSavingDomain(true);
    try {
      const raw = domainInput.trim() || null;
      const value = raw ? raw.toLowerCase().replace(/^https?:\/\//, '') : null;
      const { error } = await supabase
        .from('checkouts')
        .update({
          custom_domain: value,
          domain_verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', domainModalCheckout.id);

      if (error) throw error;
      setCheckouts((prev) =>
        prev.map((c) =>
          c.id === domainModalCheckout.id
            ? { ...c, custom_domain: value, domain_verified_at: null }
            : c
        )
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
            toast.success(`Domínio salvo e adicionado na Vercel. Configure o CNAME no DNS e clique em Verificar.`);
          } else {
            toast.error(data?.error || 'Erro ao adicionar na Vercel. Configure VERCEL_API_TOKEN no Railway.');
          }
        } catch {
          toast.error('Erro ao adicionar domínio na Vercel. Verifique a conexão com o backend.');
        }
      } else if (value) {
        toast.success(`Domínio salvo. Configure o CNAME no DNS apontando para ${CNAME_TARGET} e clique em Verificar.`);
      } else {
        toast.success('Domínio removido.');
      }
      setDomainModalCheckout(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar domínio');
    } finally {
      setSavingDomain(false);
    }
  };

  const verifyDomain = async (checkout: Checkout) => {
    if (!session?.access_token || !checkout.custom_domain) return;
    setVerifyingId(checkout.id);
    try {
      const res = await fetch(apiUrl('/api/verify-domain'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ checkoutId: checkout.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao verificar');

      if (data.verified) {
        toast.success('Domínio verificado com sucesso!');
        setCheckouts((prev) =>
          prev.map((c) =>
            c.id === checkout.id
              ? { ...c, domain_verified_at: new Date().toISOString() }
              : c
          )
        );
      } else {
        toast.error(data.error || 'Domínio não verificado. Verifique o CNAME no DNS.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar domínio');
    } finally {
      setVerifyingId(null);
    }
  };

  const withDomain = checkouts.filter((c) => c.custom_domain);
  const withoutDomain = checkouts.filter((c) => !c.custom_domain);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Domínios</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Conecte seus domínios personalizados aos checkouts. Configure o CNAME no DNS apontando para{' '}
          <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-sm font-mono">
            {CNAME_TARGET}
          </code>
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      )}

      {!loading && checkouts.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Nenhum checkout</h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
            Crie um checkout primeiro para poder conectar um domínio personalizado.
          </p>
          <button
            onClick={() => navigate('/admin/checkouts')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium"
          >
            Ir para Checkouts
          </button>
        </div>
      )}

      {!loading && checkouts.length > 0 && (
        <div className="space-y-8">
          {/* Checkouts com domínio configurado */}
          {withDomain.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Domínios conectados ({withDomain.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {withDomain.map((checkout) => (
                  <div
                    key={checkout.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-neutral-900 dark:text-white truncate flex-1">
                        {checkout.name}
                      </h3>
                      {checkout.domain_verified_at ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium shrink-0">
                          <AlertCircle className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono truncate mb-4" title={checkout.custom_domain || ''}>
                      {checkout.custom_domain}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => verifyDomain(checkout)}
                        disabled={!!verifyingId}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-brand-500/15 text-brand-600 dark:text-brand-400 hover:bg-brand-500/25 disabled:opacity-50"
                      >
                        {verifyingId === checkout.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        Verificar
                      </button>
                      <button
                        onClick={() => openDomainModal(checkout)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <Edit3 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => navigate(`/admin/builder/${checkout.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Editar checkout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkouts sem domínio */}
          {withoutDomain.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Adicionar domínio ({withoutDomain.length} checkout{withoutDomain.length !== 1 ? 's' : ''} disponíve{withoutDomain.length !== 1 ? 'is' : 'l'})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {withoutDomain.map((checkout) => (
                  <div
                    key={checkout.id}
                    className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/50 p-5 hover:border-brand-500/50 transition-all"
                  >
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 truncate">
                      {checkout.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mb-4">
                      /c/{checkout.slug}
                    </p>
                    <button
                      onClick={() => openDomainModal(checkout)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white"
                    >
                      <Plus className="w-4 h-4" />
                      Conectar domínio
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{domainModalCheckout.name}</p>
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
            <div className="mt-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <p className="font-medium text-neutral-700 dark:text-neutral-300">Como configurar:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Adicione um registro CNAME no seu DNS</li>
                <li>Nome: seu subdomínio (ex: pagamento)</li>
                <li>Valor: <code className="font-mono">{CNAME_TARGET}</code></li>
                <li>O link de cada checkout será: <code className="font-mono">domínio.com/c/slug</code></li>
                <li>Salve e clique em &quot;Verificar&quot; para ativar</li>
              </ol>
            </div>
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
                {savingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DominiosPage;
