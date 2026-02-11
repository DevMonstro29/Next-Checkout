import { Check } from 'lucide-react';
import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  currentStep?: number;
  totalSteps?: number;
}

const StepIndicatorElement = ({ props, theme, currentStep = 1, totalSteps = 3 }: Props) => {
  const {
    step1Label = 'Identificação',
    step2Label = 'Endereço',
    step3Label = 'Pagamento',
    activeColor = '',
    completedColor = '',
    inactiveColor = '',
    labelColor = '',
    circleSize = '32px',
    fontSize = '11px',
    connectorWidth = '48px',
    showConnectors = true,
  } = props;

  const primaryColor = activeColor || theme?.colors.primary || '#22c55e';
  const completedBg = completedColor || primaryColor;
  const inactiveBg = inactiveColor || theme?.colors.border || '#e5e7eb';
  const primaryText = theme?.colors.primaryText || '#ffffff';
  const textMuted = theme?.colors.textMuted || '#6b7280';
  const textColor = theme?.colors.text || '#1a1a2e';

  const allLabels = totalSteps === 2
    ? [step1Label || 'Dados e Endereço', step3Label || 'Pagamento']
    : [step1Label, step2Label, step3Label].slice(0, totalSteps);
  const circleSizePx = parseInt(circleSize) || 32;

  return (
    <div className="flex items-center justify-center gap-0 py-4 px-2">
      {allLabels.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        const activeLabelColor = labelColor || primaryColor;

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="rounded-full flex items-center justify-center font-bold transition-all duration-300"
                style={{
                  width: `${circleSizePx}px`,
                  height: `${circleSizePx}px`,
                  fontSize: `${Math.max(circleSizePx * 0.375, 10)}px`,
                  backgroundColor: isActive
                    ? primaryColor
                    : isCompleted
                    ? completedBg
                    : inactiveBg,
                  color: isActive || isCompleted ? primaryText : textMuted,
                }}
              >
                {isCompleted ? <Check style={{ width: `${circleSizePx * 0.5}px`, height: `${circleSizePx * 0.5}px` }} /> : stepNum}
              </div>
              <span
                className="font-medium mt-1.5 whitespace-nowrap"
                style={{
                  fontSize,
                  color: isActive
                    ? activeLabelColor
                    : isCompleted
                    ? textColor
                    : textMuted,
                }}
              >
                {label}
              </span>
            </div>

            {showConnectors && i < totalSteps - 1 && (
              <div
                className="h-0.5 mx-2 transition-all duration-300"
                style={{
                  width: connectorWidth,
                  marginTop: `-${circleSizePx * 0.5}px`,
                  backgroundColor: stepNum < currentStep ? primaryColor : inactiveBg,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicatorElement;
