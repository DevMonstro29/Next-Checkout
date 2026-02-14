import { CheckoutTheme } from '@/types/checkout';
import { MapPin, Search } from 'lucide-react';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  isBuilder?: boolean;
  compact?: boolean;
}

const AddressElement = ({ props, theme, isBuilder, compact }: Props) => {
  const {
    title = 'Endereço de Entrega',
    cepPlaceholder = '00000-000',
    showComplemento = true,
    showTitleIcon = true,
    showCepSearchIcon = true,
    cepSearchIconColor = '',
    // Custom colors
    titleColor = '',
    iconColor = '',
    labelColor = '',
    inputTextColor = '',
    inputBgColor = '',
    inputBorderColor = '',
    inputBorderRadius = '',
  } = props;

  const cardBg = theme?.colors.card || '#ffffff';
  const borderColor = theme?.colors.border || '#e5e7eb';
  const textColor = titleColor || theme?.colors.text || '#1a1a2e';
  const mutedColor = labelColor || theme?.colors.textMuted || '#6b7280';
  const primaryColor = theme?.colors.primary || '#22c55e';
  const bgColor = theme?.colors.background || '#f5f7fa';
  const radius = theme?.borderRadius || '16px';
  const effectiveIconColor = iconColor || '#2957A4';
  const effectiveInputText = inputTextColor || textColor;
  const effectiveInputBg = inputBgColor || bgColor;
  const effectiveInputBorder = inputBorderColor || borderColor;

  const inputRadius = inputBorderRadius || '12px';

  const inputStyle = {
    backgroundColor: effectiveInputBg,
    border: `1px solid ${effectiveInputBorder}`,
    borderRadius: inputRadius,
    color: effectiveInputText,
    outline: 'none',
  };

  return (
    <div
      className={compact ? '' : 'p-5'}
      style={compact ? undefined : { backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: radius }}
    >
      <div className="flex items-center gap-2 mb-4">
        {showTitleIcon && (
          <span style={{ color: effectiveIconColor }}>
            <MapPin className="w-4 h-4" />
          </span>
        )}
        <h2 className="font-semibold text-sm" style={{ color: textColor }}>
          {title}
        </h2>
      </div>

      <div className="space-y-3">
        {/* CEP */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: mutedColor }}>
            CEP
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={cepPlaceholder}
              disabled={isBuilder}
              className={`w-full text-sm py-3 pl-3 transition-all ${showCepSearchIcon ? 'pr-10' : 'pr-3'}`}
              style={inputStyle}
            />
            {showCepSearchIcon && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: cepSearchIconColor || primaryColor }}
              >
                <Search className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>

        {/* Rua */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: mutedColor }}>
            Rua
          </label>
          <input
            type="text"
            placeholder="Rua, avenida, etc."
            disabled={isBuilder}
            className="w-full text-sm py-3 px-3 transition-all"
            style={inputStyle}
          />
        </div>

        {/* Número e Complemento */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: mutedColor }}>
              Número
            </label>
            <input
              type="text"
              placeholder="Nº"
              disabled={isBuilder}
              className="w-full text-sm py-3 px-3 transition-all"
              style={inputStyle}
            />
          </div>
          {showComplemento && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: mutedColor }}>
                Complemento
              </label>
              <input
                type="text"
                placeholder="Apto, bloco..."
                disabled={isBuilder}
                className="w-full text-sm py-3 px-3 transition-all"
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {/* Bairro */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: mutedColor }}>
            Bairro
          </label>
          <input
            type="text"
            placeholder="Bairro"
            disabled={isBuilder}
            className="w-full text-sm py-3 px-3 transition-all"
            style={inputStyle}
          />
        </div>

        {/* Cidade e Estado */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: mutedColor }}>
              Cidade
            </label>
            <input
              type="text"
              placeholder="Cidade"
              disabled={isBuilder}
              className="w-full text-sm py-3 px-3 transition-all"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: mutedColor }}>
              Estado
            </label>
            <input
              type="text"
              placeholder="UF"
              disabled={isBuilder}
              className="w-full text-sm py-3 px-3 transition-all"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressElement;
