import { TrendingUp, ShoppingBag, Receipt, Info } from 'lucide-react';

const InicioPage = () => (
  <div className="p-6 max-w-6xl mx-auto">
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Início</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mt-1">
        Visão geral do seu negócio e faturamento
      </p>
    </div>

    {/* Informações gerais */}
    <div className="mb-8 p-4 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 dark:border-brand-500/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Informações gerais</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Aqui você acompanha o desempenho dos seus checkouts. O faturamento é atualizado conforme os pagamentos são confirmados. 
            Use o menu ao lado para acessar vendas, checkouts, domínios e integrações.
          </p>
        </div>
      </div>
    </div>

    {/* Faturamento e métricas */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Faturamento total</span>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white">R$ 0,00</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Todos os pagamentos aprovados</p>
      </div>
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Vendas realizadas</span>
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-brand-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white">0</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Transações concluídas</p>
      </div>
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Ticket médio</span>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white">R$ 0,00</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Valor médio por venda</p>
      </div>
    </div>
  </div>
);

export default InicioPage;
