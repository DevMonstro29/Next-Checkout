import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
}

const PaymentMethodsElement = ({ props, theme }: Props) => {
  const {
    title = 'Formas de pagamento',
    showPixIcon = true,
    pixIconUrl = '/pix-icon.png',
    pixIconSize = '40px',
    footerText = '© 2025 Formas de pagamento',
    showFooterText = true,
    titleColor = '',
    footerColor = '',
  } = props;

  const mutedColor = theme?.colors.textMuted || '#6b7280';
  const effectiveTitleColor = titleColor || mutedColor;
  const effectiveFooterColor = footerColor || mutedColor;

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      {title && (
        <p className="text-xs font-bold" style={{ color: effectiveTitleColor }}>
          {title}
        </p>
      )}
      {showPixIcon && pixIconUrl && (
        <img
          src={pixIconUrl}
          alt="PIX"
          className="object-contain"
          style={{ height: pixIconSize }}
        />
      )}
      {showFooterText && footerText && (
        <p className="text-[10px]" style={{ color: effectiveFooterColor }}>
          {footerText}
        </p>
      )}
    </div>
  );
};

export default PaymentMethodsElement;
