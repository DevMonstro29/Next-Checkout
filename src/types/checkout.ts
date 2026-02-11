// ============================================
// Tipos do Sistema de Checkout Builder
// ============================================

// --- Theme ---
export interface CheckoutThemeColors {
  background: string;
  card: string;
  border: string;
  primary: string;
  primaryText: string;
  text: string;
  textMuted: string;
  timer: string;
  banner: string;
  bannerText: string;
}

export interface CheckoutThemeFont {
  family: string;
  headingWeight: string;
  bodyWeight: string;
}

export interface CheckoutTheme {
  colors: CheckoutThemeColors;
  font: CheckoutThemeFont;
  borderRadius: string;
  maxWidth: string;
  customCSS: string;
}

// --- Settings ---
export interface CheckoutSettings {
  logoUrl: string;
  showSecurityBadge: boolean;
  securityText: string;
  paymentMethods: string[];
  pixExpirationMinutes: number;
  showInstructions: boolean;
  checkoutSteps: 2 | 3;
  /** Enviar UTMs da URL (utmify) ao gerar pagamento */
  utmEnabled?: boolean;
  /** Valores de UTM inseridos pelo usuário (usados quando a URL não tiver o parâmetro) */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  /** Incluir dados do cliente na URL ao redirecionar após pagamento aprovado */
  redirectAppendCpf?: boolean;
  redirectAppendNome?: boolean;
  redirectAppendEmail?: boolean;
  redirectAppendTelefone?: boolean;
  /** Nomes dos parâmetros na URL de redirecionamento (ex: cpf, nome, email, telefone) */
  redirectParamCpf?: string;
  redirectParamNome?: string;
  redirectParamEmail?: string;
  redirectParamTelefone?: string;
}

// --- Element Types ---
export type CheckoutElementType =
  | 'header'
  | 'banner'
  | 'text'
  | 'image'
  | 'form'
  | 'address'
  | 'cart_summary'
  | 'payment'
  | 'timer'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'testimonial'
  | 'security_badge'
  | 'payment_methods'
  | 'step_indicator'
  | 'order_bump'
  | 'pix_page';

// --- Element Props by Type ---
export interface HeaderProps {
  logoUrl: string;
  logoSize: string;
  showSecurityBadge: boolean;
  securityText: string;
  backgroundColor: string;
}

export interface BannerProps {
  text: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
}

export interface TextProps {
  content: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: string;
  fontWeight: string;
  color: string;
}

export interface ImageProps {
  src: string;
  alt: string;
  width: string;
  height: string;
  borderRadius: string;
  objectFit: 'cover' | 'contain' | 'fill';
}

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'cpf' | 'custom';
  placeholder: string;
  required: boolean;
  enabled: boolean;
  icon: string;
  mask?: string;
}

export interface FormProps {
  title: string;
  titleIcon: string;
  fields: FormFieldConfig[];
  showNoEmailCheckbox: boolean;
  noEmailLabel: string;
  /** Cor do checkbox "Não tenho e-mail" (ex: #2957A4) */
  checkboxColor?: string;
  /** Mostrar ícones nos inputs (e-mail, telefone, nome, CPF) */
  showInputIcons?: boolean;
}

export interface AddressProps {
  title: string;
  titleIcon: string;
  cepPlaceholder: string;
  showComplemento: boolean;
  /** Mostrar ícone ao lado do título */
  showTitleIcon?: boolean;
  /** Mostrar ícone de busca no campo CEP */
  showCepSearchIcon?: boolean;
  /** Cor do ícone de busca do CEP (vazio = cor primária do tema) */
  cepSearchIconColor?: string;
  /** Cores personalizadas (vazio = tema) */
  titleColor?: string;
  iconColor?: string;
  labelColor?: string;
  inputTextColor?: string;
  inputBgColor?: string;
  inputBorderColor?: string;
  inputBorderRadius?: string;
  /** Bloco de frete: título exibido */
  shippingBlockTitle?: string;
  /** Bloco de frete: mostrar ícone de caminhão */
  shippingBlockShowIcon?: boolean;
  /** Bloco de frete: cor do ícone (vazio = tema) */
  shippingBlockIconColor?: string;
  /** Bloco de frete: cor da borda da opção selecionada */
  shippingBlockSelectedBorderColor?: string;
  /** Bloco de frete: cor do fundo da opção selecionada */
  shippingBlockSelectedBgColor?: string;
  /** Bloco de frete: cor do texto das opções */
  shippingBlockOptionTextColor?: string;
  /** Bloco de frete: cor do texto secundário */
  shippingBlockOptionMutedColor?: string;
  /** Bloco de frete: cor do preço */
  shippingBlockPriceColor?: string;
}

export interface CartSummaryProps {
  showQuantity: boolean;
  quantityLabel: string;
  subtotalLabel: string;
  totalLabel: string;
  showShipping: boolean;
  shippingLabel: string;
  /** Layout personalizado (logo + título em 3 linhas + linhas customizáveis) */
  customLayout?: boolean;
  headerLogoUrl?: string;
  /** Tamanho da logo no cabeçalho (ex: 48px, 3rem) */
  headerLogoSize?: string;
  headerLine1?: string;
  headerLine2?: string;
  headerLine3?: string;
  headerTextColor?: string;
  subtotalValueColor?: string;
  shippingValueColor?: string;
  totalValueColor?: string;
  showDiscountRow?: boolean;
  discountLabel?: string;
  discountValueColor?: string;
  /** Valor exibido na linha do subtotal (ex: "R$ 5.278,23"). Só layout personalizado. */
  customSubtotalValue?: string;
  /** Valor exibido na linha do desconto (ex: "- R$ 5.209,31"). Só layout personalizado. */
  customDiscountValue?: string;
}

export interface PaymentProps {
  title: string;
  description: string;
  pixLogoUrl: string;
  showPixLogo: boolean;
}

export interface TimerProps {
  minutes: number;
  backgroundColor: string;
  textColor: string;
  label: string;
  showIcon: boolean;
  /** 'inline' = no fluxo da página (padrão); 'sticky_top' = fixo no topo; 'sticky_bottom' = fixo na base */
  timerPosition?: 'inline' | 'sticky_top' | 'sticky_bottom';
}

export interface ButtonProps {
  text: string;
  loadingText: string;
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  paddingY: string;
  borderRadius: string;
  showGlow: boolean;
}

export interface DividerProps {
  thickness: string;
  color: string;
  marginY: string;
}

export interface SpacerProps {
  height: string;
}

export interface TestimonialProps {
  name: string;
  text: string;
  rating: number;
  avatarUrl: string;
  backgroundColor: string;
}

export interface SecurityBadgeProps {
  text: string;
  icon: string;
  variant: 'simple' | 'outlined' | 'filled';
  showImage: boolean;
  imageUrl: string;
}

export interface PaymentMethodsProps {
  title: string;
  showPixIcon: boolean;
  pixIconUrl: string;
  pixIconSize: string;
  footerText: string;
  showFooterText: boolean;
}

export interface StepIndicatorProps {
  step1Label: string;
  step2Label: string;
  step3Label: string;
  activeColor: string;
  completedColor: string;
  inactiveColor: string;
  labelColor: string;
  circleSize: string;
  fontSize: string;
  connectorWidth: string;
  showConnectors: boolean;
}

export interface OrderBumpItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  originalPrice_cents: number;
  imageUrl: string;
}

export interface OrderBumpProps {
  title: string;
  titleIcon: string;
  highlightColor: string;
  highlightText: string;
  showHighlight: boolean;
  checkboxColor: string;
  items: OrderBumpItem[];
}

export interface PixPageProps {
  headerTitle: string;
  headerSubtitle: string;
  copyButtonText: string;
  copiedButtonText: string;
  valueLabelText: string;
  securityMessage: string;
  showInstructions: boolean;
  instructionTitle: string;
  instructions: string[];
  showPurchaseDetails: boolean;
  purchaseDetailsTitle: string;
  showHelpLink: boolean;
  helpLinkText: string;
  confirmedTitle: string;
  confirmedSubtitle: string;
  showQrCode: boolean;
}

export type ElementProps =
  | HeaderProps
  | BannerProps
  | TextProps
  | ImageProps
  | FormProps
  | AddressProps
  | CartSummaryProps
  | PaymentProps
  | TimerProps
  | ButtonProps
  | DividerProps
  | SpacerProps
  | TestimonialProps
  | SecurityBadgeProps
  | PaymentMethodsProps
  | StepIndicatorProps
  | OrderBumpProps
  | PixPageProps;

// --- Element Styles ---
export interface ElementStyles {
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
  backgroundColor?: string;
  borderRadius?: string;
  border?: string;
}

// --- Checkout Element ---
export interface CheckoutElement {
  id: string;
  checkout_id: string;
  type: CheckoutElementType;
  props: Record<string, any>;
  styles: ElementStyles;
  order_index: number;
  visible: boolean;
}

// --- Shipping Option ---
export interface ShippingOption {
  id: string;
  name: string;
  price_cents: number;
  estimated_days: string;
  description: string;
  preSelected?: boolean;
}

// --- Checkout Product ---
export interface CheckoutProduct {
  id: string;
  checkout_id: string;
  name: string;
  amount_cents: number;
  /** Preço original em centavos (para exibir desconto no resumo) */
  original_amount_cents?: number;
  description: string;
  is_upsell: boolean;
  redirect_url: string;
  order_index: number;
  product_type: 'digital' | 'physical';
  shipping_options: ShippingOption[];
}

// --- Checkout ---
export interface Checkout {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  status: 'draft' | 'published';
  custom_domain?: string | null;
  theme: CheckoutTheme;
  settings: CheckoutSettings;
  created_at: string;
  updated_at: string;
}

// --- Full Checkout with Relations ---
export interface CheckoutFull extends Checkout {
  elements: CheckoutElement[];
  products: CheckoutProduct[];
}

// --- Builder State ---
export interface BuilderState {
  checkout: Checkout | null;
  elements: CheckoutElement[];
  products: CheckoutProduct[];
  selectedElementId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  activeTab: 'elements' | 'theme' | 'product' | 'settings';
}

// --- Default Props for each Element Type ---
export const DEFAULT_ELEMENT_PROPS: Record<CheckoutElementType, Record<string, any>> = {
  header: {
    logoUrl: '',
    logoSize: '48px',
    showSecurityBadge: true,
    securityText: 'PAGAMENTO 100% SEGURO',
    backgroundColor: 'transparent',
  } as HeaderProps,
  banner: {
    text: 'Informação importante sobre seu pedido.',
    backgroundColor: '#DBEAFE',
    textColor: '#000000',
    icon: 'info',
  } as BannerProps,
  text: {
    content: 'Texto de exemplo',
    alignment: 'left',
    fontSize: '14px',
    fontWeight: '400',
    color: '',
  } as TextProps,
  image: {
    src: '',
    alt: 'Imagem',
    width: '100%',
    height: 'auto',
    borderRadius: '12px',
    objectFit: 'contain',
  } as ImageProps,
  form: {
    title: 'Identificação',
    titleIcon: 'user',
    fields: [
      { id: 'email', name: 'email', label: 'E-mail', type: 'email', placeholder: 'email@email.com', required: false, enabled: true, icon: 'mail' },
      { id: 'phone', name: 'phone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000', required: true, enabled: true, icon: 'phone' },
      { id: 'name', name: 'name', label: 'Nome completo', type: 'text', placeholder: 'Nome e Sobrenome', required: true, enabled: true, icon: 'user' },
      { id: 'cpf', name: 'cpf', label: 'CPF', type: 'cpf', placeholder: '123.456.789-12', required: true, enabled: true, icon: 'credit-card' },
    ],
    showNoEmailCheckbox: true,
    noEmailLabel: 'Não tenho e-mail',
  } as FormProps,
  address: {
    title: 'Endereço de Entrega',
    titleIcon: 'map-pin',
    cepPlaceholder: '00000-000',
    showComplemento: true,
  } as AddressProps,
  cart_summary: {
    showQuantity: true,
    quantityLabel: '1 un.',
    subtotalLabel: 'Subtotal',
    totalLabel: 'Total',
    showShipping: true,
    shippingLabel: 'Frete',
  } as CartSummaryProps,
  payment: {
    title: 'Pagamento',
    description: 'Ao selecionar o Pix, você será encaminhado para um ambiente seguro para finalizar seu pagamento.',
    pixLogoUrl: '/pix-logo.png',
    showPixLogo: true,
  } as PaymentProps,
  timer: {
    minutes: 30,
    backgroundColor: '#ef4444',
    textColor: '#ffffff',
    label: 'Tempo restante para pagamento',
    showIcon: true,
    timerPosition: 'inline',
  } as TimerProps,
  button: {
    text: 'GERAR PIX',
    loadingText: 'GERANDO PIX...',
    backgroundColor: '',
    textColor: '',
    fontSize: '16px',
    paddingY: '16px',
    borderRadius: '16px',
    showGlow: true,
  } as ButtonProps,
  divider: {
    thickness: '1px',
    color: '',
    marginY: '8px',
  } as DividerProps,
  spacer: {
    height: '20px',
  } as SpacerProps,
  testimonial: {
    name: 'Maria Silva',
    text: 'Processo rápido e seguro. Recomendo!',
    rating: 5,
    avatarUrl: '',
    backgroundColor: '',
  } as TestimonialProps,
  security_badge: {
    text: 'Ambiente seguro',
    icon: 'shield',
    variant: 'simple',
    showImage: true,
    imageUrl: '/ambiente-seguro.png',
  } as SecurityBadgeProps,
  payment_methods: {
    title: 'Formas de pagamento',
    showPixIcon: true,
    pixIconUrl: '/pix-icon.png',
    pixIconSize: '40px',
    footerText: '© 2025 Formas de pagamento',
    showFooterText: true,
  } as PaymentMethodsProps,
  order_bump: {
    title: 'Adicione ao seu pedido',
    titleIcon: 'gift',
    highlightColor: '#ef4444',
    highlightText: 'OFERTA ESPECIAL',
    showHighlight: true,
    checkboxColor: '',
    items: [
      {
        id: 'bump-1',
        name: 'Produto Extra',
        description: 'Descrição do order bump',
        price_cents: 1990,
        originalPrice_cents: 4990,
        imageUrl: '',
      },
    ],
  } as OrderBumpProps,
  step_indicator: {
    step1Label: 'Identificação',
    step2Label: 'Endereço',
    step3Label: 'Pagamento',
    activeColor: '',
    completedColor: '',
    inactiveColor: '',
    labelColor: '',
    circleSize: '32px',
    fontSize: '11px',
    connectorWidth: '48px',
    showConnectors: true,
  } as StepIndicatorProps,
  pix_page: {
    headerTitle: 'Falta pouco!',
    headerSubtitle: 'Para finalizar a compra, efetue o pagamento com PIX!',
    copyButtonText: 'COPIAR CÓDIGO',
    copiedButtonText: 'CÓDIGO COPIADO!',
    valueLabelText: 'Valor a ser pago:',
    securityMessage: 'Os bancos reforçaram a segurança do Pix e podem exibir alertas preventivas durante o pagamento. Fique tranquilo — sua transação é segura.',
    showInstructions: true,
    instructionTitle: 'Instruções para pagamento',
    instructions: [
      'Após copiar o código, abra seu aplicativo de pagamento onde você utiliza o Pix.',
      'Escolha a opção PIX Copia e Cola e insira o código copiado.',
      'Confirme as informações e finalize sua compra.',
    ],
    showPurchaseDetails: true,
    purchaseDetailsTitle: 'Detalhes da compra:',
    showHelpLink: true,
    helpLinkText: 'Caso tenha dúvida, clique aqui para ver o tutorial',
    confirmedTitle: 'Pagamento Confirmado!',
    confirmedSubtitle: 'Seu pagamento foi recebido com sucesso. Obrigado!',
    showQrCode: true,
  } as PixPageProps,
};

// --- Element Labels for UI ---
export const ELEMENT_LABELS: Record<CheckoutElementType, string> = {
  header: 'Cabeçalho',
  banner: 'Banner',
  text: 'Texto',
  image: 'Imagem',
  form: 'Formulário',
  address: 'Endereço',
  cart_summary: 'Resumo do Carrinho',
  payment: 'Pagamento',
  timer: 'Timer',
  button: 'Botão',
  divider: 'Divisor',
  spacer: 'Espaçador',
  testimonial: 'Depoimento',
  security_badge: 'Badge de Segurança',
  payment_methods: 'Formas de Pagamento',
  step_indicator: 'Indicador de Passos',
  order_bump: 'Order Bump',
  pix_page: 'Página PIX',
};

// --- Element Icons for UI ---
export const ELEMENT_ICONS: Record<CheckoutElementType, string> = {
  header: 'layout',
  banner: 'megaphone',
  text: 'type',
  image: 'image',
  form: 'clipboard-list',
  address: 'map-pin',
  cart_summary: 'shopping-cart',
  payment: 'wallet',
  timer: 'clock',
  button: 'mouse-pointer-click',
  divider: 'minus',
  spacer: 'move-vertical',
  testimonial: 'message-square',
  security_badge: 'shield-check',
  payment_methods: 'credit-card',
  step_indicator: 'list-ordered',
  order_bump: 'gift',
  pix_page: 'qr-code',
};
