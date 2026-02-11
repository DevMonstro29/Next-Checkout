import { Star } from 'lucide-react';
import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
}

const TestimonialElement = ({ props, theme }: Props) => {
  const {
    name = 'Maria Silva',
    text = 'Processo rápido e seguro. Recomendo!',
    rating = 5,
    avatarUrl = '',
    backgroundColor = '',
    textColorProp = '',
    nameColor = '',
    starColor = '',
    borderColorProp = '',
  } = props;

  const cardBg = backgroundColor || theme?.colors.card || '#ffffff';
  const borderColor = borderColorProp || theme?.colors.border || '#e5e7eb';
  const textColor = textColorProp || theme?.colors.text || '#1a1a2e';
  const mutedColor = nameColor || theme?.colors.textMuted || '#6b7280';
  const effectiveStarColor = starColor || '#f59e0b';
  const radius = theme?.borderRadius || '16px';

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: radius,
      }}
    >
      <div className="flex items-start gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
            style={{ backgroundColor: `${theme?.colors.primary || '#22c55e'}20`, color: theme?.colors.primary || '#22c55e' }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5"
                style={{
                  color: i < rating ? effectiveStarColor : '#d1d5db',
                  fill: i < rating ? effectiveStarColor : 'none',
                }}
              />
            ))}
          </div>
          <p className="text-sm leading-relaxed mb-1" style={{ color: textColor }}>
            "{text}"
          </p>
          <p className="text-xs font-medium" style={{ color: mutedColor }}>
            {name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialElement;
