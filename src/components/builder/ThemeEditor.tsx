import { useBuilder } from '@/contexts/BuilderContext';

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium flex-1 min-w-0 truncate">{label}</label>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border border-neutral-200 dark:border-neutral-600 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded py-1 px-2 text-neutral-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
        />
      </div>
    </div>
  );
}

const ThemeEditor = () => {
  const { checkout, updateTheme, updateThemeColors } = useBuilder();

  if (!checkout) return null;

  const { theme } = checkout;

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      {/* Colors */}
      <div>
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Cores
        </h4>
        <div className="space-y-2.5">
          <ColorInput label="Fundo" value={theme.colors.background} onChange={(v) => updateThemeColors({ background: v })} />
          <ColorInput label="Card" value={theme.colors.card} onChange={(v) => updateThemeColors({ card: v })} />
          <ColorInput label="Borda" value={theme.colors.border} onChange={(v) => updateThemeColors({ border: v })} />
          <ColorInput label="Primária (botão)" value={theme.colors.primary} onChange={(v) => updateThemeColors({ primary: v })} />
          <ColorInput label="Texto primário" value={theme.colors.primaryText} onChange={(v) => updateThemeColors({ primaryText: v })} />
          <ColorInput label="Texto" value={theme.colors.text} onChange={(v) => updateThemeColors({ text: v })} />
          <ColorInput label="Texto secundário" value={theme.colors.textMuted} onChange={(v) => updateThemeColors({ textMuted: v })} />
          <ColorInput label="Timer" value={theme.colors.timer} onChange={(v) => updateThemeColors({ timer: v })} />
          <ColorInput label="Banner fundo" value={theme.colors.banner} onChange={(v) => updateThemeColors({ banner: v })} />
          <ColorInput label="Banner texto" value={theme.colors.bannerText} onChange={(v) => updateThemeColors({ bannerText: v })} />
        </div>
      </div>

      {/* Typography */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Tipografia
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Fonte</label>
            <select
              value={theme.font.family}
              onChange={(e) => updateTheme({ font: { ...theme.font, family: e.target.value } })}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Poppins">Poppins</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Lato">Lato</option>
              <option value="Nunito">Nunito</option>
            </select>
          </div>
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Peso títulos</label>
            <select
              value={theme.font.headingWeight}
              onChange={(e) => updateTheme({ font: { ...theme.font, headingWeight: e.target.value } })}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="400">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Layout
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Border radius global</label>
            <input
              type="text"
              value={theme.borderRadius}
              onChange={(e) => updateTheme({ borderRadius: e.target.value })}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Largura máxima</label>
            <input
              type="text"
              value={theme.maxWidth}
              onChange={(e) => updateTheme({ maxWidth: e.target.value })}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
          CSS Customizado
        </h4>
        <textarea
          value={theme.customCSS}
          onChange={(e) => updateTheme({ customCSS: e.target.value })}
          placeholder={`/* Ex: */\n.checkout-glow {\n  box-shadow: none;\n}`}
          rows={8}
          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-500 resize-none"
        />
      </div>
    </div>
  );
};

export default ThemeEditor;
