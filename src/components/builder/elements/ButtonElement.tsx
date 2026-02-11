import { Loader2 } from 'lucide-react';
import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  isBuilder?: boolean;
  onSubmit?: (data: any) => void;
  isSubmitting?: boolean;
}

const ButtonElement = ({ props, theme, isBuilder, onSubmit, isSubmitting }: Props) => {
  const {
    text = 'GERAR PIX',
    loadingText = 'GERANDO PIX...',
    backgroundColor = '',
    textColor = '',
    fontSize = '16px',
    paddingY = '16px',
    borderRadius = '',
    showGlow = true,
  } = props;

  const bgColor = backgroundColor || theme?.colors.primary || '#22c55e';
  const txtColor = textColor || theme?.colors.primaryText || '#ffffff';
  const radius = borderRadius || theme?.borderRadius || '16px';

  return (
    <button
      type={isBuilder ? 'button' : 'submit'}
      disabled={isBuilder || isSubmitting}
      onClick={() => !isBuilder && onSubmit?.({})}
      className={`w-full font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
        showGlow ? 'checkout-glow' : ''
      }`}
      style={{
        backgroundColor: bgColor,
        color: txtColor,
        fontSize,
        paddingTop: paddingY,
        paddingBottom: paddingY,
        borderRadius: radius,
        opacity: isBuilder ? 0.9 : undefined,
      }}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </button>
  );
};

export default ButtonElement;
