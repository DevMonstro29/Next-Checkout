import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

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
  const bgColor = timerBgColor || `${color}20`;
  const borderColor = timerBorderColor || `${color}30`;
  const radius = timerBorderRadius || "12px";
  const opacity = typeof timerOpacity === 'number' ? Math.max(0, Math.min(1, timerOpacity)) : 1;

  return (
    <div
      className="timer-pulse flex items-center gap-2 px-4 py-2.5"
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: radius,
        opacity,
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
