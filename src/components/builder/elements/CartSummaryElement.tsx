import { useState } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { CheckoutTheme, CheckoutProduct } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
  products?: CheckoutProduct[];
}

interface SelectedBumpInfo {
  id: string;
  name: string;
  price_cents: number;
}

interface CartSummaryContext {
  selectedShippingCents?: number;
  selectedShippingName?: string;
  selectedBumpsCents?: number;
  selectedBumpItems?: SelectedBumpInfo[];
  quantity?: number;
  onQuantityChange?: (q: number) => void;
}

// displayMode: 'open' = sempre aberto | 'collapsible' = abrir/fechar | 'collapsible_closed' = abrir/fechar (inicia fechado) | 'closed' = sempre fechado
const CartSummaryElement = ({ props, theme, products = [], shippingContext, compact }: Props & { shippingContext?: CartSummaryContext; compact?: boolean }) => {
  const {
    showTitle = false,
    title = 'Seu carrinho',
    showProductName = true,
    showProductImage = false,
    productImageUrl = '',
    showProductDescription = false,
    showQuantity = true,
    quantityLabel = '1 un.',
    showQuantitySelector = false,
    subtotalLabel = 'Subtotal',
    totalLabel = 'Total',
    totalColor = '',
    showShipping = true,
    shippingLabel = 'Frete',
    closedText = '',
    showHeaderWhenOpen = true,
    // Custom colors
    cardBgColor = '',
    cardBorderColor = '',
    titleColor = '',
    productTextColor = '',
    labelColor = '',
    valueTextColor = '',
    // Layout personalizado (logo + título 3 linhas + linhas customizáveis)
    customLayout = false,
    headerLogoUrl = '',
    headerLogoSize = '48px',
    headerLine1 = 'Dívida',
    headerLine2 = 'Negativada',
    headerLine3 = 'em seu CPF',
    headerTextColor = '',
    subtotalValueColor = '',
    shippingValueColor = '',
    totalValueColor = '',
    showDiscountRow = false,
    discountLabel = 'Desconto de',
    discountValueColor = '',
    customSubtotalValue = '',
    customDiscountValue = '',
    // Backwards compat: old collapsible/defaultOpen -> new displayMode
    displayMode: rawDisplayMode,
    collapsible: legacyCollapsible,
    defaultOpen: legacyDefaultOpen,
  } = props;

  // Resolve displayMode from legacy props or new prop
  const displayMode: string = rawDisplayMode
    || (legacyCollapsible ? (legacyDefaultOpen === false ? 'collapsible_closed' : 'collapsible') : 'open');

  const hasHeader = displayMode !== 'open'; // all modes except 'open' show the compact header
  const canToggle = displayMode === 'collapsible' || displayMode === 'collapsible_closed';
  const startsOpen = displayMode === 'open' || displayMode === 'collapsible';

  const [isOpen, setIsOpen] = useState<boolean>(startsOpen);
  const [localQuantity, setLocalQuantity] = useState(1);

  const cardBg = cardBgColor || theme?.colors.card || '#ffffff';
  const borderColor = cardBorderColor || theme?.colors.border || '#e5e7eb';
  const textColor = titleColor || theme?.colors.text || '#1a1a2e';
  const productText = productTextColor || theme?.colors.text || '#1a1a2e';
  const mutedColor = labelColor || theme?.colors.textMuted || '#6b7280';
  const valueText = valueTextColor || theme?.colors.text || '#1a1a2e';
  const primaryColor = theme?.colors.primary || '#22c55e';
  const radius = theme?.borderRadius || '16px';

  const mainProduct = products.find((p) => !p.is_upsell) || products[0];
  const productName = mainProduct?.name || 'Produto';
  const productDescription = mainProduct?.description || '';
  const unitAmountCents = mainProduct?.amount_cents || 0;
  const isPhysical = mainProduct?.product_type === 'physical';
  // Use external quantity if provided, otherwise local state
  const quantity = shippingContext?.onQuantityChange ? (shippingContext?.quantity ?? 1) : localQuantity;
  const handleQuantityChange = (q: number) => {
    const newQ = Math.max(1, q);
    if (shippingContext?.onQuantityChange) {
      shippingContext.onQuantityChange(newQ);
    } else {
      setLocalQuantity(newQ);
    }
  };
  const amountCents = unitAmountCents * quantity;
  const originalAmountCents = (mainProduct as CheckoutProduct & { original_amount_cents?: number })?.original_amount_cents;
  const originalTotalCents = originalAmountCents != null ? originalAmountCents * quantity : 0;
  const discountCents = originalTotalCents > amountCents ? originalTotalCents - amountCents : 0;
  const discountPercent = originalTotalCents > 0 && discountCents > 0
    ? ((discountCents / originalTotalCents) * 100).toFixed(2).replace('.', ',')
    : '0';
  const shippingCents = shippingContext?.selectedShippingCents ?? 0;
  const hasShippingSelected = shippingContext !== undefined && shippingCents >= 0 && shippingContext.selectedShippingName;
  const bumpsCents = shippingContext?.selectedBumpsCents ?? 0;
  const totalCents = amountCents + (isPhysical ? shippingCents : 0) + bumpsCents;
  const formatted = (amountCents / 100).toFixed(2).replace('.', ',');
  const totalFormatted = (totalCents / 100).toFixed(2).replace('.', ',');
  const shippingFormatted = shippingCents === 0 ? 'Grátis' : `R$ ${(shippingCents / 100).toFixed(2).replace('.', ',')}`;
  const bumpsFormatted = (bumpsCents / 100).toFixed(2).replace('.', ',');
  const discountFormatted = (discountCents / 100).toFixed(2).replace('.', ',');
  const effectiveTotalColor = totalColor || primaryColor;
  const headerColor = headerTextColor || textColor;
  const subtotalValColor = subtotalValueColor || valueText;
  const shippingValColor = shippingValueColor || valueText;
  // Cor do valor total: prioriza totalValueColor (layout personalizado) para garantir que a alteração no painel reflita
  const totalValColor = (typeof totalValueColor === 'string' && totalValueColor.trim() !== '') ? totalValueColor.trim() : effectiveTotalColor;
  const discountValColor = discountValueColor || primaryColor;

  const contentVisible = displayMode === 'open' || (canToggle && isOpen);
  // Seta fica inline com o produto quando header está oculto
  const chevronInline = canToggle && isOpen && !showHeaderWhenOpen;

  // Layout personalizado: logo + título em 3 linhas + linhas de valores 100% personalizáveis (exceto valor total = real)
  if (customLayout) {
    const showDiscount = showDiscountRow;
    const subtotalDisplay = customSubtotalValue.trim() !== '' ? customSubtotalValue.trim() : (originalTotalCents > 0 ? (originalTotalCents / 100).toFixed(2).replace('.', ',') : formatted);
    const discountDisplay = customDiscountValue.trim() !== '' ? customDiscountValue.trim() : (discountCents > 0 ? `- ${discountFormatted}` : '- 0,00');
    return (
      <div style={cardStyle}>
        <div className="flex items-start gap-4 px-5 py-4">
          {headerLogoUrl ? (
            <img
              src={headerLogoUrl}
              alt=""
              className="object-contain flex-shrink-0"
              style={{ width: headerLogoSize, height: headerLogoSize, minWidth: headerLogoSize, minHeight: headerLogoSize }}
            />
          ) : null}
          <div className="flex-1 min-w-0 text-right">
            <p className="text-sm font-medium leading-tight" style={{ color: headerColor }}>{headerLine1}</p>
            <p className="text-sm font-medium leading-tight" style={{ color: headerColor }}>{headerLine2}</p>
            <p className="text-sm font-medium leading-tight" style={{ color: headerColor }}>{headerLine3}</p>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${borderColor}` }} />
        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold" style={{ color: mutedColor }}>{subtotalLabel}</span>
            <span className="text-sm font-semibold" style={{ color: subtotalValColor }}>{subtotalDisplay}</span>
          </div>
          {showDiscount && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{ color: discountValColor }}>{discountLabel}</span>
              <span className="text-sm font-medium" style={{ color: discountValColor }}>{discountDisplay}</span>
            </div>
          )}
          {isPhysical && showShipping && (
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: mutedColor }}>{shippingLabel}{hasShippingSelected ? ` (${shippingContext?.selectedShippingName})` : ''}</span>
              <span className="text-sm font-medium" style={{ color: shippingValColor }}>
                {hasShippingSelected ? shippingFormatted : 'Selecione'}
              </span>
            </div>
          )}
          {(shippingContext?.selectedBumpItems || []).map((bump) => (
            <div key={bump.id} className="flex justify-between items-center">
              <span className="text-sm truncate mr-2" style={{ color: mutedColor }}>{bump.name}</span>
              <span className="text-sm font-medium flex-shrink-0" style={{ color: subtotalValColor }}>+ R$ {(bump.price_cents / 100).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          {bumpsCents > 0 && (!shippingContext?.selectedBumpItems || shippingContext.selectedBumpItems.length === 0) && (
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: mutedColor }}>Adicionais</span>
              <span className="text-sm font-medium" style={{ color: subtotalValColor }}>+ R$ {bumpsFormatted}</span>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${borderColor}` }} />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold" style={{ color: textColor }}>{totalLabel}</span>
            <span className="text-sm font-bold" style={{ color: totalValColor }}>R$ {totalFormatted}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {/* Compact header – oculta totalmente quando aberto + showHeaderWhenOpen=false (seta vai pro conteúdo) */}
      {hasHeader && !(canToggle && isOpen && !showHeaderWhenOpen) && (
        <button
          type="button"
          onClick={() => canToggle && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors ${canToggle ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          style={{ backgroundColor: cardBg }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {(!canToggle || !isOpen) && (
              <span className="font-semibold text-sm truncate" style={{ color: textColor }}>
                {displayMode === 'closed' && closedText ? closedText : (title || 'Resumo do pedido')}
              </span>
            )}
            {canToggle && isOpen && showHeaderWhenOpen && (
              <span className="font-semibold text-sm truncate" style={{ color: textColor }}>
                {title || 'Resumo do pedido'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(!canToggle || !isOpen) && (
              <span className="font-bold text-sm" style={{ color: effectiveTotalColor }}>
                R$ {totalFormatted}
              </span>
            )}
            {canToggle && (
              isOpen
                ? <ChevronUp className="w-4 h-4" style={{ color: mutedColor }} />
                : <ChevronDown className="w-4 h-4" style={{ color: mutedColor }} />
            )}
          </div>
        </button>
      )}

      {/* Detail content */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          maxHeight: contentVisible ? '500px' : '0px',
          opacity: contentVisible ? 1 : 0,
          overflow: 'hidden',
        }}
      >
        <div className={`px-5 ${hasHeader && !chevronInline ? 'pb-5 pt-0' : 'py-5'}`}>
          <div className="space-y-3">
            {/* Título opcional (só se modo 'open' e ativado) */}
            {showTitle && !hasHeader && (
              <h3 className="text-base font-semibold mb-1" style={{ color: textColor }}>
                {title}
              </h3>
            )}

            {/* Seta inline: quando header oculto e sem produto visível, mostra apenas a seta clicável */}
            {chevronInline && !showProductName && (
              <div className="flex items-center justify-end">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <ChevronUp className="w-5 h-5" style={{ color: mutedColor }} />
                </div>
              </div>
            )}

            {/* Se só showProductName (sem título) e sem header: nome como título compacto */}
            {showProductName && !showTitle && !hasHeader ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate" style={{ color: productText }}>
                  {productName}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {showQuantitySelector ? (
                    <div className="flex items-center gap-0 rounded-full overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleQuantityChange(quantity - 1); }} className="w-7 h-7 flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: primaryColor }}>
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-semibold w-6 text-center" style={{ color: textColor }}>{quantity}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleQuantityChange(quantity + 1); }} className="w-7 h-7 flex items-center justify-center hover:bg-black/5 transition-colors" style={{ color: primaryColor }}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : showQuantity ? (
                    <span className="text-xs" style={{ color: mutedColor }}>
                      {quantityLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : showProductName ? (
              <>
                <div
                  className={`flex items-center gap-3 ${chevronInline ? 'cursor-pointer hover:opacity-80' : ''}`}
                  onClick={chevronInline ? () => setIsOpen(false) : undefined}
                >
                  {showProductImage && productImageUrl && (
                    <img
                      src={productImageUrl}
                      alt={productName}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: productText }}>
                      {productName}
                    </p>
                    {showProductDescription && productDescription && (
                      <p className="text-xs truncate" style={{ color: mutedColor }}>
                        {productDescription}
                      </p>
                    )}
                    {!showQuantitySelector && showQuantity && (
                      <p className="text-xs" style={{ color: mutedColor }}>
                        {quantityLabel}
                      </p>
                    )}
                  </div>
                  {/* Seletor de quantidade – ao lado direito do nome */}
                  {showQuantitySelector && (
                    <div className="flex items-center gap-0 rounded-full overflow-hidden flex-shrink-0" style={{ border: `1px solid ${borderColor}` }}>
                      {/* Botão de diminuir quantidade em vermelho para destacar ação de redução */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleQuantityChange(quantity - 1); }}
                        className="w-7 h-7 flex items-center justify-center hover:bg-black/5 transition-colors"
                        style={{ color: '#ef4444' }}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-semibold w-6 text-center" style={{ color: textColor }}>{quantity}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleQuantityChange(quantity + 1); }}
                        className="w-7 h-7 flex items-center justify-center hover:bg-black/5 transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {/* Seta inline – centralizada verticalmente com a imagem/nome */}
                  {chevronInline && (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors">
                      <ChevronUp className="w-5 h-5" style={{ color: mutedColor }} />
                    </div>
                  )}
                </div>

                <div style={{ borderTop: `1px solid ${borderColor}` }} />
              </>
            ) : null}

            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: mutedColor }}>
                {subtotalLabel}
              </span>
              <span className="text-sm" style={{ color: valueText }}>
                R$ {formatted}
              </span>
            </div>

            {/* Linha de frete (apenas para produtos físicos) */}
            {isPhysical && showShipping && (
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: mutedColor }}>
                  {shippingLabel}{hasShippingSelected ? ` (${shippingContext.selectedShippingName})` : ''}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: hasShippingSelected ? (shippingCents === 0 ? primaryColor : valueText) : mutedColor }}
                >
                  {hasShippingSelected ? shippingFormatted : 'Selecione'}
                </span>
              </div>
            )}

            {/* Linhas de order bumps selecionados */}
            {(shippingContext?.selectedBumpItems || []).map((bump) => (
              <div key={bump.id} className="flex justify-between items-center">
                <span className="text-sm truncate mr-2" style={{ color: mutedColor }}>
                  {bump.name}
                </span>
                <span className="text-sm font-medium flex-shrink-0" style={{ color: valueText }}>
                  + R$ {(bump.price_cents / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
            {/* Fallback: se não tem lista detalhada mas tem valor, mostra genérico */}
            {bumpsCents > 0 && (!shippingContext?.selectedBumpItems || shippingContext.selectedBumpItems.length === 0) && (
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: mutedColor }}>
                  Adicionais
                </span>
                <span className="text-sm font-medium" style={{ color: valueText }}>
                  + R$ {bumpsFormatted}
                </span>
              </div>
            )}

            <div style={{ borderTop: `1px solid ${borderColor}` }} />

            <div className="flex justify-between items-center">
              <span className="font-semibold" style={{ color: textColor }}>
                {totalLabel}
              </span>
              <span className="font-bold text-lg" style={{ color: effectiveTotalColor }}>
                R$ {totalFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummaryElement;
