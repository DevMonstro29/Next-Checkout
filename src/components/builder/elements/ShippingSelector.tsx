import { CheckoutTheme, ShippingOption } from '@/types/checkout';
import { Truck } from 'lucide-react';

export interface ShippingSelectorDisplayProps {
  title?: string;
  showIcon?: boolean;
  iconColor?: string;
  selectedBorderColor?: string;
  selectedBgColor?: string;
  optionTextColor?: string;
  optionMutedColor?: string;
  priceColor?: string;
}

interface Props {
  options: ShippingOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  theme?: CheckoutTheme;
  isBuilder?: boolean;
  /** Personalização visual (vem do elemento Address) */
  displayProps?: ShippingSelectorDisplayProps;
  /** Quando true, não aplica o wrapper de card */
  compact?: boolean;
}

const ShippingSelector = ({ options, selectedId, onSelect, theme, isBuilder, displayProps, compact }: Props) => {
  const cardBg = theme?.colors.card || '#ffffff';
  const borderColor = theme?.colors.border || '#e5e7eb';
  const textColor = theme?.colors.text || '#1a1a2e';
  const mutedColor = theme?.colors.textMuted || '#6b7280';
  const primaryColor = theme?.colors.primary || '#22c55e';
  const radius = theme?.borderRadius || '16px';
  const title = displayProps?.title ?? 'Opções de Frete';
  const showIcon = displayProps?.showIcon ?? true;
  const iconColor = displayProps?.iconColor || primaryColor || '#2957A4';
  const selectedBorder = displayProps?.selectedBorderColor || primaryColor;
  const selectedBg = displayProps?.selectedBgColor || `${primaryColor}08`;
  const optText = displayProps?.optionTextColor || textColor;
  const optMuted = displayProps?.optionMutedColor || mutedColor;
  const priceClr = displayProps?.priceColor;

  if (!options || options.length === 0) return null;

  return (
    <div
      className={compact ? '' : 'p-5'}
      style={compact ? undefined : { backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: radius }}
    >
      <div className="flex items-center gap-2 mb-4">
        {showIcon && (
          <span style={{ color: iconColor }}>
            <Truck className="w-4 h-4" />
          </span>
        )}
        <h2 className="font-semibold text-sm" style={{ color: optText }}>
          {title}
        </h2>
      </div>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const formattedPrice =
            opt.price_cents === 0
              ? 'Grátis'
              : `R$ ${(opt.price_cents / 100).toFixed(2).replace('.', ',')}`;

          return (
            <label
              key={opt.id}
              className="flex items-center gap-3 p-3 cursor-pointer transition-all"
              style={{
                border: `2px solid ${isSelected ? selectedBorder : borderColor}`,
                backgroundColor: isSelected ? selectedBg : 'transparent',
                borderRadius: radius,
              }}
              onClick={() => {
                if (!isBuilder) onSelect(opt.id);
              }}
            >
              <input
                type="radio"
                name="shipping"
                checked={isSelected}
                disabled={isBuilder}
                onChange={() => onSelect(opt.id)}
                className="w-4 h-4 accent-[#22c55e]"
                style={{ accentColor: selectedBorder }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: optText }}>
                    {opt.name}
                  </span>
                  <span
                    className="text-sm font-semibold ml-2 whitespace-nowrap"
                    style={{ color: priceClr || (opt.price_cents === 0 ? primaryColor : optText) }}
                  >
                    {formattedPrice}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: optMuted }}>
                    {opt.estimated_days}
                  </span>
                  {opt.description && (
                    <>
                      <span className="text-xs" style={{ color: optMuted }}>·</span>
                      <span className="text-xs" style={{ color: optMuted }}>
                        {opt.description}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ShippingSelector;
