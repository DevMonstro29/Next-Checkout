import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import {
  Copy,
  Check,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import { CheckoutTheme } from "@/types/checkout";

interface PixPaymentData {
  transaction_id: string;
  pix_code: string;
  pix_qr_code: string;
  amount: string;
  status: string;
  expires_at: string;
}

interface PixPageCustomProps {
  headerTitle?: string;
  headerSubtitle?: string;
  copyButtonText?: string;
  copiedButtonText?: string;
  valueLabelText?: string;
  securityMessage?: string;
  showInstructions?: boolean;
  instructionTitle?: string;
  instructions?: string[];
  showPurchaseDetails?: boolean;
  purchaseDetailsTitle?: string;
  showHelpLink?: boolean;
  helpLinkText?: string;
  confirmedTitle?: string;
  confirmedSubtitle?: string;
  showQrCode?: boolean;
  headerLogoUrl?: string;
  headerLogoSize?: string;
  timerDisplayMinutes?: number;
  timerCenter?: boolean;
  // Custom colors
  headerIconColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  timerColor?: string;
  timerBgColor?: string;
  timerBorderColor?: string;
  timerBorderRadius?: string;
  timerLabel?: string;
  showTimerIcon?: boolean;
  copyButtonBgColor?: string;
  copyButtonTextColor?: string;
  valueColor?: string;
  valueBgColor?: string;
  instructionNumberColor?: string;
  instructionTextColor?: string;
  cardBgColor?: string;
  cardBorderColor?: string;
}

export interface RedirectParamsConfig {
  appendCpf: boolean;
  appendNome: boolean;
  appendEmail: boolean;
  appendTelefone: boolean;
  paramCpf: string;
  paramNome: string;
  paramEmail: string;
  paramTelefone: string;
}

interface PixPaymentProps {
  paymentData: PixPaymentData;
  customerName: string;
  customerData?: { name: string; email: string; cpf: string; phone: string } | null;
  redirectUrl?: string;
  redirectParamsConfig?: RedirectParamsConfig;
  theme?: CheckoutTheme;
  pixPageProps?: PixPageCustomProps;
}

const PixPayment = ({
  paymentData,
  customerName,
  customerData,
  redirectUrl,
  redirectParamsConfig,
  theme,
  pixPageProps,
}: PixPaymentProps) => {
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(paymentData.status);
  const [countdown, setCountdown] = useState(5);

  // Defaults
  const p = pixPageProps || {};
  const headerTitle = p.headerTitle || "Falta pouco!";
  const headerSubtitle = p.headerSubtitle || "Para finalizar a compra, efetue o pagamento com PIX!";
  const copyButtonText = p.copyButtonText || "COPIAR CÓDIGO";
  const copiedButtonText = p.copiedButtonText || "CÓDIGO COPIADO!";
  const valueLabelText = p.valueLabelText || "Valor a ser pago:";
  const securityMessage = p.securityMessage || "Os bancos reforçaram a segurança do Pix e podem exibir alertas preventivas durante o pagamento. Fique tranquilo — sua transação é segura.";
  const showInstructions = p.showInstructions ?? true;
  const instructionTitle = p.instructionTitle || "Instruções para pagamento";
  const instructions = p.instructions || [
    "Após copiar o código, abra seu aplicativo de pagamento onde você utiliza o Pix.",
    "Escolha a opção PIX Copia e Cola e insira o código copiado.",
    "Confirme as informações e finalize sua compra.",
  ];
  const showPurchaseDetails = p.showPurchaseDetails ?? true;
  const purchaseDetailsTitle = p.purchaseDetailsTitle || "Detalhes da compra:";
  const showHelpLink = p.showHelpLink ?? true;
  const helpLinkText = p.helpLinkText || "Caso tenha dúvida, clique aqui para ver o tutorial";
  const confirmedTitle = p.confirmedTitle || "Pagamento Confirmado!";
  const confirmedSubtitle = p.confirmedSubtitle || "Seu pagamento foi recebido com sucesso. Obrigado!";
  const showQrCode = p.showQrCode ?? true;
  const headerLogoUrl = p.headerLogoUrl || "";
  const headerLogoSize = p.headerLogoSize || "56px";
  const timerDisplayMinutes = typeof p.timerDisplayMinutes === "number" && p.timerDisplayMinutes > 0 ? p.timerDisplayMinutes : null;
  const timerCenter = p.timerCenter !== false;

  // Theme colors
  const primaryColor = theme?.colors.primary || "#22c55e";
  const primaryTextColor = theme?.colors.primaryText || "#ffffff";
  const bgColor = theme?.colors.background || "#f5f7fa";
  const borderRadius = theme?.borderRadius || "16px";

  // Custom colors with fallbacks
  const cardColor = p.cardBgColor || theme?.colors.card || "#ffffff";
  const borderColor = p.cardBorderColor || theme?.colors.border || "#e5e7eb";
  const textColor = p.titleColor || theme?.colors.text || "#1a1a2e";
  const mutedColor = p.subtitleColor || theme?.colors.textMuted || "#6b7280";

  const effectiveIconColor = p.headerIconColor || primaryColor;
  const effectiveTimerColor = p.timerColor || primaryColor;
  const effectiveTimerBg = p.timerBgColor || `${primaryColor}15`;
  const effectiveTimerBorder = p.timerBorderColor || `${effectiveTimerColor}30`;
  const effectiveTimerRadius = p.timerBorderRadius || "12px";
  const timerLabel = p.timerLabel ?? "Sua oferta termina em:";
  const showTimerIcon = p.showTimerIcon ?? true;
  const timerOpacity = typeof p.timerOpacity === 'number' ? p.timerOpacity : undefined;
  const effectiveCopyBtnBg = p.copyButtonBgColor || primaryColor;
  const effectiveCopyBtnText = p.copyButtonTextColor || primaryTextColor;
  const effectiveValueColor = p.valueColor || primaryColor;
  const effectiveValueBg = p.valueBgColor || `${primaryColor}15`;
  const effectiveInstrNumColor = p.instructionNumberColor || primaryColor;
  const effectiveInstrTextColor = p.instructionTextColor || theme?.colors.textMuted || "#6b7280";

  // Poll para status (intervalo maior pois webhook atualiza o banco; payment-status prioriza DB)
  useEffect(() => {
    if (paymentStatus === "paid" || paymentStatus === "expired" || paymentStatus === "cancelled") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(apiUrl(`/api/payment-status/${paymentData.transaction_id}`));
        const result = await response.json();
        if (result?.success && result.data?.status) {
          setPaymentStatus(result.data.status);
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [paymentData.transaction_id, paymentStatus]);

  // Build redirect URL with customer params if configured
  const getRedirectUrlWithParams = (): string => {
    if (!redirectUrl) return "";
    const cfg = redirectParamsConfig;
    const data = customerData;
    if (!cfg || !data) return redirectUrl;
    try {
      const [base, existingQuery] = redirectUrl.split("?");
      const params = new URLSearchParams(existingQuery || "");
      if (cfg.appendCpf && data.cpf) params.set(cfg.paramCpf, data.cpf);
      if (cfg.appendNome && data.name) params.set(cfg.paramNome, data.name);
      if (cfg.appendEmail && data.email) params.set(cfg.paramEmail, data.email);
      if (cfg.appendTelefone && data.phone) params.set(cfg.paramTelefone, data.phone);
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    } catch {
      return redirectUrl;
    }
  };

  // Redirect after confirmed
  useEffect(() => {
    if (paymentStatus !== "paid" || !redirectUrl) return;
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = getRedirectUrlWithParams();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStatus, redirectUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(paymentData.pix_code);
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2500);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const expiresAt = new Date(paymentData.expires_at).getTime();
  const now = Date.now();
  let secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
  if (timerDisplayMinutes != null) {
    const maxSeconds = timerDisplayMinutes * 60;
    secondsLeft = Math.min(secondsLeft, maxSeconds);
  }

  if (paymentStatus === "paid") {
    return (
      <div className="space-y-5 slide-up">
        <div
          className="p-8 text-center"
          style={{ backgroundColor: cardColor, border: `1px solid ${effectiveIconColor}30`, borderRadius }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${effectiveIconColor}20` }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: effectiveIconColor }} />
          </div>
          <h2 className="font-bold text-xl mb-2" style={{ color: textColor }}>{confirmedTitle}</h2>
          <p className="text-sm" style={{ color: mutedColor }}>{confirmedSubtitle}</p>
          {redirectUrl && (
            <p className="text-xs mt-3" style={{ color: mutedColor }}>
              Redirecionando em {countdown} segundos...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 slide-up">
      {/* Header message */}
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
            backgroundColor: headerLogoUrl ? "transparent" : `${effectiveIconColor}20`,
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
        {secondsLeft > 0 && (
          <div className={timerCenter ? "mt-4 flex justify-center" : "mt-4"}>
            <CountdownTimer
              initialSeconds={secondsLeft}
              timerColor={effectiveTimerColor}
              timerBgColor={effectiveTimerBg}
              timerBorderColor={effectiveTimerBorder}
              timerBorderRadius={effectiveTimerRadius}
              timerLabel={timerLabel}
              showTimerIcon={showTimerIcon}
              timerOpacity={timerOpacity}
            />
          </div>
        )}
      </div>

      {/* QR Code */}
      {showQrCode && paymentData.pix_qr_code && (
        <div
          className="p-5 flex justify-center"
          style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}`, borderRadius }}
        >
          <img src={paymentData.pix_qr_code} alt="QR Code PIX" className="w-48 h-48 rounded-xl" />
        </div>
      )}

      {/* PIX Code */}
      <div
        className="p-5"
        style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}`, borderRadius }}
      >
        <p className="text-xs mb-3" style={{ color: mutedColor }}>
          Copie a chave abaixo e utilize a opção PIX Copia e Cola:
        </p>
        <div className="p-3 mb-3" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}`, borderRadius }}>
          <p className="text-[11px] font-mono break-all leading-relaxed line-clamp-2" style={{ color: mutedColor }}>
            {paymentData.pix_code}
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="w-full font-bold py-3.5 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={
            copied
              ? { backgroundColor: `${effectiveCopyBtnBg}20`, color: effectiveCopyBtnBg, border: `1px solid ${effectiveCopyBtnBg}30`, borderRadius }
              : { backgroundColor: effectiveCopyBtnBg, color: effectiveCopyBtnText, borderRadius }
          }
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              {copiedButtonText}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {copyButtonText}
            </>
          )}
        </button>

        <div
          className="mt-4 flex justify-between items-center px-4 py-3"
          style={{ backgroundColor: effectiveValueBg, border: `1px solid ${effectiveValueColor}20`, borderRadius }}
        >
          <span className="text-xs" style={{ color: mutedColor }}>{valueLabelText}</span>
          <span className="font-bold text-lg" style={{ color: effectiveValueColor }}>R$ {paymentData.amount}</span>
        </div>

        {securityMessage && (
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: mutedColor }}>
            {securityMessage}
          </p>
        )}
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div
          className="p-5"
          style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}`, borderRadius }}
        >
          <h3 className="font-semibold text-sm mb-4" style={{ color: textColor }}>{instructionTitle}</h3>
          <div className="space-y-4">
            {instructions.map((text: string, i: number) => (
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
              <span className="text-sm font-medium" style={{ color: textColor }}>{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: mutedColor }}>Valor:</span>
              <span className="text-sm font-bold" style={{ color: effectiveValueColor }}>R$ {paymentData.amount}</span>
            </div>
          </div>
        </div>
      )}

      {showHelpLink && (
        <div className="flex items-center justify-center gap-1.5 text-[10px] pb-6" style={{ color: mutedColor }}>
          <HelpCircle className="w-3 h-3" />
          <span>{helpLinkText}</span>
        </div>
      )}
    </div>
  );
};

export default PixPayment;
