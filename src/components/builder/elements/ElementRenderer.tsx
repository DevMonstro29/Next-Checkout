import { createContext, useContext } from 'react';
import { CheckoutElement, CheckoutTheme, CheckoutProduct } from '@/types/checkout';
import HeaderElement from './HeaderElement';
import BannerElement from './BannerElement';
import TextElement from './TextElement';
import ImageElement from './ImageElement';
import FormElement from './FormElement';
import AddressElement from './AddressElement';
import CartSummaryElement from './CartSummaryElement';
import PaymentElement from './PaymentElement';
import TimerElement from './TimerElement';
import ButtonElement from './ButtonElement';
import DividerElement from './DividerElement';
import SpacerElement from './SpacerElement';
import TestimonialElement from './TestimonialElement';
import SecurityBadgeElement from './SecurityBadgeElement';
import PaymentMethodsElement from './PaymentMethodsElement';
import StepIndicatorElement from './StepIndicatorElement';
import OrderBumpElement from './OrderBumpElement';
import PixPageElement from './PixPageElement';

// Context to pass theme/products/settings from parent without needing BuilderContext
interface RenderContextType {
  theme?: CheckoutTheme;
  products?: CheckoutProduct[];
  checkoutSteps?: number;
}

export const RenderContext = createContext<RenderContextType>({});

interface ElementRendererProps {
  element: CheckoutElement;
  isBuilder?: boolean;
  theme?: CheckoutTheme;
  products?: CheckoutProduct[];
  onFormSubmit?: (data: any) => void;
  isSubmitting?: boolean;
  /** Quando true, elementos com card (form, cart_summary, payment, order_bump) não aplicam o wrapper de card */
  compact?: boolean;
}

const ElementRenderer = ({
  element,
  isBuilder = false,
  theme,
  products,
  onFormSubmit,
  isSubmitting,
  compact = false,
}: ElementRendererProps) => {
  // Use provided props or fallback to context
  const ctx = useContext(RenderContext);
  const resolvedTheme = theme || ctx.theme;
  const resolvedProducts = products || ctx.products || [];

  if (!element.visible && !isBuilder) return null;

  // If element has a custom borderRadius in styles, override theme's borderRadius for this element
  const elementBorderRadius = element.styles.borderRadius;
  const themeWithRadius = (resolvedTheme && elementBorderRadius)
    ? { ...resolvedTheme, borderRadius: elementBorderRadius }
    : resolvedTheme;

  // Check if element should be full-width (break out of container padding)
  const isFullWidth =
    (element.type === 'banner' || element.type === 'image') &&
    element.props.fullWidth === true;

  const hasFontSizeOverride = !!(element.styles?.fontSize);
  const customStyles: React.CSSProperties = {
    paddingTop: element.styles.paddingTop,
    paddingBottom: element.styles.paddingBottom,
    paddingLeft: element.styles.paddingLeft,
    paddingRight: element.styles.paddingRight,
    marginTop: element.styles.marginTop,
    marginBottom: element.styles.marginBottom,
    backgroundColor: element.styles.backgroundColor,
    borderRadius: element.styles.borderRadius,
    overflow: element.styles.borderRadius ? 'hidden' : undefined,
    fontSize: element.styles.fontSize,
    fontFamily: element.styles.fontFamily,
    ...(isFullWidth
      ? {
          marginLeft: '-1rem',
          marginRight: '-1rem',
          width: 'calc(100% + 2rem)',
          maxWidth: 'none',
          borderRadius: '0',
          overflow: 'hidden',
        }
      : {}),
  };

  const renderElement = () => {
    switch (element.type) {
      case 'header':
        return <HeaderElement props={element.props} theme={themeWithRadius} />;
      case 'banner':
        return <BannerElement props={element.props} theme={themeWithRadius} />;
      case 'text':
        return <TextElement props={element.props} theme={themeWithRadius} />;
      case 'image':
        return <ImageElement props={element.props} theme={themeWithRadius} />;
      case 'form':
        return <FormElement props={element.props} theme={themeWithRadius} isBuilder={isBuilder} compact={compact} />;
      case 'address':
        return <AddressElement props={element.props} theme={themeWithRadius} isBuilder={isBuilder} compact={compact} />;
      case 'cart_summary':
        return <CartSummaryElement props={element.props} theme={themeWithRadius} products={resolvedProducts} compact={compact} />;
      case 'payment':
        return <PaymentElement props={element.props} theme={themeWithRadius} compact={compact} />;
      case 'timer':
        return <TimerElement props={element.props} theme={themeWithRadius} isBuilder={isBuilder} />;
      case 'button':
        return (
          <ButtonElement
            props={element.props}
            theme={themeWithRadius}
            isBuilder={isBuilder}
            onSubmit={onFormSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case 'divider':
        return <DividerElement props={element.props} theme={themeWithRadius} />;
      case 'spacer':
        return <SpacerElement props={element.props} />;
      case 'testimonial':
        return <TestimonialElement props={element.props} theme={themeWithRadius} />;
      case 'security_badge':
        return <SecurityBadgeElement props={element.props} theme={themeWithRadius} isBuilder={isBuilder} />;
      case 'payment_methods':
        return <PaymentMethodsElement props={element.props} theme={themeWithRadius} />;
      case 'step_indicator':
        return <StepIndicatorElement props={element.props} theme={themeWithRadius} totalSteps={ctx.checkoutSteps || 3} />;
      case 'order_bump':
        return <OrderBumpElement props={element.props} theme={themeWithRadius} isBuilder={isBuilder} compact={compact} />;
      case 'pix_page':
        return <PixPageElement props={element.props} theme={themeWithRadius} />;
      default:
        return <div className="p-4 bg-red-100 text-red-600 rounded-lg text-sm">Elemento desconhecido: {element.type}</div>;
    }
  };

  return (
    <div
      style={customStyles}
      className={hasFontSizeOverride ? 'element-font-size-override' : undefined}
    >
      {renderElement()}
    </div>
  );
};

export default ElementRenderer;
