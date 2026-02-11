import { useBuilder } from '@/contexts/BuilderContext';
import { Footprints, Link2, Share2 } from 'lucide-react';

const SettingsEditor = () => {
  const { checkout, updateCheckoutName, updateCheckoutSlug, updateSettings } = useBuilder();

  if (!checkout) return null;

  const { settings } = checkout;
  const steps = settings.checkoutSteps || 3;

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      {/* General */}
      <div>
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Geral
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Nome do checkout</label>
            <input
              type="text"
              value={checkout.name}
              onChange={(e) => updateCheckoutName(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Slug (URL)</label>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 dark:text-neutral-500 text-xs">/c/</span>
              <input
                type="text"
                value={checkout.slug}
                onChange={(e) => updateCheckoutSlug(e.target.value)}
                className="flex-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Checkout Steps */}
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-2 flex items-center gap-1.5 flex-wrap">
              <Footprints className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Etapas do Checkout (produto físico)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ checkoutSteps: 2 })}
                className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                  steps === 2
                    ? 'bg-brand-500/15 border-brand-500 text-brand-500 dark:text-brand-400'
                    : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-500'
                }`}
              >
                <div className="text-center">
                  <span className="block text-sm font-bold">2 Passos</span>
                  <span className="block text-[10px] mt-0.5 opacity-70">Dados + Pagamento</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ checkoutSteps: 3 })}
                className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                  steps === 3
                    ? 'bg-brand-500/15 border-brand-500 text-brand-500 dark:text-brand-400'
                    : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-500'
                }`}
              >
                <div className="text-center">
                  <span className="block text-sm font-bold">3 Passos</span>
                  <span className="block text-[10px] mt-0.5 opacity-70">Dados + Endereço + Pag.</span>
                </div>
              </button>
            </div>
            <p className="text-neutral-400 dark:text-neutral-600 text-[10px] mt-1.5 leading-relaxed">
              Aplica-se apenas a produtos físicos. Produtos digitais são sempre em página única.
            </p>
          </div>
        </div>
      </div>

      {/* Logo & Branding */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Logo & Branding
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">URL do Logo</label>
            <input
              type="text"
              value={settings.logoUrl}
              onChange={(e) => updateSettings({ logoUrl: e.target.value })}
              placeholder="/logo.png"
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-neutral-600 dark:text-neutral-400 text-xs font-medium">Badge de segurança</span>
            <button
              type="button"
              onClick={() => updateSettings({ showSecurityBadge: !settings.showSecurityBadge })}
              className={`w-9 h-5 rounded-full transition-all flex items-center ${
                settings.showSecurityBadge ? 'bg-brand-500 justify-end' : 'bg-neutral-300 dark:bg-neutral-600 justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm" />
            </button>
          </label>
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Texto segurança</label>
            <input
              type="text"
              value={settings.securityText}
              onChange={(e) => updateSettings({ securityText: e.target.value })}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Pagamento
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Expiração PIX (minutos)</label>
            <input
              type="number"
              value={settings.pixExpirationMinutes}
              onChange={(e) => updateSettings({ pixExpirationMinutes: parseInt(e.target.value) || 30 })}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-neutral-600 dark:text-neutral-400 text-xs font-medium">Mostrar instruções de pagamento</span>
            <button
              type="button"
              onClick={() => updateSettings({ showInstructions: !settings.showInstructions })}
              className={`w-9 h-5 rounded-full transition-all flex items-center ${
                settings.showInstructions ? 'bg-brand-500 justify-end' : 'bg-neutral-300 dark:bg-neutral-600 justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm" />
            </button>
          </label>
        </div>
      </div>

      {/* UTM e Redirecionamento */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5" />
          UTM e Redirecionamento
        </h4>
        <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mb-3 leading-relaxed">
          Configure o envio de UTMs ao gerar o PIX (ex.: utmify) e quais dados do cliente incluir na URL ao redirecionar após pagamento aprovado.
        </p>

        <div className="space-y-4">
          <div>
            <h5 className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-2">UTM ao gerar pagamento</h5>
            <label className="flex items-center justify-between cursor-pointer gap-3">
              <span className="text-neutral-600 dark:text-neutral-400 text-xs">Enviar UTMs da URL ao gerar PIX</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.utmEnabled ?? false}
                onClick={() => updateSettings({ utmEnabled: !(settings.utmEnabled ?? false) })}
                className={`w-9 h-5 rounded-full transition-colors flex items-center flex-shrink-0 ${
                  (settings.utmEnabled ?? false) ? 'bg-brand-500 justify-end' : 'bg-neutral-300 dark:bg-neutral-600 justify-start'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm block" />
              </button>
            </label>
            <p className="text-[10px] text-neutral-400 mt-1">
              Captura utm_source, utm_campaign, utm_medium, utm_content e utm_term da URL atual e envia na requisição.
            </p>
            {(settings.utmEnabled ?? false) && (
              <div className="mt-3 pl-0 space-y-2">
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Valores opcionais (usados quando a URL não tiver o parâmetro):
                </p>
                {[
                  { key: 'utmSource' as const, label: 'utm_source', placeholder: 'ex: google' },
                  { key: 'utmMedium' as const, label: 'utm_medium', placeholder: 'ex: cpc' },
                  { key: 'utmCampaign' as const, label: 'utm_campaign', placeholder: 'ex: black_friday' },
                  { key: 'utmContent' as const, label: 'utm_content', placeholder: 'ex: banner' },
                  { key: 'utmTerm' as const, label: 'utm_term', placeholder: 'ex: tenis' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0">{label}</span>
                    <input
                      type="text"
                      value={settings[key] ?? ''}
                      onChange={(e) => updateSettings({ [key]: e.target.value || undefined })}
                      placeholder={placeholder}
                      className="flex-1 min-w-0 max-w-[180px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded py-1.5 px-2 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h5 className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-2 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" />
              Parâmetros no link de redirecionamento
            </h5>
            <p className="text-[10px] text-neutral-400 mb-2">Após pagamento aprovado, incluir na URL de destino:</p>
            <div className="space-y-2">
              {[
                { key: 'redirectAppendCpf' as const, paramKey: 'redirectParamCpf' as const, label: 'CPF', defaultParam: 'cpf' },
                { key: 'redirectAppendNome' as const, paramKey: 'redirectParamNome' as const, label: 'Nome', defaultParam: 'nome' },
                { key: 'redirectAppendEmail' as const, paramKey: 'redirectParamEmail' as const, label: 'E-mail', defaultParam: 'email' },
                { key: 'redirectAppendTelefone' as const, paramKey: 'redirectParamTelefone' as const, label: 'Telefone', defaultParam: 'telefone' },
              ].map(({ key, paramKey, label, defaultParam }) => (
                <div key={key} className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key] ?? true}
                      onChange={(e) => updateSettings({ [key]: e.target.checked })}
                      className="rounded border-neutral-300 dark:border-neutral-600"
                    />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
                  </label>
                  <span className="text-neutral-400 text-xs">→</span>
                  <input
                    type="text"
                    value={settings[paramKey] ?? defaultParam}
                    onChange={(e) => updateSettings({ [paramKey]: e.target.value || defaultParam })}
                    placeholder={defaultParam}
                    className="w-24 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded py-1.5 px-2 text-xs text-neutral-900 dark:text-white"
                  />
                  <span className="text-[10px] text-neutral-400">nome do parâmetro na URL</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsEditor;
