import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizeHandleProps {
  side: 'left' | 'right';
  currentWidth: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number) => void;
}

const ResizeHandle = ({ side, currentWidth, minWidth, maxWidth, onResize }: ResizeHandleProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  }, [currentWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = side === 'left'
        ? startWidthRef.current + delta
        : startWidthRef.current - delta;

      const clamped = Math.min(maxWidth, Math.max(minWidth, newWidth));
      onResize(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, side, minWidth, maxWidth, onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`w-1.5 flex-shrink-0 cursor-col-resize group relative z-20 transition-colors ${
        isDragging ? 'bg-brand-500/40' : 'bg-transparent hover:bg-brand-500/20'
      }`}
    >
      {/* Visual indicator line */}
      <div
        className={`absolute inset-y-0 w-px transition-colors ${
          side === 'left' ? 'left-0' : 'right-0'
        } ${isDragging ? 'bg-brand-500' : 'bg-neutral-200 dark:bg-neutral-700 group-hover:bg-brand-500/50'}`}
      />
    </div>
  );
};

export default ResizeHandle;
