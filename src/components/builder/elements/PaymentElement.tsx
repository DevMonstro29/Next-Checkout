import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  compact?: boolean;
}

const PaymentElement = ({ props, theme, compact }: Props) => {
  const {
    title = 'Pagamento',
    description = 'Ao selecionar o Pix, você será encaminhado para um ambiente seguro para finalizar seu pagamento.',
    pixLogoUrl = '/pix-logo.png',
    showPixLogo = true,
    pixLogoSize = '40px',
    titleColor = '',
    descriptionColor = '',
    innerBgColor = '',
    innerBorderColor = '',
  } = props;

  const cardBg = theme?.colors.card || '#ffffff';
  const borderColor = theme?.colors.border || '#e5e7eb';
  const textColor = titleColor || theme?.colors.text || '#1a1a2e';
  const mutedColor = descriptionColor || theme?.colors.textMuted || '#6b7280';
  const radius = theme?.borderRadius || '16px';

  return (
    <div
      className={compact ? '' : 'p-5'}
      style={compact ? undefined : { backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: radius }}
    >
      <h2 className="font-semibold text-sm mb-4" style={{ color: textColor }}>
        {title}
      </h2>
      <div
        className="p-6 flex flex-col items-center text-center"
        style={{
          backgroundColor: innerBgColor || '#f9fafb',
          border: `1px solid ${innerBorderColor || '#e5e7eb'}`,
          borderRadius: radius,
        }}
      >
        {showPixLogo && pixLogoUrl && (
          <img src={pixLogoUrl} alt="PIX" className="object-contain mb-4" style={{ height: pixLogoSize }} />
        )}
        <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default PaymentElement;
