import { CheckoutElement, CheckoutTheme, CheckoutSettings, CheckoutProduct, ShippingOption } from '@/types/checkout';
import { v4 as uuidv4 } from 'uuid';

export type CheckoutTemplate = 'digital' | 'ecommerce';

export const DEFAULT_THEME: CheckoutTheme = {
  colors: {
    background: '#f5f7fa',
    card: '#ffffff',
    border: '#e5e7eb',
    primary: '#22c55e',
    primaryText: '#ffffff',
    text: '#1a1a2e',
    textMuted: '#6b7280',
    timer: '#ef4444',
    banner: '#DBEAFE',
    bannerText: '#000000',
  },
  font: {
    family: 'Inter',
    headingWeight: '700',
    bodyWeight: '400',
  },
  borderRadius: '16px',
  maxWidth: '448px',
  customCSS: '',
};

export const DEFAULT_SETTINGS: CheckoutSettings = {
  logoUrl: '',
  pageTitle: '',
  faviconUrl: '',
  showSecurityBadge: true,
  securityText: 'PAGAMENTO 100% SEGURO',
  paymentMethods: ['pix'],
  pixExpirationMinutes: 30,
  showInstructions: true,
  checkoutSteps: 3,
  utmEnabled: false,
  redirectAppendCpf: true,
  redirectAppendNome: true,
  redirectAppendEmail: true,
  redirectAppendTelefone: true,
  redirectParamCpf: 'cpf',
  redirectParamNome: 'nome',
  redirectParamEmail: 'email',
  redirectParamTelefone: 'telefone',
};

export const DIGITAL_SETTINGS: CheckoutSettings = {
  ...DEFAULT_SETTINGS,
  checkoutSteps: 2,
};

export const ECOMMERCE_SETTINGS: CheckoutSettings = {
  ...DEFAULT_SETTINGS,
  checkoutSteps: 3,
};

export function createDefaultElements(checkoutId: string): Omit<CheckoutElement, 'checkout_id'>[] {
  return [
    {
      id: uuidv4(),
      type: 'header',
      props: {
        logoUrl: '',
        logoSize: '48px',
        showSecurityBadge: true,
        securityText: 'PAGAMENTO 100% SEGURO',
        backgroundColor: 'transparent',
      },
      styles: {},
      order_index: 0,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'step_indicator',
      props: {
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
      },
      styles: {},
      order_index: 1,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'banner',
      props: {
        text: 'Informação importante sobre seu pedido. Preencha os dados abaixo para continuar.',
        backgroundColor: '#DBEAFE',
        textColor: '#000000',
        icon: 'info',
      },
      styles: { marginBottom: '20px' },
      order_index: 2,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'cart_summary',
      props: {
        showQuantity: true,
        quantityLabel: '1 un.',
        subtotalLabel: 'Subtotal',
        totalLabel: 'Total',
      },
      styles: { marginBottom: '20px' },
      order_index: 3,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'form',
      props: {
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
      },
      styles: {},
      order_index: 4,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'payment',
      props: {
        title: 'Pagamento',
        description: 'Ao selecionar o Pix, você será encaminhado para um ambiente seguro para finalizar seu pagamento.',
        pixLogoUrl: '/pix-logo.png',
        showPixLogo: true,
      },
      styles: {},
      order_index: 5,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'button',
      props: {
        text: 'GERAR PIX',
        loadingText: 'GERANDO PIX...',
        backgroundColor: '',
        textColor: '',
        fontSize: '16px',
        paddingY: '16px',
        borderRadius: '16px',
        showGlow: true,
      },
      styles: {},
      order_index: 6,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'payment_methods',
      props: {
        title: 'Formas de pagamento',
        showPixIcon: true,
        pixIconUrl: '/pix-icon.png',
        pixIconSize: '40px',
        footerText: '© 2025 Formas de pagamento',
        showFooterText: true,
      },
      styles: { marginTop: '8px' },
      order_index: 7,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'security_badge',
      props: {
        text: 'Ambiente seguro',
        icon: 'shield',
        variant: 'simple',
        showImage: true,
        imageUrl: '/ambiente-seguro.png',
      },
      styles: { marginTop: '8px' },
      order_index: 8,
      visible: true,
    },
    {
      id: uuidv4(),
      type: 'pix_page',
      props: {
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
      },
      styles: {},
      order_index: 9,
      visible: true,
    },
  ];
}

export function createDefaultProduct(checkoutId: string): Omit<CheckoutProduct, 'id' | 'checkout_id'> {
  return {
    name: 'Produto',
    amount_cents: 5890,
    description: '',
    is_upsell: false,
    redirect_url: '',
    order_index: 0,
    product_type: 'digital',
    shipping_options: [],
  };
}

// ============================
// Template: Produto Digital (2 passos - Dados + Pagamento)
// ============================
export function createDigitalElements(checkoutId: string): Omit<CheckoutElement, 'checkout_id'>[] {
  return [
    { id: uuidv4(), type: 'header', props: { logoUrl: '', logoSize: '48px', showSecurityBadge: true, securityText: 'PAGAMENTO 100% SEGURO', backgroundColor: 'transparent' }, styles: {}, order_index: 0, visible: true },
    { id: uuidv4(), type: 'step_indicator', props: { step1Label: 'Dados', step2Label: 'Pagamento', step3Label: 'Pagamento', activeColor: '', completedColor: '', inactiveColor: '', labelColor: '', circleSize: '32px', fontSize: '11px', connectorWidth: '48px', showConnectors: true }, styles: {}, order_index: 1, visible: true },
    { id: uuidv4(), type: 'banner', props: { text: 'Informe seus dados para acessar o conteúdo.', backgroundColor: '#DBEAFE', textColor: '#000000', icon: 'info' }, styles: { marginBottom: '20px' }, order_index: 2, visible: true },
    { id: uuidv4(), type: 'cart_summary', props: { showQuantity: true, quantityLabel: '1 un.', subtotalLabel: 'Subtotal', totalLabel: 'Total' }, styles: { marginBottom: '20px' }, order_index: 3, visible: true },
    { id: uuidv4(), type: 'form', props: { title: 'Identificação', titleIcon: 'user', fields: [{ id: 'email', name: 'email', label: 'E-mail', type: 'email', placeholder: 'email@email.com', required: false, enabled: true, icon: 'mail' }, { id: 'phone', name: 'phone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000', required: true, enabled: true, icon: 'phone' }, { id: 'name', name: 'name', label: 'Nome completo', type: 'text', placeholder: 'Nome e Sobrenome', required: true, enabled: true, icon: 'user' }, { id: 'cpf', name: 'cpf', label: 'CPF', type: 'cpf', placeholder: '123.456.789-12', required: true, enabled: true, icon: 'credit-card' }], showNoEmailCheckbox: true, noEmailLabel: 'Não tenho e-mail' }, styles: {}, order_index: 4, visible: true },
    { id: uuidv4(), type: 'payment', props: { title: 'Pagamento', description: 'Ao selecionar o Pix, você será encaminhado para um ambiente seguro para finalizar seu pagamento.', pixLogoUrl: '/pix-logo.png', showPixLogo: true }, styles: {}, order_index: 5, visible: true },
    { id: uuidv4(), type: 'button', props: { text: 'GERAR PIX', loadingText: 'GERANDO PIX...', backgroundColor: '', textColor: '', fontSize: '16px', paddingY: '16px', borderRadius: '16px', showGlow: true }, styles: {}, order_index: 6, visible: true },
    { id: uuidv4(), type: 'payment_methods', props: { title: 'Formas de pagamento', showPixIcon: true, pixIconUrl: '/pix-icon.png', pixIconSize: '40px', footerText: '© 2025 Formas de pagamento', showFooterText: true }, styles: { marginTop: '8px' }, order_index: 7, visible: true },
    { id: uuidv4(), type: 'security_badge', props: { text: 'Ambiente seguro', icon: 'shield', variant: 'simple', showImage: true, imageUrl: '/ambiente-seguro.png' }, styles: { marginTop: '8px' }, order_index: 8, visible: true },
    { id: uuidv4(), type: 'pix_page', props: { headerTitle: 'Falta pouco!', headerSubtitle: 'Para finalizar a compra, efetue o pagamento com PIX!', copyButtonText: 'COPIAR CÓDIGO', copiedButtonText: 'CÓDIGO COPIADO!', valueLabelText: 'Valor a ser pago:', securityMessage: 'Os bancos reforçaram a segurança do Pix e podem exibir alertas preventivas durante o pagamento. Fique tranquilo — sua transação é segura.', showInstructions: true, instructionTitle: 'Instruções para pagamento', instructions: ['Após copiar o código, abra seu aplicativo de pagamento onde você utiliza o Pix.', 'Escolha a opção PIX Copia e Cola e insira o código copiado.', 'Confirme as informações e finalize sua compra.'], showPurchaseDetails: true, purchaseDetailsTitle: 'Detalhes da compra:', showHelpLink: true, helpLinkText: 'Caso tenha dúvida, clique aqui para ver o tutorial', confirmedTitle: 'Pagamento Confirmado!', confirmedSubtitle: 'Seu pagamento foi recebido com sucesso. Obrigado!', showQrCode: true }, styles: {}, order_index: 9, visible: true },
  ];
}

export function createDigitalProduct(checkoutId: string): Omit<CheckoutProduct, 'id' | 'checkout_id'> {
  return {
    name: 'Produto Digital',
    amount_cents: 4900,
    description: 'E-book, curso ou conteúdo digital',
    is_upsell: false,
    redirect_url: '',
    order_index: 0,
    product_type: 'digital',
    shipping_options: [],
  };
}

// ============================
// Template: Ecommerce (3 passos - Dados + Endereço + Pagamento)
// ============================
const DEFAULT_SHIPPING_OPTIONS: Omit<ShippingOption, 'id'>[] = [
  { name: 'Frete Econômico', price_cents: 1500, estimated_days: '5-10 dias úteis', description: 'Entrega em domicílio' },
  { name: 'Entrega Rápida', price_cents: 2500, estimated_days: '2-3 dias úteis', description: 'Expresso' },
];

export function createEcommerceElements(checkoutId: string): Omit<CheckoutElement, 'checkout_id'>[] {
  return [
    { id: uuidv4(), type: 'header', props: { logoUrl: '', logoSize: '48px', showSecurityBadge: true, securityText: 'PAGAMENTO 100% SEGURO', backgroundColor: 'transparent' }, styles: {}, order_index: 0, visible: true },
    { id: uuidv4(), type: 'step_indicator', props: { step1Label: 'Identificação', step2Label: 'Endereço', step3Label: 'Pagamento', activeColor: '', completedColor: '', inactiveColor: '', labelColor: '', circleSize: '32px', fontSize: '11px', connectorWidth: '48px', showConnectors: true }, styles: {}, order_index: 1, visible: true },
    { id: uuidv4(), type: 'banner', props: { text: 'Informe seus dados e endereço para receber o pedido.', backgroundColor: '#DBEAFE', textColor: '#000000', icon: 'info' }, styles: { marginBottom: '20px' }, order_index: 2, visible: true },
    { id: uuidv4(), type: 'cart_summary', props: { showQuantity: true, quantityLabel: '1 un.', subtotalLabel: 'Subtotal', totalLabel: 'Total' }, styles: { marginBottom: '20px' }, order_index: 3, visible: true },
    { id: uuidv4(), type: 'form', props: { title: 'Identificação', titleIcon: 'user', fields: [{ id: 'email', name: 'email', label: 'E-mail', type: 'email', placeholder: 'email@email.com', required: false, enabled: true, icon: 'mail' }, { id: 'phone', name: 'phone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000', required: true, enabled: true, icon: 'phone' }, { id: 'name', name: 'name', label: 'Nome completo', type: 'text', placeholder: 'Nome e Sobrenome', required: true, enabled: true, icon: 'user' }, { id: 'cpf', name: 'cpf', label: 'CPF', type: 'cpf', placeholder: '123.456.789-12', required: true, enabled: true, icon: 'credit-card' }], showNoEmailCheckbox: true, noEmailLabel: 'Não tenho e-mail' }, styles: {}, order_index: 4, visible: true },
    { id: uuidv4(), type: 'address', props: { title: 'Endereço de Entrega', cepPlaceholder: '00000-000', showComplemento: true }, styles: {}, order_index: 5, visible: true },
    { id: uuidv4(), type: 'payment', props: { title: 'Pagamento', description: 'Ao selecionar o Pix, você será encaminhado para um ambiente seguro para finalizar seu pagamento.', pixLogoUrl: '/pix-logo.png', showPixLogo: true }, styles: {}, order_index: 6, visible: true },
    { id: uuidv4(), type: 'button', props: { text: 'GERAR PIX', loadingText: 'GERANDO PIX...', backgroundColor: '', textColor: '', fontSize: '16px', paddingY: '16px', borderRadius: '16px', showGlow: true }, styles: {}, order_index: 7, visible: true },
    { id: uuidv4(), type: 'payment_methods', props: { title: 'Formas de pagamento', showPixIcon: true, pixIconUrl: '/pix-icon.png', pixIconSize: '40px', footerText: '© 2025 Formas de pagamento', showFooterText: true }, styles: { marginTop: '8px' }, order_index: 8, visible: true },
    { id: uuidv4(), type: 'security_badge', props: { text: 'Ambiente seguro', icon: 'shield', variant: 'simple', showImage: true, imageUrl: '/ambiente-seguro.png' }, styles: { marginTop: '8px' }, order_index: 9, visible: true },
    { id: uuidv4(), type: 'pix_page', props: { headerTitle: 'Falta pouco!', headerSubtitle: 'Para finalizar a compra, efetue o pagamento com PIX!', copyButtonText: 'COPIAR CÓDIGO', copiedButtonText: 'CÓDIGO COPIADO!', valueLabelText: 'Valor a ser pago:', securityMessage: 'Os bancos reforçaram a segurança do Pix e podem exibir alertas preventivas durante o pagamento. Fique tranquilo — sua transação é segura.', showInstructions: true, instructionTitle: 'Instruções para pagamento', instructions: ['Após copiar o código, abra seu aplicativo de pagamento onde você utiliza o Pix.', 'Escolha a opção PIX Copia e Cola e insira o código copiado.', 'Confirme as informações e finalize sua compra.'], showPurchaseDetails: true, purchaseDetailsTitle: 'Detalhes da compra:', showHelpLink: true, helpLinkText: 'Caso tenha dúvida, clique aqui para ver o tutorial', confirmedTitle: 'Pagamento Confirmado!', confirmedSubtitle: 'Seu pagamento foi recebido com sucesso. Obrigado!', showQrCode: true }, styles: {}, order_index: 10, visible: true },
  ];
}

export function createEcommerceProduct(checkoutId: string): Omit<CheckoutProduct, 'id' | 'checkout_id'> {
  const shipping_options: ShippingOption[] = DEFAULT_SHIPPING_OPTIONS.map((opt) => ({
    ...opt,
    id: uuidv4(),
  }));
  return {
    name: 'Produto Físico',
    amount_cents: 9900,
    description: 'Produto com entrega',
    is_upsell: false,
    redirect_url: '',
    order_index: 0,
    product_type: 'physical',
    shipping_options,
  };
}
