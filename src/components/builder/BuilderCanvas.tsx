import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilder } from '@/contexts/BuilderContext';
import { CheckoutElement, CheckoutTheme } from '@/types/checkout';
import ElementRenderer, { RenderContext } from './elements/ElementRenderer';
import TimerElement from './elements/TimerElement';
import Step2AddressPreview from './Step2AddressPreview';
import { GripVertical, Eye, EyeOff, Trash2, MapPin, User, CreditCard } from 'lucide-react';

const STICKY_TIMER_PLACEHOLDER_HEIGHT = 52;

function SortableElement({ element, theme, placeholderOnly }: { element: CheckoutElement; theme?: CheckoutTheme; placeholderOnly?: boolean }) {
  const { selectedElementId, selectElement, removeElement, toggleElementVisibility } = useBuilder();
  const isSelected = selectedElementId === element.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (placeholderOnly) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, height: STICKY_TIMER_PLACEHOLDER_HEIGHT, minHeight: STICKY_TIMER_PLACEHOLDER_HEIGHT }}
        className={`relative group ${isDragging ? 'z-50 opacity-70' : ''} ${!element.visible ? 'opacity-40' : ''}`}
      >
        <div
          onClick={() => selectElement(element.id)}
          className={`flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 text-xs h-full cursor-pointer transition-all ${
            isSelected ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-900 border-brand-500' : 'hover:border-neutral-400'
          }`}
        >
          Timer (fixo no preview)
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50 opacity-70' : ''} ${
        !element.visible ? 'opacity-40' : ''
      }`}
    >
      {/* Selection/hover border */}
      <div
        onClick={() => selectElement(element.id)}
        className={`relative rounded-lg transition-all cursor-pointer ${
          isSelected
            ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-900'
            : 'hover:ring-1 hover:ring-neutral-400 dark:hover:ring-neutral-500 hover:ring-offset-1 hover:ring-offset-neutral-100 dark:hover:ring-offset-neutral-900'
        }`}
      >
        {/* Toolbar */}
        <div
          className={`absolute -top-8 left-0 right-0 flex items-center justify-between z-10 transition-opacity ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div
            {...attributes}
            {...listeners}
            className="flex items-center gap-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-transparent rounded-md px-1.5 py-0.5 cursor-grab active:cursor-grabbing shadow-sm"
          >
            <GripVertical className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
              {element.type.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); toggleElementVisibility(element.id); }}
              className="p-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-transparent rounded-md text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm"
              title={element.visible ? 'Ocultar' : 'Mostrar'}
            >
              {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeElement(element.id); }}
              className="p-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-transparent rounded-md text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shadow-sm"
              title="Remover"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Element content */}
        <ElementRenderer element={element} isBuilder={true} />
      </div>
    </div>
  );
}

const STEP1_TYPES = new Set(['header', 'step_indicator', 'banner', 'text', 'image', 'form', 'cart_summary', 'testimonial', 'security_badge', 'payment_methods', 'order_bump', 'divider', 'spacer']);
const STEP3_TYPES = new Set(['payment', 'button', 'payment_methods', 'security_badge', 'cart_summary']);

const BuilderCanvas = ({ previewMode = 'mobile' }: { previewMode?: 'desktop' | 'mobile' }) => {
  const { elements, checkout, products, selectElement } = useBuilder();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });
  const [previewStep, setPreviewStep] = useState<1 | 2 | 3>(1);

  const theme = checkout?.theme;
  const checkoutSteps = checkout?.settings?.checkoutSteps || 3;
  const themeMaxWidth = theme?.maxWidth || '448px';
  const mainProduct = products.find((p) => !p.is_upsell) || products[0];
  const isPhysical = mainProduct?.product_type === 'physical';
  const showStepTabs = checkoutSteps === 3 && isPhysical;

  const isMobile = previewMode === 'mobile';
  const canvasMaxWidth = isMobile ? themeMaxWidth : '960px';

  // Filter out pix_page elements - they have their own dedicated tab
  const allElements = [...elements].filter((el) => el.type !== 'pix_page').sort((a, b) => a.order_index - b.order_index);

  const sortedElements =
    showStepTabs && previewStep === 1
      ? allElements.filter((el) => STEP1_TYPES.has(el.type))
      : showStepTabs && previewStep === 3
        ? allElements.filter((el) => STEP3_TYPES.has(el.type))
        : showStepTabs && previewStep === 2
          ? [] // Step 2 uses Step2AddressPreview
          : allElements;

  return (
    <RenderContext.Provider value={{ theme, products, checkoutSteps }}>
      <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-950/50 flex justify-center transition-colors">
        <div
          className="transition-all duration-300 ease-in-out w-full h-full"
          style={{ maxWidth: canvasMaxWidth }}
        >
          {/* Canvas content */}
          <div
            ref={setNodeRef}
            className={`min-h-full transition-all overflow-x-hidden relative ${
              isMobile ? 'px-4 pb-6' : 'px-8 pb-6'
            } pt-10 ${isOver ? 'ring-2 ring-brand-500/40 ring-inset' : ''}`}
            style={{
              backgroundColor: theme?.colors.background || '#f5f7fa',
              fontFamily: theme?.font.family || 'Inter',
            }}
          >
            {theme?.customCSS && (
              <style dangerouslySetInnerHTML={{ __html: theme.customCSS }} />
            )}

            {/* Step tabs (3-step checkout) */}
            {showStepTabs && (
              <div className="flex gap-1 mb-4 p-1 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-xl">
                {[
                  { step: 1 as const, label: 'Identificação', icon: User },
                  { step: 2 as const, label: 'Endereço', icon: MapPin },
                  { step: 3 as const, label: 'Pagamento', icon: CreditCard },
                ].map(({ step, label, icon: Icon }) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setPreviewStep(step)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      previewStep === step
                        ? 'bg-white dark:bg-neutral-700 text-brand-500 dark:text-brand-400 shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Desktop wraps content to theme maxWidth */}
            <div className={!isMobile ? 'mx-auto' : ''} style={!isMobile ? { maxWidth: themeMaxWidth } : {}}>
              {showStepTabs && previewStep === 2 ? (
                <Step2AddressPreview />
              ) : (
              <>
              <SortableContext
                items={sortedElements.map((el) => el.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sortedElements.map((element) => {
                    const isStickyTimer = element.type === 'timer' && (element.props?.timerPosition === 'sticky_top' || element.props?.timerPosition === 'sticky_bottom');
                    return (
                      <SortableElement
                        key={element.id}
                        element={element}
                        theme={theme}
                        placeholderOnly={isStickyTimer}
                      />
                    );
                  })}
                </div>
              </SortableContext>

              {/* Timer fixo: renderizado dentro do preview para não ultrapassar a área */}
              {(() => {
                const stickyTimer = sortedElements.find(
                  (el) => el.type === 'timer' && (el.props?.timerPosition === 'sticky_top' || el.props?.timerPosition === 'sticky_bottom')
                );
                if (!stickyTimer) return null;
                const isTop = stickyTimer.props?.timerPosition === 'sticky_top';
                return (
                  <div
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      [isTop ? 'top' : 'bottom']: 0,
                      zIndex: 9998,
                    }}
                  >
                    <div className="pointer-events-auto cursor-pointer" onClick={() => selectElement(stickyTimer.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && selectElement(stickyTimer.id)}>
                      <TimerElement props={stickyTimer.props} theme={theme} isBuilder={true} />
                    </div>
                  </div>
                );
              })()}

              {sortedElements.length === 0 && (
                <div className="flex items-center justify-center h-96 border-2 border-dashed border-neutral-300 dark:border-neutral-600/50 rounded-xl">
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                    Arraste elementos da paleta para cá
                  </p>
                </div>
              )}
              </>
            )}
            </div>
          </div>
        </div>
      </div>
    </RenderContext.Provider>
  );
};

export default BuilderCanvas;
