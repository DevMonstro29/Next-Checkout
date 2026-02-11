import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { CheckoutTheme } from '@/types/checkout';

const TIMER_BAR_HEIGHT = 52;

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  isBuilder?: boolean;
}

const TimerElement = ({ props, theme, isBuilder = false }: Props) => {
  const {
    minutes = 30,
    backgroundColor = '#ef4444',
    textColor = '#ffffff',
    label = 'Tempo restante para pagamento',
    showIcon = true,
    timerPosition = 'inline',
  } = props;

  const radius = theme?.borderRadius || '12px';
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  // Contagem regressiva só no checkout (não no builder)
  useEffect(() => {
    if (isBuilder) return;
    setSecondsLeft(totalSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBuilder, totalSeconds]);

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const formattedTime = isBuilder ? `${String(minutes).padStart(2, '0')}:00` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // No builder, sticky fica dentro do preview (position: absolute). No checkout, fixo na tela (position: fixed).
  const stickyPosition = isBuilder ? 'absolute' : 'fixed';

  if (timerPosition === 'sticky_top') {
    return (
      <div className="relative w-full" style={{ minHeight: TIMER_BAR_HEIGHT }}>
        <div
          className="p-3 flex items-center justify-center gap-2 w-full box-border left-0 right-0"
          style={{
            position: stickyPosition,
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor,
            borderRadius: isBuilder ? radius : 0,
            minHeight: TIMER_BAR_HEIGHT,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {showIcon && <Clock className="w-4 h-4 flex-shrink-0" style={{ color: textColor }} />}
          <span className="text-sm font-semibold" style={{ color: textColor }}>
            {label}: {formattedTime}
          </span>
        </div>
        <div aria-hidden="true" style={{ height: TIMER_BAR_HEIGHT, width: '100%' }} />
      </div>
    );
  }

  if (timerPosition === 'sticky_bottom') {
    return (
      <div className="relative w-full" style={{ minHeight: TIMER_BAR_HEIGHT }}>
        <div
          className="p-3 flex items-center justify-center gap-2 w-full box-border"
          style={{
            position: stickyPosition,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor,
            borderRadius: isBuilder ? radius : 0,
            minHeight: TIMER_BAR_HEIGHT,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {showIcon && <Clock className="w-4 h-4 flex-shrink-0" style={{ color: textColor }} />}
          <span className="text-sm font-semibold" style={{ color: textColor }}>
            {label}: {formattedTime}
          </span>
        </div>
        <div aria-hidden="true" style={{ height: TIMER_BAR_HEIGHT, width: '100%' }} />
      </div>
    );
  }

  return (
    <div
      className="p-3 flex items-center justify-center gap-2"
      style={{ backgroundColor, borderRadius: radius }}
    >
      {showIcon && <Clock className="w-4 h-4" style={{ color: textColor }} />}
      <span className="text-sm font-semibold" style={{ color: textColor }}>
        {label}: {formattedTime}
      </span>
    </div>
  );
};

export default TimerElement;
