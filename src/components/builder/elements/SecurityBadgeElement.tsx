import { useState } from 'react';
import { Shield, ShieldCheck, Lock, X, Globe, Eye, Fingerprint, Award } from 'lucide-react';
import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  isBuilder?: boolean;
}

const ICONS: Record<string, React.ReactNode> = {
  shield: <Shield className="w-4 h-4" />,
  'shield-check': <ShieldCheck className="w-4 h-4" />,
  lock: <Lock className="w-4 h-4" />,
};

const SecurityBadgeElement = ({ props, theme, isBuilder = false }: Props) => {
  const {
    text = 'Ambiente seguro',
    icon = 'shield',
    variant = 'simple',
    showImage = true,
    imageUrl = '/ambiente-seguro.png',
    iconColor = '',
    textColorProp = '',
    // Popup customization
    popupTitle = 'Não se preocupe,\naqui é **seguro!**',
    popupDescription = 'A loja que você está comprando utiliza um ambiente protegido para processar o seu pagamento de forma **100% segura**, com criptografia de ponta a ponta e que garante a segurança dos seus dados.',
    popupButtonText = 'Estou seguro, quero comprar!',
    popupButtonColor = '',
    popupButtonTextColor = '#ffffff',
    popupIconColor = '',
  } = props;

  const [showPopup, setShowPopup] = useState(false);

  const textColor = textColorProp || theme?.colors.text || '#1a1a2e';
  const mutedColor = theme?.colors.textMuted || '#6b7280';
  const effectiveIconColor = iconColor || theme?.colors.primary || '#22c55e';
  const primaryColor = theme?.colors.primary || '#22c55e';
  const radius = theme?.borderRadius || '12px';
  const popupBtnColor = popupButtonColor || primaryColor;
  const popupIcColor = popupIconColor || primaryColor;

  const handleClick = () => {
    if (!isBuilder) {
      setShowPopup(true);
    }
  };

  // Render bold text marked with **text**
  const renderBoldText = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Render multiline + bold
  const renderText = (str: string) => {
    const lines = str.split('\n');
    return lines.map((line, i) => (
      <span key={i}>
        {renderBoldText(line)}
        {i < lines.length - 1 && <br />}
      </span>
    ));
  };

  const SECURITY_FEATURES = [
    {
      icon: <Globe className="w-5 h-5" />,
      title: 'Ambiente criptografado',
      description: 'Sua compra é processada em um ambiente de alta segurança, criptografado de ponta a ponta.',
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Monitoramento 24/7',
      description: 'Nosso sistema de segurança é monitorado 24 horas por dia, 7 dias por semana.',
    },
    {
      icon: <Fingerprint className="w-5 h-5" />,
      title: 'Antifraude dedicado',
      description: 'É impossível ocorrer fraude em seu nome, afinal, nenhum dado sensível fica guardado em nosso sistema.',
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: 'Certificados SSL',
      description: 'Nenhuma transação é aceita fora de uma rede segura. Você será alertado caso esteja conectado a uma rede suspeita.',
    },
  ];

  const badgeContent = (
    <>
      {variant === 'filled' && (
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: `${effectiveIconColor}15`, borderRadius: radius }}
            onClick={handleClick}
          >
            <span style={{ color: effectiveIconColor }}>
              {ICONS[icon] || ICONS['shield']}
            </span>
            <span className="text-xs font-semibold" style={{ color: textColor }}>
              {text}
            </span>
          </div>
        </div>
      )}

      {variant === 'outlined' && (
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center gap-2 px-4 py-2 border cursor-pointer hover:opacity-80 transition-opacity"
            style={{ borderColor: theme?.colors.border || '#e5e7eb', borderRadius: radius }}
            onClick={handleClick}
          >
            <span style={{ color: iconColor || mutedColor }}>
              {ICONS[icon] || ICONS['shield']}
            </span>
            <span className="text-xs font-semibold" style={{ color: textColor }}>
              {text}
            </span>
          </div>
        </div>
      )}

      {variant === 'simple' && (
        <div className="flex flex-col items-center gap-2 mt-2">
          {showImage && imageUrl ? (
            <div
              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleClick}
            >
              <img src={imageUrl} alt={text} className="h-5 object-contain" />
              <span className="text-xs font-semibold" style={{ color: textColor }}>
                {text}
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleClick}
            >
              <span style={{ color: iconColor || mutedColor }}>
                {ICONS[icon] || ICONS['shield']}
              </span>
              <span className="text-xs font-semibold" style={{ color: textColor }}>
                {text}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {badgeContent}

      {/* Security Popup Modal */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowPopup(false)}
        >
          <div
            className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ backgroundColor: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors z-10"
            >
              <X className="w-5 h-5" style={{ color: '#6b7280' }} />
            </button>

            <div className="p-6 pb-4">
              {/* Shield icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${popupIcColor}15` }}
              >
                <ShieldCheck className="w-7 h-7" style={{ color: popupIcColor }} />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold leading-tight mb-4" style={{ color: '#1a1a2e' }}>
                {renderText(popupTitle)}
              </h2>

              {/* Description */}
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#4b5563' }}>
                {renderBoldText(popupDescription)}
              </p>

              {/* Section title */}
              <p className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>
                Ficou curioso? Veja como te protegemos:
              </p>

              {/* Security features */}
              <div className="space-y-5 mb-6">
                {SECURITY_FEATURES.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${popupIcColor}10` }}
                    >
                      <span style={{ color: popupIcColor }}>{feature.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-0.5" style={{ color: '#1a1a2e' }}>
                        {feature.title}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: popupBtnColor,
                  color: popupButtonTextColor,
                  boxShadow: `0 4px 14px ${popupBtnColor}40`,
                }}
              >
                {popupButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecurityBadgeElement;
