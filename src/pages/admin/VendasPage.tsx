import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api';
import { ShoppingCart, Filter, Search, Calendar, ArrowUpDown, LayoutGrid, List, Loader2 } from 'lucide-react';

interface Sale {
  id: string;
  checkout_id: string;
  transaction_id: string;
  customer_name: string | null;
  customer_email: string | null;
  amount_cents: number;
  product_name: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  checkout_name?: string;
  checkout_slug?: string;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const formatDate = (iso: string) => new Date(iso).toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

const statusClass: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  expired: 'bg-neutral-500/15 text-neutral-500',
  cancelled: 'bg-red-500/15 text-red-500',
};

const VendasPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    fetch(apiUrl('/api/sales'), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSales(data.sales || []);
      })
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  const filtered = sales.filter(
    (s) =>
      (s.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.customer_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.transaction_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.checkout_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.utm_source || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.utm_campaign || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.utm_medium || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Vendas</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Todas as vendas pagas e geradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar vendas..."
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
            />
          </div>
          <button
            type="button"
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Filtros"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Período"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
              title="Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
              title="Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-900/50 overflow-auto min-h-[420px] flex flex-col">
        {loading && (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="border-b border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider min-w-[640px]">
              <span className="col-span-3 flex items-center gap-1">
                Cliente / Pedido
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              </span>
              <span className="col-span-2">Data</span>
              <span className="col-span-2">Checkout</span>
              <span className="col-span-2">Campanha</span>
              <span className="col-span-2 text-right">Valor</span>
              <span className="col-span-1 text-right">Status</span>
            </div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {filtered.map((sale) => (
                <div
                  key={sale.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors min-w-[640px]"
                >
                  <div className="col-span-3 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white truncate">
                      {sale.customer_name || '—'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {sale.customer_email || sale.transaction_id || '—'}
                    </p>
                  </div>
                  <div className="col-span-2 text-neutral-600 dark:text-neutral-400">
                    {formatDate(sale.created_at)}
                  </div>
                  <div className="col-span-2 text-neutral-600 dark:text-neutral-400 truncate" title={sale.checkout_name || ''}>
                    {sale.checkout_name || '—'}
                  </div>
                  <div className="col-span-2 min-w-0" title={[sale.utm_source, sale.utm_campaign, sale.utm_medium, sale.utm_content, sale.utm_term].filter(Boolean).join(' | ')}>
                    {(sale.utm_source || sale.utm_campaign) ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 truncate max-w-full">
                        {[sale.utm_source, sale.utm_campaign].filter(Boolean).slice(0, 2).join(' · ')}
                      </span>
                    ) : (
                      <span className="text-neutral-400 dark:text-neutral-500">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right font-medium text-neutral-900 dark:text-white">
                    {formatCurrency(sale.amount_cents)}
                  </div>
                  <div className="col-span-1 text-right">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[sale.status] || 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}
                    >
                      {statusLabel[sale.status] || sale.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8 md:p-16">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 dark:from-brand-500/15 dark:to-brand-600/5 flex items-center justify-center border border-brand-500/10">
                <ShoppingCart className="w-12 h-12 text-brand-500" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                {sales.length === 0 ? 'Nenhuma venda ainda' : 'Nenhum resultado na busca'}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                {sales.length === 0
                  ? 'Quando você gerar um PIX no checkout ou o pagamento for confirmado, a venda aparecerá aqui com detalhes do cliente, valor e checkout.'
                  : 'Tente outro termo de busca.'}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {sales.length === 0 ? 'Aguardando vendas' : 'Sem resultados'}
              </div>
              {sales.length === 0 && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-4">
                  Publique um checkout e gere um pagamento para testar.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendasPage;
