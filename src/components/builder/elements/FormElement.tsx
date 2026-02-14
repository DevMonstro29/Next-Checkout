import { CheckoutTheme } from '@/types/checkout';
import { User, Mail, Phone, CreditCard } from 'lucide-react';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  isBuilder?: boolean;
  compact?: boolean;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  user: <User className="w-4 h-4" />,
  mail: <Mail className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  'credit-card': <CreditCard className="w-4 h-4" />,
};

const FormElement = ({ props, theme, isBuilder, compact }: Props) => {
  const {
    title = 'Identificação',
    titleIcon = 'user',
    titleIconColor = '#2957A4',
    showTitleIcon = true,
    showInputIcons = true,
    fields = [],
    showNoEmailCheckbox = true,
    noEmailLabel = 'Não tenho e-mail',
    titleColor = '',
    labelColor = '',
    inputBgColor = '',
    inputBorderColor = '',
    inputTextColor = '',
    inputBorderRadius = '',
    focusColor = '',
    checkboxColor = '',
  } = props;

  const cardBg = theme?.colors.card || '#ffffff';
  const borderColor = inputBorderColor || theme?.colors.border || '#e5e7eb';
  const textColor = titleColor || theme?.colors.text || '#1a1a2e';
  const mutedColor = labelColor || theme?.colors.textMuted || '#6b7280';
  const primaryColor = focusColor || theme?.colors.primary || '#22c55e';
  const bgColor = inputBgColor || theme?.colors.background || '#f5f7fa';
  const effectiveInputText = inputTextColor || theme?.colors.text || '#1a1a2e';
  const inputRadius = inputBorderRadius || '12px';
  const radius = theme?.borderRadius || '16px';
  const accentCheckbox = checkboxColor || theme?.colors.primary || '#2957A4';

  return (
    <div
      className={compact ? '' : 'p-5'}
      style={compact ? undefined : { backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: radius }}
    >
      <div className="flex items-center gap-2 mb-4">
        {showTitleIcon && (
          <span style={{ color: titleIconColor }}>
            {FIELD_ICONS[titleIcon] || FIELD_ICONS['user']}
          </span>
        )}
        <h2 className="font-semibold text-sm" style={{ color: textColor }}>
          {title}
        </h2>
      </div>

      <div className="space-y-3.5">
        {(fields as any[])
          .filter((f: any) => f.enabled)
          .map((field: any, i: number) => (
            <div key={field.id || i}>
              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: mutedColor }}
                >
                  {field.label}
                </label>
                <div className="relative">
                  {showInputIcons && field.icon && FIELD_ICONS[field.icon] && (
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: mutedColor }}
                    >
                      {FIELD_ICONS[field.icon]}
                    </span>
                  )}
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    disabled={isBuilder}
                    className="w-full text-sm py-3 pr-4 transition-all"
                    style={{
                      backgroundColor: bgColor,
                      border: `1px solid ${borderColor}`,
                      borderRadius: inputRadius,
                      paddingLeft: showInputIcons && field.icon ? '40px' : '12px',
                      color: effectiveInputText,
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor;
                      e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = borderColor;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Checkbox "Não tenho e-mail" logo abaixo do campo de e-mail */}
              {showNoEmailCheckbox && field.icon === 'mail' && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input type="checkbox" disabled={isBuilder} className="w-4 h-4 rounded" style={{ accentColor: accentCheckbox }} />
                  <span className="text-xs" style={{ color: mutedColor }}>
                    {noEmailLabel}
                  </span>
                </label>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default FormElement;
