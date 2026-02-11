import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plug, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const IntegracoesPage = () => {
  const [portopagKey, setPortopagKey] = useState('');
  const [portopagConfigured, setPortopagConfigured] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.access_token) {
      fetch('/api/portopag-status', { headers: { Authorization: `Bearer ${session.access_token}` } })
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
      const res = await fetch('/api/save-portopag-key', {
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Integrações</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Conecte suas chaves de API da PortoPag</p>
      </div>
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Plug className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-white">PortoPag</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Geração de cobranças PIX</p>
          </div>
        </div>
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
      </div>
    </div>
  );
};

export default IntegracoesPage;
