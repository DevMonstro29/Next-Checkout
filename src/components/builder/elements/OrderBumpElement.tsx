import { useState, useRef } from 'react';
import { Gift, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { CheckoutTheme, OrderBumpItem } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  isBuilder?: boolean;
  selectedBumps?: string[];
  onToggleBump?: (id: string) => void;
  compact?: boolean;
}

const OrderBumpElement = ({ props, theme, isBuilder = false, selectedBumps = [], onToggleBump, compact }: Props) => {
  const {
    title = 'Adicione ao seu pedido',
    titleIcon = 'gift',
    highlightColor = '#ef4444',
    highlightText = 'OFERTA ESPECIAL',
    showHighlight = true,
    checkboxColor = '',
    displayStyle = 'block', // 'block' | 'carousel'
    items = [],
    // Custom colors
    cardBgColor = '',
    cardBorderColor = '',
    nameColor = '',
    descriptionColor = '',
    priceColor = '',
  } = props;

  // Builder-only local state for preview
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const selected = isBuilder ? localSelected : selectedBumps;
  const toggleBump = (id: string) => {
    if (isBuilder) {
      setLocalSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    } else {
      onToggleBump?.(id);
    }
  };

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const cardBg = cardBgColor || theme?.colors.card || '#ffffff';
  const borderColor = cardBorderColor || theme?.colors.border || '#e5e7eb';
  const textColor = nameColor || theme?.colors.text || '#1a1a2e';
  const mutedColor = descriptionColor || theme?.colors.textMuted || '#6b7280';
  const effectivePriceColor = priceColor || checkboxColor || theme?.colors.primary || '#22c55e';
  const primaryColor = checkboxColor || theme?.colors.primary || '#22c55e';
  const radius = theme?.borderRadius || '16px';

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  if (items.length === 0) {
    return (
      <div
        className="p-5 text-center text-sm"
        style={{
          backgroundColor: cardBg,
          border: `1px dashed ${borderColor}`,
          borderRadius: radius,
          color: mutedColor,
        }}
      >
        Nenhum order bump configurado. Adicione itens nas propriedades.
      </div>
    );
  }

  const typedItems = items as OrderBumpItem[];

  const renderBumpCard = (item: OrderBumpItem) => {
    const isSelected = selected.includes(item.id);
    const activeBorder = isSelected ? primaryColor : borderColor;
    const hasDiscount = item.originalPrice_cents > 0 && item.originalPrice_cents > item.price_cents;

    return (
      <div
        key={item.id}
        className="relative overflow-hidden transition-all cursor-pointer"
        style={{
          backgroundColor: cardBg,
          border: `2px solid ${activeBorder}`,
          borderRadius: radius,
        }}
        onClick={() => toggleBump(item.id)}
      >
        {/* Highlight strip */}
        {showHighlight && (
          <div
            className="px-3 py-1.5 text-center"
            style={{ backgroundColor: highlightColor }}
          >
            <span className="text-white text-[11px] font-bold uppercase tracking-wider">
              {highlightText}
            </span>
          </div>
        )}

        <div className="p-4 flex items-start gap-3">
          {/* Checkbox */}
          <div
            className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
            style={{
              border: `2px solid ${isSelected ? primaryColor : borderColor}`,
              backgroundColor: isSelected ? primaryColor : 'transparent',
            }}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>

          {/* Image */}
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: textColor }}>
                  {item.name}
                </p>
                {item.description && (
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: mutedColor }}>
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                {hasDiscount && (
                  <span className="text-xs line-through" style={{ color: mutedColor }}>
                    {formatPrice(item.originalPrice_cents)}
                  </span>
                )}
                <span className="text-sm font-bold" style={{ color: effectivePriceColor }}>
                  {item.price_cents === 0 ? 'Grátis' : formatPrice(item.price_cents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ====== BLOCK MODE (stacked) ======
  if (displayStyle === 'block') {
    return (
      <div className="space-y-3">
        {typedItems.map(renderBumpCard)}
      </div>
    );
  }

  // ====== CAROUSEL MODE (slides) ======
  const totalSlides = typedItems.length;
  const goToSlide = (idx: number) => {
    if (idx < 0) setCurrentSlide(totalSlides - 1);
    else if (idx >= totalSlides) setCurrentSlide(0);
    else setCurrentSlide(idx);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div className="relative">
      {/* Carousel container */}
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {typedItems.map((item) => (
            <div key={item.id} className="w-full flex-shrink-0 px-1">
              {renderBumpCard(item)}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goToSlide(currentSlide - 1); }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 z-10"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textColor }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goToSlide(currentSlide + 1); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 z-10"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textColor }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {typedItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goToSlide(idx)}
              className="rounded-full transition-all"
              style={{
                width: idx === currentSlide ? '18px' : '6px',
                height: '6px',
                backgroundColor: idx === currentSlide ? primaryColor : borderColor,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderBumpElement;
