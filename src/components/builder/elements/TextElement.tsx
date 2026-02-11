import { CheckoutTheme } from '@/types/checkout';

/** Allow only safe formatting tags: <b>, <i>, <u> */
function sanitizeHtml(html: string): string {
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

const TextElement = ({ props, theme }: Props) => {
  const {
    content = 'Texto de exemplo',
    alignment = 'left',
    fontSize = '14px',
    fontWeight = '400',
    color = '',
  } = props;

  return (
    <p
      style={{
        textAlign: alignment,
        fontSize,
        fontWeight,
        color: color || theme?.colors.text || '#1a1a2e',
        lineHeight: 1.6,
      }}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
};

export default TextElement;
