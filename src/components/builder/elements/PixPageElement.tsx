import { ShieldCheck, Copy, QrCode, Clock } from 'lucide-react';
import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
}

const PixPageElement = ({ props, theme }: Props) => {
  const {
    headerTitle = 'Falta pouco!',
    headerSubtitle = 'Para finalizar a compra, efetue o pagamento com PIX!',
    headerLogoUrl = '',
    headerLogoSize = '56px',
    copyButtonText = 'COPIAR CÓDIGO',
    valueLabelText = 'Valor a ser pago:',
    showInstructions = true,
    instructionTitle = 'Instruções para pagamento',
    instructions = [
      'Após copiar o código, abra seu aplicativo de pagamento onde você utiliza o Pix.',
      'Escolha a opção PIX Copia e Cola e insira o código copiado.',
      'Confirme as informações e finalize sua compra.',
    ],
    showPurchaseDetails = true,
    purchaseDetailsTitle = 'Detalhes da compra:',
    showHelpLink = true,
    helpLinkText = 'Caso tenha dúvida, clique aqui para ver o tutorial',
    showQrCode = true,
    // Custom colors
    headerIconColor = '',
    titleColor = '',
    subtitleColor = '',
    timerColor = '',
    timerBgColor = '',
    timerBorderColor = '',
    timerBorderRadius = '',
    timerLabel = 'Sua oferta termina em:',
    showTimerIcon = true,
    timerDisplayMinutes = 0,
    timerCenter = true,
    timerOpacity,
    copyButtonBgColor = '',
    copyButtonTextColor = '',
    valueColor = '',
    valueBgColor = '',
    instructionNumberColor = '',
    instructionTextColor = '',
    cardBgColor = '',
    cardBorderColor = '',
  } = props;

  const primaryColor = theme?.colors.primary || '#22c55e';
  const cardColor = cardBgColor || theme?.colors.card || '#ffffff';
  const borderColor = cardBorderColor || theme?.colors.border || '#e5e7eb';
  const textColor = titleColor || theme?.colors.text || '#1a1a2e';
  const mutedColor = subtitleColor || theme?.colors.textMuted || '#6b7280';
  const borderRadius = theme?.borderRadius || '16px';

  const effectiveIconColor = headerIconColor || primaryColor;
  const effectiveTimerColor = timerColor || primaryColor;
  const effectiveTimerBg = timerBgColor || `${primaryColor}15`;
  const effectiveTimerBorder = timerBorderColor || `${effectiveTimerColor}30`;
  const effectiveTimerRadius = timerBorderRadius || borderRadius;
  const displayMins = timerDisplayMinutes > 0 ? timerDisplayMinutes : 30;
  const effectiveTimerOpacity = typeof timerOpacity === 'number' ? Math.max(0, Math.min(1, timerOpacity)) : 1;
  const effectiveCopyBtnBg = copyButtonBgColor || primaryColor;
  const effectiveCopyBtnText = copyButtonTextColor || theme?.colors.primaryText || '#ffffff';
  const effectiveValueColor = valueColor || primaryColor;
  const effectiveValueBg = valueBgColor || `${primaryColor}15`;
  const effectiveInstrNumColor = instructionNumberColor || primaryColor;
  const effectiveInstrTextColor = instructionTextColor || theme?.colors.textMuted || '#6b7280';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="p-5 text-center"
        style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}`, borderRadius }}
      >
        <div
          className="rounded-2xl flex items-center justify-center mx-auto mb-3 overflow-hidden"
          style={{
            width: headerLogoSize,
            height: headerLogoSize,
            minWidth: headerLogoSize,
            minHeight: headerLogoSize,
            backgroundColor: headerLogoUrl ? 'transparent' : `${effectiveIconColor}20`,
          }}
        >
          {headerLogoUrl ? (
            <img src={headerLogoUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <ShieldCheck className="w-7 h-7" style={{ color: effectiveIconColor }} />
          )}
        </div>
        <h2 className="font-bold text-lg mb-1" style={{ color: textColor }}>{headerTitle}</h2>
        <p className="text-sm" style={{ color: mutedColor }}>{headerSubtitle}</p>
        <div className={`mt-4 ${timerCenter ? 'flex justify-center' : ''}`}>
          <div
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold inline-flex"
            style={{
              backgroundColor: effectiveTimerBg,
              color: effectiveTimerColor,
              border: `1px solid ${effectiveTimerBorder}`,
              borderRadius: effectiveTimerRadius,
              opacity: effectiveTimerOpacity,
            }}
          >
            {showTimerIcon && <Clock className="w-4 h-4 flex-shrink-0" style={{ color: effectiveTimerColor }} />}
            <span>{timerLabel} {String(displayMins).padStart(2, '0')}:00</span>
          </div>
        </div>
      </div>

      {/* QR Code preview */}
      {showQrCode && (
        <div
          className="p-5 flex justify-center"
          style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}`, borderRadius }}
        >
          <div className="w-48 h-48 bg-gray-100 flex items-center justify-center" style={{ borderRadius }}>
            <QrCode className="w-20 h-20 text-gray-300" />
          </div>
        </div>
      )}

      {/* PIX Code + Button */}
      <div
        className="p-5"
        style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}`, borderRadius }}
      >
        <p className="text-xs mb-3" style={{ color: mutedColor }}>
          Copie a chave abaixo e utilize a opção PIX Copia e Cola:
        </p>
        <div className="p-3 mb-3" style={{ backgroundColor: theme?.colors.background || '#f5f7fa', border: `1px solid ${borderColor}`, borderRadius }}>
          <p className="text-[11px] font-mono break-all" style={{ color: mutedColor }}>
            00020126580014br.gov.bcb.pix0136exemplo-pix-code...
          </p>
        </div>

        <button
          className="w-full font-bold py-3.5 text-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: effectiveCopyBtnBg, color: effectiveCopyBtnText, borderRadius }}
        >
          <Copy className="w-4 h-4" />
          {copyButtonText}
        </button>

        <div
          className="mt-4 flex justify-between items-center px-4 py-3"
          style={{ backgroundColor: effectiveValueBg, border: `1px solid ${effectiveValueColor}30`, borderRadius }}
        >
          <span className="text-xs" style={{ color: mutedColor }}>{valueLabelText}</span>
          <span className="font-bold text-lg" style={{ color: effectiveValueColor }}>R$ 58,90</span>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div
          className="p-5"
          style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}`, borderRadius }}
        >
          <h3 className="font-semibold text-sm mb-4" style={{ color: textColor }}>{instructionTitle}</h3>
          <div className="space-y-4">
            {(instructions as string[]).map((text: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${effectiveInstrNumColor}20` }}
                >
                  <span className="text-xs font-bold" style={{ color: effectiveInstrNumColor }}>{i + 1}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: effectiveInstrTextColor }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase details */}
      {showPurchaseDetails && (
        <div
          className="p-5"
          style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}`, borderRadius }}
        >
          <h3 className="font-semibold text-sm mb-3" style={{ color: textColor }}>{purchaseDetailsTitle}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: mutedColor }}>Nome:</span>
              <span className="text-sm font-medium" style={{ color: textColor }}>João Silva</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: mutedColor }}>Valor:</span>
              <span className="text-sm font-bold" style={{ color: effectiveValueColor }}>R$ 58,90</span>
            </div>
          </div>
        </div>
      )}

      {/* Help link */}
      {showHelpLink && (
        <div className="flex items-center justify-center gap-1.5 text-[10px] pb-2" style={{ color: mutedColor }}>
          <span>{helpLinkText}</span>
        </div>
      )}
    </div>
  );
};

export default PixPageElement;
