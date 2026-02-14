import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { colorWithAlpha } from "@/lib/utils";

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  timerColor?: string;
  timerBgColor?: string;
  timerBorderColor?: string;
  timerBorderRadius?: string;
  timerLabel?: string;
  showTimerIcon?: boolean;
  /** Transparência (0 a 1). 1 = opaco, 0.5 = 50% */
  timerOpacity?: number;
}

const CountdownTimer = ({
  initialSeconds,
  onExpire,
  timerColor,
  timerBgColor,
  timerBorderColor,
  timerBorderRadius,
  timerLabel = "Sua oferta termina em:",
  showTimerIcon = true,
  timerOpacity,
}: CountdownTimerProps) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const endTimeRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Usa Date.now() para funcionar em mobile (setInterval é throttled em abas inativas)
  useEffect(() => {
    if (initialSeconds <= 0) {
      onExpire?.();
      return;
    }
    endTimeRef.current = Date.now() + initialSeconds * 1000;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining <= 0) onExpireRef.current?.();
    };
    update();
    const id = setInterval(update, 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- usa initialSeconds só no mount para evitar reset
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const color = timerColor || "#22c55e";
  const rawBgColor = timerBgColor || `${color}20`;
  const bgAlpha = typeof timerOpacity === 'number' ? Math.max(0, Math.min(1, timerOpacity)) : 1;
  const baseBg = rawBgColor.replace(/^#([0-9a-fA-F]{6})[0-9a-fA-F]{0,2}$/, '#$1') || rawBgColor;
  const bgColor = colorWithAlpha(baseBg, bgAlpha);
  const borderColor = timerBorderColor || `${color}30`;
  const radius = timerBorderRadius || "12px";

  return (
    <div
      className="timer-pulse flex items-center gap-2 px-4 py-2.5"
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: radius,
      }}
    >
      {showTimerIcon && <Clock className="w-4 h-4 flex-shrink-0" style={{ color }} />}
      <span className="font-semibold text-sm" style={{ color }}>
        {timerLabel}{" "}
        <span className="font-bold tabular-nums">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </span>
    </div>
  );
};

export default CountdownTimer;
