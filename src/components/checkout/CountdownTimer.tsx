import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds, onExpire]);

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
