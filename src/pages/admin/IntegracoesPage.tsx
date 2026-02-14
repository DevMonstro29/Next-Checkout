import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ExternalLink, Webhook, Check, Plug, X } from 'lucide-react';
import { toast } from 'sonner';

const IntegracoesPage = () => {
  const [portopagKey, setPortopagKey] = useState('');
  const [portopagConfigured, setPortopagConfigured] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.access_token) {
      fetch(apiUrl('/api/portopag-status'), { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then((r) => r.json())
        .then((data) => {
          setPortopagConfigured(data?.configured ?? false);
          setPortopagKey(data?.configured ? '••••••••••••••••' : '');
        })
        .catch(() => { setPortopagConfigured(false); setPortopagKey(''); });
    }
  }, [session?.access_token]);

  const savePortopagKey = async () => {
    const value = portopagKey === '••••••••••••••••' ? '' : portopagKey.trim();
    setSavingKey(true);
    try {
      const res = await fetch(apiUrl('/api/save-portopag-key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ apiKey: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar');
      setPortopagConfigured(!!value);
      setPortopagKey(value ? '••••••••••••••••' : '');
      toast.success('Chave salva com sucesso!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSavingKey(false);
    }
  };

  const handleDisconnect = async () => {
    setSavingKey(true);
    try {
      const res = await fetch(apiUrl('/api/save-portopag-key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ apiKey: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao desconectar');
      setPortopagConfigured(false);
      setPortopagKey('');
      setExpanded(false);
      toast.success('Integração desconectada.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desconectar');
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Integrações</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Conecte sua conta com plataformas externas para automatizar processos
        </p>
      </div>

      <div className="bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm relative">
        {portopagConfigured && !expanded && (
          <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white">
            <Check className="w-3.5 h-3.5" />
            Conectado
          </span>
        )}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 flex items-center justify-center shrink-0 overflow-hidden rounded-xl bg-neutral-400/80 dark:bg-neutral-700/50 p-2.5">
            <img
              src="/logo-portopag-card.png"
              alt="PortoPag"
              className="w-full h-full object-contain dark:[mix-blend-mode:screen]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-neutral-900 dark:text-white text-lg">PortoPag</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Geração de cobranças PIX nos seus checkouts
            </p>
          </div>
        </div>

        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="w-full mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Plug className="w-4 h-4" />
            Conectar
          </button>
        ) : (
          <>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {portopagConfigured && (
                <button
                  onClick={handleDisconnect}
                  disabled={savingKey}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 flex items-center gap-2 disabled:opacity-60"
                >
                  {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Desconectar
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-600 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">API Key</label>
              <input
                type="password"
                value={portopagKey}
                onChange={(e) => setPortopagKey(e.target.value)}
                placeholder={portopagConfigured ? '••••••••••••••••' : 'ppay_xxxxxxxx'}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl py-2.5 px-3 text-neutral-900 dark:text-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-brand-500"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                Obtenha sua chave em{' '}
                <a href="https://app.portopag.com/" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline inline-flex items-center gap-1">
                  portopag.com <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
              <button
                onClick={savePortopagKey}
                disabled={savingKey}
                className="mt-4 px-4 py-2.5 rounded-xl text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-60 flex items-center gap-2"
              >
                {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </button>

              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-600">
                <div className="flex items-center gap-2 mb-2">
                  <Webhook className="w-4 h-4 text-brand-500" />
                  <h3 className="font-medium text-neutral-900 dark:text-white">Postback (automático)</h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  O NextCheckout envia automaticamente o <strong>postbackUrl</strong> ao criar cada PIX. A PortoPag envia os eventos
                  (<em>payment.paid</em>, <em>payment.expired</em>, <em>payment.failed</em>) direto para nossa API — <strong>não é necessário configurar webhook no painel da PortoPag</strong>.
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                  Configure <code className="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">API_BASE_URL</code> ou <code className="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">POSTBACK_BASE_URL</code> no backend (ex: https://api.nextcheckoutbr.com). No Railway, <code className="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">RAILWAY_PUBLIC_DOMAIN</code> é usado como fallback.
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Se vendas ficarem como &quot;Pendente&quot; após o pagamento, use o botão de sincronizar na página de Vendas ou configure o webhook no painel da PortoPag como backup.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IntegracoesPage;
