import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ExternalLink, Webhook, Copy, Check, Plug, X } from 'lucide-react';
import { toast } from 'sonner';

const WEBHOOK_PATH = '/api/webhook/portopag';
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const webhookUrl = apiBase ? `${apiBase}${WEBHOOK_PATH}` : 'https://api.nextcheckoutbr.com/api/webhook/portopag';

const IntegracoesPage = () => {
  const [portopagKey, setPortopagKey] = useState('');
  const [portopagConfigured, setPortopagConfigured] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { session } = useAuth();

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setWebhookCopied(false), 2000);
  };

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
                  <h3 className="font-medium text-neutral-900 dark:text-white">Webhook (pagamentos em tempo real)</h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  Para receber confirmações de pagamento sem polling, configure o webhook na PortoPag:
                </p>
                <ol className="text-sm text-neutral-600 dark:text-neutral-400 list-decimal list-inside space-y-1 mb-3">
                  <li>Acesse <a href="https://app.portopag.com" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">app.portopag.com</a></li>
                  <li>Vá em <strong>Configurações → Webhooks</strong></li>
                  <li>Adicione a URL abaixo e selecione os eventos: <em>payment.paid</em>, <em>payment.expired</em>, <em>payment.failed</em></li>
                  <li>Salve as configurações</li>
                </ol>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 rounded-lg text-xs font-mono text-neutral-800 dark:text-neutral-200 break-all">
                    {webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyWebhookUrl}
                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition-colors"
                    title="Copiar URL"
                  >
                    {webhookCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IntegracoesPage;
