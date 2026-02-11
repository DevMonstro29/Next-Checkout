import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
}

const ImageElement = ({ props, theme }: Props) => {
  const {
    src = '',
    alt = 'Imagem',
    width = '100%',
    height = 'auto',
    borderRadius = '',
    objectFit = 'contain',
    fullWidth = false,
  } = props;

  const effectiveRadius = fullWidth ? '0' : (borderRadius || theme?.borderRadius || '12px');

  if (!src) {
    return (
      <div
        className="flex items-center justify-center bg-neutral-200 text-neutral-400 text-sm"
        style={{ width: fullWidth ? '100%' : width, height: height === 'auto' ? '120px' : height, borderRadius: effectiveRadius }}
      >
        Adicione uma URL de imagem
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: fullWidth ? '100%' : width,
        height,
        borderRadius: effectiveRadius,
        objectFit: objectFit as any,
        display: 'block',
        maxWidth: '100%',
      }}
    />
  );
};

export default ImageElement;
