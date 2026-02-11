import { Info, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { CheckoutTheme } from '@/types/checkout';

/** Allow only safe formatting tags: <b>, <i>, <u> */
function sanitizeHtml(html: string): string {
  // Replace all tags except b, i, u with escaped versions
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    const allowed = ['b', 'i', 'u'];
    if (allowed.includes(tag.toLowerCase())) return match;
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });
}

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
}

const ICONS: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
  success: <CheckCircle className="w-4 h-4 flex-shrink-0" />,
  lock: <Lock className="w-4 h-4 flex-shrink-0" />,
};

const BannerElement = ({ props, theme }: Props) => {
  const {
    text = 'Informação importante',
    backgroundColor = '#DBEAFE',
    textColor = '#000000',
    icon = 'info',
    iconColor = '',
    fullWidth = false,
  } = props;

  const radius = fullWidth ? '0' : (theme?.borderRadius || '16px');
  const effectiveIconColor = iconColor || textColor;

  return (
    <div
      className="p-4"
      style={{ backgroundColor, border: `1px solid ${backgroundColor}`, borderRadius: radius }}
    >
      <div className={`flex items-center gap-1 ${!icon ? 'justify-center' : ''}`}>
        {icon && ICONS[icon] && (
          <span className="flex-shrink-0" style={{ color: effectiveIconColor }}>{ICONS[icon]}</span>
        )}
        <p
          className="text-sm leading-relaxed text-center flex-1 min-w-0"
          style={{ color: textColor }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
        />
      </div>
    </div>
  );
};

export default BannerElement;
