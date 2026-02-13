import { useBuilder } from '@/contexts/BuilderContext';
import { ShippingOption } from '@/types/checkout';
import { Plus, Trash2, Package, Truck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function parseBRLToCents(str: string): number {
  if (!str || typeof str !== 'string') return 0;
  const s = str.replace(/\s/g, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  let cleaned: string;
  if (hasComma && hasDot) {
    cleaned = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    cleaned = s.replace(',', '.');
  } else if (hasDot) {
    cleaned = s;
  } else {
    cleaned = s + '.00';
  }
  const num = parseFloat(cleaned);
  if (Number.isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ProductEditor = () => {
  const { products, updateProduct, addProduct, removeProduct } = useBuilder();

  const addShippingOption = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newOption: ShippingOption = {
      id: uuidv4(),
      name: 'Frete Padrão',
      price_cents: 0,
      estimated_days: '5-10 dias úteis',
      description: '',
    };
    updateProduct(productId, {
      shipping_options: [...(product.shipping_options || []), newOption],
    });
  };

  const updateShippingOption = (productId: string, optionId: string, data: Partial<ShippingOption>) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const updated = (product.shipping_options || []).map((opt) =>
      opt.id === optionId ? { ...opt, ...data } : opt
    );
    updateProduct(productId, { shipping_options: updated });
  };

  const removeShippingOption = (productId: string, optionId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateProduct(productId, {
      shipping_options: (product.shipping_options || []).filter((opt) => opt.id !== optionId),
    });
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-neutral-900 dark:text-white text-sm font-semibold">Produtos</h3>
        <button
          onClick={addProduct}
          className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 text-xs flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {products.length === 0 && (
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center py-8">
          Nenhum produto adicionado
        </p>
      )}

      {products.map((product, i) => (
        <div
          key={product.id}
          className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
              {product.is_upsell ? `Upsell #${i}` : 'Produto Principal'}
            </span>
            {products.length > 1 && (
              <button
                onClick={() => removeProduct(product.id)}
                className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tipo de Produto */}
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1.5 block">Tipo de Produto</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateProduct(product.id, { product_type: 'digital' })}
                className={`flex items-center gap-2 justify-center py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                  (product.product_type || 'digital') === 'digital'
                    ? 'bg-brand-500/15 border-brand-500 text-brand-500 dark:text-brand-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-500'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Digital
              </button>
              <button
                type="button"
                onClick={() => updateProduct(product.id, { product_type: 'physical' })}
                className={`flex items-center gap-2 justify-center py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                  product.product_type === 'physical'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-500'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Físico
              </button>
            </div>
          </div>

          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Nome</label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => updateProduct(product.id, { name: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Preço</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatCentsToBRL(product.amount_cents)}
              onChange={(e) => updateProduct(product.id, { amount_cents: parseBRLToCents(e.target.value) })}
              placeholder="0,00"
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Descrição</label>
            <input
              type="text"
              value={product.description}
              onChange={(e) => updateProduct(product.id, { description: e.target.value })}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">URL de redirecionamento (após pagamento)</label>
            <input
              type="text"
              value={product.redirect_url}
              onChange={(e) => updateProduct(product.id, { redirect_url: e.target.value })}
              placeholder="/upsell ou https://..."
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={product.is_upsell}
              onChange={(e) => updateProduct(product.id, { is_upsell: e.target.checked })}
              className="w-4 h-4 rounded accent-brand-500"
            />
            <span className="text-neutral-600 dark:text-neutral-400 text-xs">É upsell</span>
          </label>

          {/* Opções de Frete (apenas para produto físico) */}
          {product.product_type === 'physical' && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 mt-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400 text-xs font-semibold">Opções de Frete</span>
                </div>
                <button
                  onClick={() => addShippingOption(product.id)}
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>

              {(!product.shipping_options || product.shipping_options.length === 0) && (
                <p className="text-neutral-400 dark:text-neutral-600 text-xs text-center py-3">
                  Adicione opções de frete para o produto físico
                </p>
              )}

              {(product.shipping_options || []).map((opt) => (
                <div
                  key={opt.id}
                  className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 mb-2 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold uppercase tracking-wider">
                      Opção de frete
                    </span>
                    <button
                      onClick={() => removeShippingOption(product.id, opt.id)}
                      className="p-0.5 text-neutral-400 dark:text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <label className="text-neutral-400 dark:text-neutral-500 text-[11px] mb-0.5 block">Nome</label>
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => updateShippingOption(product.id, opt.id, { name: e.target.value })}
                      placeholder="Ex: PAC, SEDEX, Frete Grátis"
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded py-1.5 px-2 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-neutral-400 dark:text-neutral-500 text-[11px] mb-0.5 block">Preço</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={opt.price_cents === 0 ? '' : formatCentsToBRL(opt.price_cents)}
                        onChange={(e) => updateShippingOption(product.id, opt.id, { price_cents: parseBRLToCents(e.target.value) })}
                        placeholder="Grátis ou 0,00"
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded py-1.5 px-2 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-neutral-400 dark:text-neutral-600 text-[10px] mt-0.5">
                        {opt.price_cents === 0 ? 'Grátis' : `R$ ${formatCentsToBRL(opt.price_cents)}`}
                      </p>
                    </div>
                    <div>
                      <label className="text-neutral-400 dark:text-neutral-500 text-[11px] mb-0.5 block">Prazo estimado</label>
                      <input
                        type="text"
                        value={opt.estimated_days}
                        onChange={(e) => updateShippingOption(product.id, opt.id, { estimated_days: e.target.value })}
                        placeholder="5-10 dias úteis"
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded py-1.5 px-2 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Pré-selecionado toggle */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">Pré-selecionado</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Desmarcar todos e marcar apenas este
                        const updated = (product.shipping_options || []).map((o) => ({
                          ...o,
                          preSelected: o.id === opt.id ? !o.preSelected : false,
                        }));
                        updateProduct(product.id, { shipping_options: updated });
                      }}
                      className={`w-9 h-5 rounded-full transition-all flex items-center ${
                        opt.preSelected ? 'bg-brand-500 justify-end' : 'bg-neutral-300 dark:bg-neutral-600 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm" />
                    </button>
                  </label>

                  <div>
                    <label className="text-neutral-400 dark:text-neutral-500 text-[11px] mb-0.5 block">Descrição (opcional)</label>
                    <input
                      type="text"
                      value={opt.description}
                      onChange={(e) => updateShippingOption(product.id, opt.id, { description: e.target.value })}
                      placeholder="Ex: Entrega pelos Correios"
                      className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded py-1.5 px-2 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductEditor;
