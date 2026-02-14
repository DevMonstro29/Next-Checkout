import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Checkout, CheckoutElement, CheckoutProduct, CheckoutTheme, ShippingOption, OrderBumpItem } from '@/types/checkout';
import ElementRenderer from '@/components/builder/elements/ElementRenderer';
import CartSummaryElement from '@/components/builder/elements/CartSummaryElement';
import OrderBumpElement from '@/components/builder/elements/OrderBumpElement';
import ShippingSelector from '@/components/builder/elements/ShippingSelector';
import StepIndicatorElement from '@/components/builder/elements/StepIndicatorElement';
import PixPayment from '@/components/checkout/PixPayment';
import { Loader2, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';

interface PixPaymentData {
  transaction_id: string;
  pix_code: string;
  pix_qr_code: string;
  amount: string;
  status: string;
  expires_at: string;
}

interface AddressData {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const EMPTY_ADDRESS: AddressData = {
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

// ============================
// Main Checkout Renderer
// ============================
const CheckoutRenderer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [elements, setElements] = useState<CheckoutElement[]>([]);
  const [products, setProducts] = useState<CheckoutProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Checkout state
  const [pixStep, setPixStep] = useState(false);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerData, setCustomerData] = useState<{ name: string; email: string; cpf: string; phone: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-step state (for physical products)
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [noEmail, setNoEmail] = useState(false);

  // Address state
  const [address, setAddress] = useState<AddressData>(EMPTY_ADDRESS);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFound, setCepFound] = useState(false);

  // Shipping state
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);

  // Order bump state
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
  const toggleBump = (id: string) => {
    setSelectedBumps((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // Quantity state
  const [quantity, setQuantity] = useState(1);
  const handleQuantityChange = (q: number) => setQuantity(Math.max(1, q));

  // Pre-select shipping option if one is marked as preSelected
  useEffect(() => {
    if (products.length > 0) {
      const mainProduct = products.find((p) => !p.is_upsell) || products[0];
      const preSelected = (mainProduct?.shipping_options || []).find((o) => o.preSelected);
      if (preSelected && !selectedShippingId) {
        setSelectedShippingId(preSelected.id);
      }
    }
  }, [products]);

  useEffect(() => {
    if (slug || window.location.pathname === '/') loadCheckout();
  }, [slug]);

  // Preenchimento automático a partir dos parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const get = (keys: string[]) => {
      for (const k of keys) {
        const v = params.get(k);
        if (v) return decodeURIComponent(v).trim();
      }
      return '';
    };
    const next: Record<string, string> = {};
    const nameVal = get(['name', 'nome']);
    if (nameVal) {
      next.name = nameVal;
      setCustomerName(nameVal);
    }
    const emailVal = get(['email', 'mail']);
    if (emailVal) next.email = emailVal;
    const cpfVal = get(['cpf', 'documento']);
    if (cpfVal) {
      const digits = cpfVal.replace(/\D/g, '').slice(0, 11);
      if (digits.length <= 3) next.cpf = digits;
      else if (digits.length <= 6) next.cpf = `${digits.slice(0, 3)}.${digits.slice(3)}`;
      else if (digits.length <= 9) next.cpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      else next.cpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    const phoneVal = get(['phone', 'telefone', 'tel']);
    if (phoneVal) {
      const digits = phoneVal.replace(/\D/g, '').slice(0, 11);
      if (digits.length <= 2) next.phone = `(${digits}`;
      else if (digits.length <= 7) next.phone = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      else next.phone = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (Object.keys(next).length > 0) {
      setFormValues((prev) => ({ ...prev, ...next }));
    }
    const cepVal = get(['cep', 'zipcode']);
    if (cepVal) {
      const digits = cepVal.replace(/\D/g, '').slice(0, 8);
      const formatted = digits.length <= 5 ? digits : `${digits.slice(0, 5)}-${digits.slice(5)}`;
      setAddress((prev) => ({ ...prev, cep: formatted }));
    }
    const ruaVal = get(['rua', 'street', 'logradouro', 'endereco']);
    if (ruaVal) setAddress((prev) => ({ ...prev, rua: ruaVal }));
    const numVal = get(['numero', 'number', 'num']);
    if (numVal) setAddress((prev) => ({ ...prev, numero: numVal }));
    const compVal = get(['complemento', 'complement']);
    if (compVal) setAddress((prev) => ({ ...prev, complemento: compVal }));
    const bairroVal = get(['bairro', 'neighborhood']);
    if (bairroVal) setAddress((prev) => ({ ...prev, bairro: bairroVal }));
    const cidadeVal = get(['cidade', 'city']);
    if (cidadeVal) setAddress((prev) => ({ ...prev, cidade: cidadeVal }));
    const estadoVal = get(['estado', 'state', 'uf']);
    if (estadoVal) setAddress((prev) => ({ ...prev, estado: estadoVal }));

    // Salvar UTMs no localStorage quando presentes na URL (para enviar na geração do PIX)
    const utmKeys = ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'];
    const hasUtm = utmKeys.some((k) => params.get(k));
    if (hasUtm) {
      try {
        const stored: Record<string, string> = {};
        utmKeys.forEach((k) => {
          const v = params.get(k);
          if (v) stored[k] = decodeURIComponent(v).trim();
        });
        if (Object.keys(stored).length > 0) {
          localStorage.setItem('checkout_utm_params', JSON.stringify(stored));
        }
      } catch {}
    }
  }, []);

  // Atualiza título e favicon da página conforme configuração do checkout
  useEffect(() => {
    if (!checkout) return;
    const s = checkout.settings || {};
    const title = s.pageTitle?.trim() || checkout.name || 'Checkout';
    document.title = title;

    const raw = (s.faviconUrl || s.logoUrl || '').trim();
    const fullFaviconUrl = !raw
      ? null
      : raw.startsWith('http')
        ? raw
        : raw.startsWith('//')
          ? `${window.location.protocol}${raw}`
          : raw.startsWith('/')
            ? `${window.location.origin}${raw}`
            : `${window.location.origin}/${raw}`;

    if (fullFaviconUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = fullFaviconUrl;
    }
  }, [checkout]);

  const loadCheckout = async () => {
    setLoading(true);
    try {
      // Resolver por slug (/c/:slug) ou por domínio próprio (hostname quando path é /)
      const byDomain = !slug && typeof window !== 'undefined' && window.location.pathname === '/';
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

      let query = supabase
        .from('checkouts')
        .select('*')
        .eq('status', 'published');

      if (byDomain && hostname) {
        query = query.eq('custom_domain', hostname).order('created_at', { ascending: false }).limit(1);
      } else if (slug) {
        query = query.eq('slug', slug);
      } else {
        setNotFound(true);
        setLoading(false);
        return;
      }

      let checkoutData;
      if (byDomain && hostname) {
        const { data: rows, error: err } = await query;
        checkoutData = rows?.[0];
        if (err && !checkoutData) {
          setNotFound(true);
          return;
        }
      } else {
        const { data, error: err } = await query.single();
        checkoutData = data;
        if (err || !checkoutData) {
          setNotFound(true);
          return;
        }
      }

      if (!checkoutData) {
        setNotFound(true);
        return;
      }

      const [elementsRes, productsRes] = await Promise.all([
        supabase.from('checkout_elements').select('*').eq('checkout_id', checkoutData.id).order('order_index'),
        supabase.from('checkout_products').select('*').eq('checkout_id', checkoutData.id).order('order_index'),
      ]);

      setCheckout(checkoutData);
      setElements(elementsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Format helpers
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handleInputChange = useCallback((fieldName: string, fieldType: string, value: string) => {
    let formatted = value;
    if (fieldType === 'cpf') formatted = formatCpf(value);
    else if (fieldType === 'tel') formatted = formatPhone(value);
    setFormValues((prev) => ({ ...prev, [fieldName]: formatted }));
    if (fieldName === 'name') setCustomerName(value);
  }, []);

  // CEP lookup
  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }
    setCepLoading(true);
    setCepFound(false);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      setAddress((prev) => ({
        ...prev,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));
      setCepFound(true);
      toast.success('Endereço encontrado!');
    } catch {
      toast.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setAddress((prev) => ({ ...prev, cep: formatted }));
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) lookupCep(digits);
  };

  // Product helpers
  const getMainProduct = () => products.find((p) => !p.is_upsell) || products[0];
  const isPhysical = getMainProduct()?.product_type === 'physical';
  const shippingOptions: ShippingOption[] = getMainProduct()?.shipping_options || [];
  const selectedShipping = shippingOptions.find((o) => o.id === selectedShippingId);
  const selectedShippingCents = selectedShipping?.price_cents ?? 0;

  // Order bump helpers — collect all bump items from all order_bump elements
  const allBumpItems: OrderBumpItem[] = elements
    .filter((e) => e.type === 'order_bump' && e.visible)
    .flatMap((e) => (e.props.items || []) as OrderBumpItem[]);
  const selectedBumpItemsList = allBumpItems
    .filter((item) => selectedBumps.includes(item.id));
  const selectedBumpsCents = selectedBumpItemsList
    .reduce((sum, item) => sum + (item.price_cents || 0), 0);
  const selectedBumpItems = selectedBumpItemsList.map((item) => ({
    id: item.id,
    name: item.name,
    price_cents: item.price_cents,
  }));

  // ============================
  // Validation per step
  // ============================
  const validateStep1 = (): boolean => {
    const formElement = elements.find((e) => e.type === 'form');
    const fields = formElement?.props?.fields || [];

    for (const field of fields) {
      if (!field.enabled) continue;
      if (field.required && !formValues[field.name]?.trim()) {
        if (field.name === 'email' && noEmail) continue;
        toast.error(`Preencha o campo ${field.label}`);
        return false;
      }
    }

    const phone = formValues.phone?.replace(/\D/g, '') || '';
    const cpf = formValues.cpf?.replace(/\D/g, '') || '';

    if (phone && phone.length !== 11) {
      toast.error('Preencha o telefone corretamente.');
      return false;
    }
    if (cpf && cpf.length !== 11) {
      toast.error('Preencha o CPF corretamente.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!address.cep || address.cep.replace(/\D/g, '').length !== 8) {
      toast.error('Preencha o CEP corretamente.');
      return false;
    }
    if (!address.rua.trim()) { toast.error('Preencha a rua.'); return false; }
    if (!address.numero.trim()) { toast.error('Preencha o número.'); return false; }
    if (!address.bairro.trim()) { toast.error('Preencha o bairro.'); return false; }
    if (!address.cidade.trim()) { toast.error('Preencha a cidade.'); return false; }
    if (!address.estado.trim()) { toast.error('Preencha o estado.'); return false; }

    if (shippingOptions.length > 0 && !selectedShippingId) {
      toast.error('Selecione uma opção de frete.');
      return false;
    }
    return true;
  };

  const totalSteps = checkout?.settings?.checkoutSteps || 3;

  const handleNextStep = () => {
    if (totalSteps === 3) {
      // 3 steps: 1=Identificação, 2=Endereço, 3=Pagamento
      if (currentStep === 1) {
        if (!validateStep1()) return;
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (currentStep === 2) {
        if (!validateStep2()) return;
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // 2 steps: 1=Identificação+Endereço+Frete, 2=Pagamento
      if (currentStep === 1) {
        if (!validateStep1()) return;
        if (!validateStep2()) return;
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ============================
  // Submit payment
  // ============================
  const handleSubmit = async () => {
    const mainProduct = getMainProduct();
    if (!mainProduct) {
      toast.error('Produto não configurado');
      return;
    }

    // For digital: validate everything at once
    if (!isPhysical) {
      if (!validateStep1()) return;
    }
    // For physical on step 3: all validations already passed

    const name = formValues.name?.trim() || '';
    const email = noEmail ? '' : (formValues.email?.trim() || '');
    const phone = formValues.phone?.replace(/\D/g, '') || '';
    const cpf = formValues.cpf?.replace(/\D/g, '') || '';

    setIsSubmitting(true);
    setCustomerName(name);

    let totalCents = mainProduct.amount_cents * quantity;
    if (isPhysical && selectedShipping) {
      totalCents += selectedShipping.price_cents;
    }
    // Add order bumps
    totalCents += selectedBumpsCents;

    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const s = checkout.settings;
      // UTM: priorizar localStorage (salvos no primeiro acesso), depois URL, depois settings
      let storedUtm: Record<string, string> = {};
      try {
        const raw = localStorage.getItem('checkout_utm_params');
        if (raw) storedUtm = JSON.parse(raw) || {};
      } catch {}
      const utmParams = {
        utm_source: storedUtm.utm_source ?? params.get('utm_source') ?? s?.utmSource ?? undefined,
        utm_campaign: storedUtm.utm_campaign ?? params.get('utm_campaign') ?? s?.utmCampaign ?? undefined,
        utm_medium: storedUtm.utm_medium ?? params.get('utm_medium') ?? s?.utmMedium ?? undefined,
        utm_content: storedUtm.utm_content ?? params.get('utm_content') ?? s?.utmContent ?? undefined,
        utm_term: storedUtm.utm_term ?? params.get('utm_term') ?? s?.utmTerm ?? undefined,
      };

      setCustomerData({ name, email, cpf, phone });

      const response = await fetch(apiUrl('/api/create-pix-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutId: checkout.id,
          name,
          email,
          cpf,
          phone,
          productName: mainProduct.name,
          amountCents: totalCents,
          ...utmParams,
          ...(isPhysical && {
            address: {
              cep: address.cep.replace(/\D/g, ''),
              rua: address.rua,
              numero: address.numero,
              complemento: address.complemento,
              bairro: address.bairro,
              cidade: address.cidade,
              estado: address.estado,
            },
            shipping: selectedShipping,
          }),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Erro ao gerar PIX');
      }

      setPaymentData(data.data);
      setPixStep(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar o PIX. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================
  // Renders
  // ============================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !checkout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Checkout não encontrado</h1>
          <p className="text-gray-500">Este checkout não existe ou não está publicado.</p>
        </div>
      </div>
    );
  }

  const { theme, settings } = checkout;
  const mainProduct = getMainProduct();
  const redirectUrl = mainProduct?.redirect_url || '';
  const redirectParamsConfig = {
    appendCpf: settings?.redirectAppendCpf ?? true,
    appendNome: settings?.redirectAppendNome ?? true,
    appendEmail: settings?.redirectAppendEmail ?? true,
    appendTelefone: settings?.redirectAppendTelefone ?? true,
    paramCpf: settings?.redirectParamCpf || 'cpf',
    paramNome: settings?.redirectParamNome || 'nome',
    paramEmail: settings?.redirectParamEmail || 'email',
    paramTelefone: settings?.redirectParamTelefone || 'telefone',
  };

  // PIX step (layout idêntico ao preview do builder)
  if (pixStep && paymentData) {
    const pixPageElement = elements.find((e) => e.type === 'pix_page' && e.visible);
    const pixPageProps = pixPageElement?.props || {};
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background, fontFamily: theme.font.family }}>
        {theme.customCSS && <style dangerouslySetInnerHTML={{ __html: theme.customCSS }} />}
        <div className={`mx-auto w-full px-4 sm:px-8 pt-6 pb-6`} style={{ maxWidth: theme.maxWidth }}>
          <div className="space-y-3">
            {elements.filter((e) => e.type === 'header' && e.visible).map((el) => (
              <ElementRenderer key={el.id} element={el} theme={theme} products={products} />
            ))}
            <PixPayment
            paymentData={paymentData}
            customerName={customerName}
            customerData={customerData}
            redirectUrl={redirectUrl}
            redirectParamsConfig={redirectParamsConfig}
            theme={theme}
            pixPageProps={pixPageProps}
          />
          </div>
        </div>
      </div>
    );
  }

  const sortedElements = [...elements].filter((e) => e.visible && e.type !== 'pix_page').sort((a, b) => a.order_index - b.order_index);

  // Get step indicator element (only renders if user has it in their checkout)
  const stepIndicatorElement = sortedElements.find((e) => e.type === 'step_indicator');

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background, fontFamily: theme.font.family }}>
      {theme.customCSS && <style dangerouslySetInnerHTML={{ __html: theme.customCSS }} />}
      <div className="mx-auto w-full px-4 sm:px-8 pt-10 pb-6" style={{ maxWidth: theme.maxWidth }}>
        <div className="space-y-3">
        {/* Header always visible */}
        {sortedElements.filter((e) => e.type === 'header').map((el) => (
          <ElementRenderer key={el.id} element={el} theme={theme} products={products} />
        ))}

        {/* Step indicator for physical products — only if element exists */}
        {isPhysical && stepIndicatorElement && (
          <div style={stepIndicatorElement.styles || {}}>
            <StepIndicatorElement
              props={stepIndicatorElement.props}
              theme={theme}
              currentStep={currentStep}
              totalSteps={totalSteps}
            />
          </div>
        )}

        {/* Timer always visible */}
        {sortedElements.filter((e) => e.type === 'timer').map((el) => (
          <div key={el.id} style={el.styles}>
            <ElementRenderer element={el} theme={theme} products={products} />
          </div>
        ))}

        {/* Container único (layout igual ao preview do builder) */}
        <div
          className="p-5 space-y-3"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius,
          }}
        >
        {/* ===== DIGITAL PRODUCT: single page ===== */}
        {!isPhysical && (
          <SinglePageCheckout
            compact
            checkout={checkout}
            elements={sortedElements}
            products={products}
            formValues={formValues}
            noEmail={noEmail}
            setNoEmail={setNoEmail}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            theme={theme}
            selectedBumps={selectedBumps}
            onToggleBump={toggleBump}
            selectedBumpsCents={selectedBumpsCents}
            selectedBumpItems={selectedBumpItems}
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
          />
        )}

        {/* ===== PHYSICAL PRODUCT: 3 STEPS MODE ===== */}
        {isPhysical && totalSteps === 3 && (
          <div className="space-y-3">
            {currentStep === 1 && (
              <Step1Identification
                compact
                elements={sortedElements}
                products={products}
                formValues={formValues}
                noEmail={noEmail}
                setNoEmail={setNoEmail}
                onInputChange={handleInputChange}
                theme={theme}
                selectedShippingCents={selectedShippingCents}
                selectedShipping={selectedShipping}
                selectedBumps={selectedBumps}
                onToggleBump={toggleBump}
                selectedBumpsCents={selectedBumpsCents}
                selectedBumpItems={selectedBumpItems}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
              />
            )}

            {currentStep === 2 && (
              <Step2Address
                compact
                elements={sortedElements}
                products={products}
                theme={theme}
                address={address}
                onAddressChange={setAddress}
                onCepChange={handleCepChange}
                onCepLookup={() => lookupCep(address.cep)}
                cepLoading={cepLoading}
                cepFound={cepFound}
                shippingOptions={shippingOptions}
                selectedShippingId={selectedShippingId}
                onShippingSelect={setSelectedShippingId}
                selectedShippingCents={selectedShippingCents}
                selectedShipping={selectedShipping}
                selectedBumpsCents={selectedBumpsCents}
                selectedBumpItems={selectedBumpItems}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
              />
            )}

            {currentStep === 3 && (
              <Step3Payment
                compact
                elements={sortedElements}
                products={products}
                theme={theme}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                selectedShippingCents={selectedShippingCents}
                formValues={formValues}
                address={address}
                selectedShipping={selectedShipping}
                selectedBumpsCents={selectedBumpsCents}
                selectedBumpItems={selectedBumpItems}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
              />
            )}

            <StepNavigation
              currentStep={currentStep}
              totalSteps={3}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              theme={theme}
            />
          </div>
        )}

        {/* ===== PHYSICAL PRODUCT: 2 STEPS MODE ===== */}
        {isPhysical && totalSteps === 2 && (
          <div className="space-y-3">
            {/* Step 1: Identificação + Endereço + Frete */}
            {currentStep === 1 && (
              <>
                <Step1Identification
                  compact
                  elements={sortedElements}
                  products={products}
                  formValues={formValues}
                  noEmail={noEmail}
                  setNoEmail={setNoEmail}
                  onInputChange={handleInputChange}
                  theme={theme}
                  selectedShippingCents={selectedShippingCents}
                  selectedShipping={selectedShipping}
                  selectedBumps={selectedBumps}
                  onToggleBump={toggleBump}
                  selectedBumpsCents={selectedBumpsCents}
                  selectedBumpItems={selectedBumpItems}
                  quantity={quantity}
                  onQuantityChange={handleQuantityChange}
                />
                <Step2Address
                  compact
                  elements={sortedElements}
                  products={products}
                  theme={theme}
                  address={address}
                  onAddressChange={setAddress}
                  onCepChange={handleCepChange}
                  onCepLookup={() => lookupCep(address.cep)}
                  cepLoading={cepLoading}
                  cepFound={cepFound}
                  shippingOptions={shippingOptions}
                  selectedShippingId={selectedShippingId}
                  onShippingSelect={setSelectedShippingId}
                  selectedShippingCents={selectedShippingCents}
                  selectedShipping={selectedShipping}
                  selectedBumpsCents={selectedBumpsCents}
                  selectedBumpItems={selectedBumpItems}
                  quantity={quantity}
                  onQuantityChange={handleQuantityChange}
                />
              </>
            )}

            {/* Step 2: Pagamento */}
            {currentStep === 2 && (
              <Step3Payment
                compact
                elements={sortedElements}
                products={products}
                theme={theme}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                selectedShippingCents={selectedShippingCents}
                formValues={formValues}
                address={address}
                selectedShipping={selectedShipping}
                selectedBumpsCents={selectedBumpsCents}
                selectedBumpItems={selectedBumpItems}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
              />
            )}

            <StepNavigation
              currentStep={currentStep}
              totalSteps={2}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              theme={theme}
            />
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
};

// ============================
// Step Navigation Buttons
// ============================
function StepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting,
  theme,
}: {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  theme: CheckoutTheme;
}) {
  return (
    <div className="flex items-center gap-3">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-2 py-3 px-5 rounded-2xl text-sm font-semibold transition-all hover:opacity-80"
          style={{
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.text,
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
      )}

      {currentStep < totalSteps && (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryText,
          }}
        >
          Continuar
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================
// Shared: Form field renderer
// ============================
const EMAIL_DOMAINS = ['@gmail.com', '@hotmail.com', '@outlook.com', '@live.com', '@yahoo.com'];

function FormFieldShared({ field, formValues, onInputChange, theme, inputBorderRadius, showInputIcons = true }: {
  field: any;
  formValues: Record<string, string>;
  onInputChange: (name: string, type: string, value: string) => void;
  theme: CheckoutTheme;
  inputBorderRadius?: string;
  showInputIcons?: boolean;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const ICONS: Record<string, React.ReactNode> = {
    mail: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    phone: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    user: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    'credit-card': <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  };

  const value = formValues[field.name] || '';
  const isEmail = field.type === 'email';

  // Email suggestions: show when typing, has text, no @ yet or partial domain
  const emailPrefix = isEmail && value ? value.split('@')[0] : '';
  const hasAt = value.includes('@');
  const typedDomain = hasAt ? '@' + value.split('@')[1] : '';
  const suggestions = isEmail && value && emailPrefix
    ? EMAIL_DOMAINS
        .filter((d) => !hasAt || d.startsWith(typedDomain))
        .filter((d) => !hasAt || typedDomain !== d) // hide if already complete
        .map((d) => emailPrefix + d)
    : [];

  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: theme.colors.textMuted }}>
        {field.label}
      </label>
      <div className="relative">
        {showInputIcons && field.icon && ICONS[field.icon] && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.colors.textMuted }}>
            {ICONS[field.icon]}
          </span>
        )}
        <input
          type={field.type === 'cpf' ? 'text' : field.type}
          value={value}
          onChange={(e) => {
            onInputChange(field.name, field.type, e.target.value);
            if (isEmail) setShowSuggestions(true);
          }}
          onFocus={() => isEmail && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={field.placeholder}
          autoComplete="off"
          className="w-full text-sm py-3 pr-4 transition-all"
          style={{
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: inputBorderRadius || '12px',
            paddingLeft: showInputIcons && field.icon ? '40px' : '12px',
            color: theme.colors.text,
            outline: 'none',
          }}
        />

        {/* Email autocomplete suggestions */}
        {isEmail && showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg overflow-hidden shadow-lg"
            style={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full text-left px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{
                  color: theme.colors.text,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = theme.colors.background; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onInputChange(field.name, field.type, suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper for backward compat with renderFormFieldShared calls
function renderFormFieldShared(field: any, formValues: Record<string, string>, onInputChange: (name: string, type: string, value: string) => void, theme: CheckoutTheme, inputBorderRadius?: string, showInputIcons?: boolean) {
  return <FormFieldShared key={field.id} field={field} formValues={formValues} onInputChange={onInputChange} theme={theme} inputBorderRadius={inputBorderRadius} showInputIcons={showInputIcons ?? true} />;
}

// ============================
// Shared: Form card renderer
// ============================
function renderFormCard(
  element: CheckoutElement,
  theme: CheckoutTheme,
  formValues: Record<string, string>,
  noEmail: boolean,
  setNoEmail: (v: boolean) => void,
  onInputChange: (name: string, type: string, value: string) => void,
  compact?: boolean,
) {
  const fields = element.props.fields || [];
  const enabledFields = fields.filter((f: any) => f.enabled);
  const showCheckbox = element.props.showNoEmailCheckbox;
  const iconColor = element.props.titleIconColor || '#2957A4';
  const showTitleIcon = element.props.showTitleIcon ?? true;

  return (
    <div
      key={element.id}
      style={compact ? { ...element.styles } : {
        backgroundColor: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius,
        ...element.styles,
      }}
      className={compact ? '' : 'p-5'}
    >
      <div className="flex items-center gap-2 mb-4">
        {showTitleIcon && (
          <span style={{ color: iconColor }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
        )}
        <h2 className="font-semibold text-sm" style={{ color: theme.colors.text }}>
          {element.props.title || 'Identificação'}
        </h2>
      </div>
      <div className="space-y-3.5">
        {enabledFields
          .filter((f: any) => !(f.name === 'email' && noEmail))
          .map((f: any) => (
            <div key={f.id || f.name}>
              {renderFormFieldShared(f, formValues, onInputChange, theme, element.props.inputBorderRadius, element.props.showInputIcons)}
              {showCheckbox && f.name === 'email' && !noEmail && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={noEmail}
                    onChange={(e) => setNoEmail(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: element.props.checkboxColor || theme.colors.primary || '#2957A4' }}
                  />
                  <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                    {element.props.noEmailLabel || 'Não tenho e-mail'}
                  </span>
                </label>
              )}
            </div>
          ))}
        {showCheckbox && noEmail && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noEmail}
              onChange={(e) => setNoEmail(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: element.props.checkboxColor || theme.colors.primary || '#2957A4' }}
            />
            <span className="text-xs" style={{ color: theme.colors.textMuted }}>
              {element.props.noEmailLabel || 'Não tenho e-mail'}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

// ============================
// Shared: Address form renderer
// ============================
function renderAddressCard(
  element: CheckoutElement | undefined,
  theme: CheckoutTheme,
  address: AddressData,
  onAddressChange: (addr: AddressData) => void,
  onCepChange: (value: string) => void,
  onCepLookup: () => void,
  cepLoading: boolean,
  cepFound: boolean,
  compact?: boolean,
) {
  const title = element?.props?.title || 'Endereço de Entrega';
  const cepPlaceholder = element?.props?.cepPlaceholder || '00000-000';
  const showComplemento = element?.props?.showComplemento ?? true;
  const showTitleIcon = element?.props?.showTitleIcon ?? true;
  const showCepSearchIcon = element?.props?.showCepSearchIcon ?? true;
  const cepSearchIconColor = element?.props?.cepSearchIconColor || theme.colors.primary;
  const addrInputRadius = element?.props?.inputBorderRadius || '12px';
  const titleColor = element?.props?.titleColor || theme.colors.text;
  const iconColor = element?.props?.iconColor || '#2957A4';
  const labelColor = element?.props?.labelColor || theme.colors.textMuted;
  const inputBg = element?.props?.inputBgColor || theme.colors.background;
  const inputBorder = element?.props?.inputBorderColor || theme.colors.border;
  const inputText = element?.props?.inputTextColor || theme.colors.text;

  const inputStyle = {
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: addrInputRadius,
    color: inputText,
    outline: 'none',
  };

  return (
    <div
      style={compact ? (element?.styles || {}) : {
        backgroundColor: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius,
        ...(element?.styles || {}),
      }}
      className={compact ? '' : 'p-5'}
    >
      <div className="flex items-center gap-2 mb-4">
        {showTitleIcon && (
          <span style={{ color: iconColor }}>
            <MapPin className="w-4 h-4" />
          </span>
        )}
        <h2 className="font-semibold text-sm" style={{ color: titleColor }}>
          {title}
        </h2>
      </div>

      <div className="space-y-3">
        {/* CEP - preenchimento automático via ViaCEP ao digitar 8 dígitos */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: labelColor }}>CEP</label>
          <div className="relative">
            <input
              type="text"
              value={address.cep}
              onChange={(e) => onCepChange(e.target.value)}
              placeholder={cepPlaceholder}
              className={`w-full text-sm py-3 pl-3 transition-all ${showCepSearchIcon ? 'pr-10' : 'pr-3'}`}
              style={inputStyle}
            />
            {showCepSearchIcon && (
              <button
                type="button"
                onClick={onCepLookup}
                disabled={cepLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: cepSearchIconColor }}
              >
                {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            )}
          </div>
          {cepFound && (
            <p className="text-[11px] mt-1" style={{ color: theme.colors.primary }}>CEP encontrado</p>
          )}
        </div>

        {/* Rua (preenchido automaticamente pelo CEP) */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: labelColor }}>Rua</label>
          <input type="text" value={address.rua} onChange={(e) => onAddressChange({ ...address, rua: e.target.value })} placeholder="Rua, avenida, etc." className="w-full text-sm py-3 px-3 transition-all" style={inputStyle} />
        </div>

        {/* Número e Complemento */}
        <div className={`grid gap-3 ${showComplemento ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: labelColor }}>Número</label>
            <input type="text" value={address.numero} onChange={(e) => onAddressChange({ ...address, numero: e.target.value })} placeholder="Nº" className="w-full text-sm py-3 px-3 transition-all" style={inputStyle} />
          </div>
          {showComplemento && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: labelColor }}>Complemento</label>
              <input type="text" value={address.complemento} onChange={(e) => onAddressChange({ ...address, complemento: e.target.value })} placeholder="Apto, bloco..." className="w-full text-sm py-3 px-3 transition-all" style={inputStyle} />
            </div>
          )}
        </div>

        {/* Bairro (preenchido automaticamente pelo CEP) */}
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: labelColor }}>Bairro</label>
          <input type="text" value={address.bairro} onChange={(e) => onAddressChange({ ...address, bairro: e.target.value })} placeholder="Bairro" className="w-full text-sm py-3 px-3 transition-all" style={inputStyle} />
        </div>

        {/* Cidade e Estado (preenchidos automaticamente pelo CEP) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: labelColor }}>Cidade</label>
            <input type="text" value={address.cidade} onChange={(e) => onAddressChange({ ...address, cidade: e.target.value })} placeholder="Cidade" className="w-full text-sm py-3 px-3 transition-all" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: labelColor }}>Estado</label>
            <input type="text" value={address.estado} onChange={(e) => onAddressChange({ ...address, estado: e.target.value })} placeholder="UF" maxLength={2} className="w-full text-sm py-3 px-3 transition-all" style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================
// DIGITAL: Single Page Checkout
// ============================
function SinglePageCheckout({
  checkout,
  elements,
  products,
  formValues,
  noEmail,
  setNoEmail,
  onInputChange,
  onSubmit,
  isSubmitting,
  theme,
  selectedBumps,
  onToggleBump,
  selectedBumpsCents,
  selectedBumpItems = [],
  quantity = 1,
  onQuantityChange,
  compact,
}: {
  checkout: Checkout;
  elements: CheckoutElement[];
  products: CheckoutProduct[];
  formValues: Record<string, string>;
  noEmail: boolean;
  setNoEmail: (v: boolean) => void;
  onInputChange: (name: string, type: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  theme: CheckoutTheme;
  selectedBumps: string[];
  onToggleBump: (id: string) => void;
  selectedBumpsCents: number;
  selectedBumpItems?: { id: string; name: string; price_cents: number }[];
  quantity?: number;
  onQuantityChange?: (q: number) => void;
  compact?: boolean;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
      {elements
        .filter((e) => e.type !== 'header' && e.type !== 'timer' && e.type !== 'address' && e.type !== 'step_indicator' && e.type !== 'pix_page')
        .map((element) => {
          if (element.type === 'form') {
            return renderFormCard(element, theme, formValues, noEmail, setNoEmail, onInputChange, compact);
          }

          if (element.type === 'cart_summary') {
            return (
              <div key={element.id} style={element.styles}>
                <CartSummaryElement props={element.props} theme={theme} products={products} shippingContext={{ selectedBumpsCents, selectedBumpItems, quantity, onQuantityChange }} compact={compact} />
              </div>
            );
          }

          if (element.type === 'order_bump') {
            return (
              <div key={element.id} style={element.styles}>
                <OrderBumpElement props={element.props} theme={theme} selectedBumps={selectedBumps} onToggleBump={onToggleBump} compact={compact} />
              </div>
            );
          }

          if (element.type === 'button') {
            return (
              <div key={element.id} style={element.styles}>
                <ElementRenderer element={element} theme={theme} products={products} onFormSubmit={onSubmit} isSubmitting={isSubmitting} compact={compact} />
              </div>
            );
          }

          return (
            <div key={element.id} style={element.styles}>
              <ElementRenderer element={element} theme={theme} products={products} compact={compact} />
            </div>
          );
        })}
    </form>
  );
}

// ============================
// PHYSICAL STEP 1: Identificação
// ============================
function Step1Identification({
  elements,
  products,
  formValues,
  noEmail,
  setNoEmail,
  onInputChange,
  theme,
  selectedShippingCents,
  selectedShipping,
  selectedBumps,
  onToggleBump,
  selectedBumpsCents,
  selectedBumpItems = [],
  quantity = 1,
  onQuantityChange,
  compact,
}: {
  elements: CheckoutElement[];
  products: CheckoutProduct[];
  formValues: Record<string, string>;
  noEmail: boolean;
  setNoEmail: (v: boolean) => void;
  onInputChange: (name: string, type: string, value: string) => void;
  theme: CheckoutTheme;
  selectedShippingCents: number;
  selectedShipping?: ShippingOption;
  selectedBumps: string[];
  onToggleBump: (id: string) => void;
  selectedBumpsCents: number;
  selectedBumpItems?: { id: string; name: string; price_cents: number }[];
  quantity?: number;
  onQuantityChange?: (q: number) => void;
  compact?: boolean;
}) {
  // Show: banner, cart_summary, form, text, testimonial, security_badge, payment_methods, order_bump
  // Hide: address, payment, button (those are in other steps)
  const step1Types = new Set(['banner', 'text', 'image', 'form', 'cart_summary', 'testimonial', 'security_badge', 'payment_methods', 'order_bump', 'divider', 'spacer']);

  return (
    <div className="space-y-3">
      {elements
        .filter((e) => step1Types.has(e.type))
        .map((element) => {
          if (element.type === 'form') {
            return renderFormCard(element, theme, formValues, noEmail, setNoEmail, onInputChange, compact);
          }

          if (element.type === 'cart_summary') {
            return (
              <div key={element.id} style={element.styles}>
                <CartSummaryElement
                  compact={compact}
                  props={element.props}
                  theme={theme}
                  products={products}
                  shippingContext={{ selectedShippingCents, selectedShippingName: selectedShipping?.name || '', selectedBumpsCents, selectedBumpItems, quantity, onQuantityChange }}
                />
              </div>
            );
          }

          if (element.type === 'order_bump') {
            return (
              <div key={element.id} style={element.styles}>
                <OrderBumpElement props={element.props} theme={theme} selectedBumps={selectedBumps} onToggleBump={onToggleBump} compact={compact} />
              </div>
            );
          }

          return (
            <div key={element.id} style={element.styles}>
              <ElementRenderer element={element} theme={theme} products={products} compact={compact} />
            </div>
          );
        })}
    </div>
  );
}

// ============================
// PHYSICAL STEP 2: Endereço + Frete
// ============================
function Step2Address({
  elements,
  products,
  theme,
  address,
  onAddressChange,
  onCepChange,
  onCepLookup,
  cepLoading,
  cepFound,
  shippingOptions,
  selectedShippingId,
  onShippingSelect,
  selectedShippingCents,
  selectedShipping,
  selectedBumpsCents = 0,
  selectedBumpItems = [],
  quantity = 1,
  onQuantityChange,
  compact,
}: {
  elements: CheckoutElement[];
  products: CheckoutProduct[];
  theme: CheckoutTheme;
  address: AddressData;
  onAddressChange: (addr: AddressData) => void;
  onCepChange: (value: string) => void;
  onCepLookup: () => void;
  cepLoading: boolean;
  cepFound: boolean;
  shippingOptions: ShippingOption[];
  selectedShippingId: string | null;
  onShippingSelect: (id: string) => void;
  selectedShippingCents: number;
  selectedShipping?: ShippingOption;
  selectedBumpsCents?: number;
  selectedBumpItems?: { id: string; name: string; price_cents: number }[];
  quantity?: number;
  onQuantityChange?: (q: number) => void;
  compact?: boolean;
}) {
  const addressElement = elements.find((e) => e.type === 'address');

  return (
    <div className="space-y-3">
      {/* Address form */}
      {renderAddressCard(addressElement, theme, address, onAddressChange, onCepChange, onCepLookup, cepLoading, cepFound, compact)}

      {/* Shipping selector */}
      {shippingOptions.length > 0 && (
        <ShippingSelector
          options={shippingOptions}
          selectedId={selectedShippingId}
          onSelect={onShippingSelect}
          theme={theme}
          compact={compact}
          displayProps={{
            title: addressElement?.props?.shippingBlockTitle || 'Opções de Frete',
            showIcon: addressElement?.props?.shippingBlockShowIcon ?? true,
            iconColor: addressElement?.props?.shippingBlockIconColor || undefined,
            selectedBorderColor: addressElement?.props?.shippingBlockSelectedBorderColor || undefined,
            selectedBgColor: addressElement?.props?.shippingBlockSelectedBgColor || undefined,
            optionTextColor: addressElement?.props?.shippingBlockOptionTextColor || undefined,
            optionMutedColor: addressElement?.props?.shippingBlockOptionMutedColor || undefined,
            priceColor: addressElement?.props?.shippingBlockPriceColor || undefined,
          }}
        />
      )}

      {/* Cart summary with shipping */}
      {elements.filter((e) => e.type === 'cart_summary').map((element) => (
        <div key={element.id} style={element.styles}>
          <CartSummaryElement
            props={element.props}
            theme={theme}
            products={products}
            shippingContext={{ selectedShippingCents, selectedShippingName: selectedShipping?.name || '', selectedBumpsCents, selectedBumpItems, quantity, onQuantityChange }}
            compact={compact}
          />
        </div>
      ))}
    </div>
  );
}

// ============================
// PHYSICAL STEP 3: Pagamento
// ============================
function Step3Payment({
  elements,
  products,
  theme,
  onSubmit,
  isSubmitting,
  selectedShippingCents,
  formValues,
  address,
  selectedShipping,
  selectedBumpsCents = 0,
  selectedBumpItems = [],
  quantity = 1,
  onQuantityChange,
  compact,
}: {
  elements: CheckoutElement[];
  products: CheckoutProduct[];
  theme: CheckoutTheme;
  onSubmit: () => void;
  isSubmitting: boolean;
  selectedShippingCents: number;
  formValues: Record<string, string>;
  address: AddressData;
  selectedShipping?: ShippingOption;
  selectedBumpsCents?: number;
  selectedBumpItems?: { id: string; name: string; price_cents: number }[];
  quantity?: number;
  onQuantityChange?: (q: number) => void;
  compact?: boolean;
}) {
  const mainProduct = products.find((p) => !p.is_upsell) || products[0];

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
      {/* Summary of customer info */}
      <div
        className={compact ? 'space-y-2' : 'p-4 space-y-2'}
        style={compact ? undefined : {
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius,
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>
          Resumo do Pedido
        </h3>
        <div className="space-y-1.5">
          {formValues.name && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: theme.colors.textMuted }}>Nome</span>
              <span style={{ color: theme.colors.text }}>{formValues.name}</span>
            </div>
          )}
          {formValues.cpf && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: theme.colors.textMuted }}>CPF</span>
              <span style={{ color: theme.colors.text }}>{formValues.cpf}</span>
            </div>
          )}
          {address.rua && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: theme.colors.textMuted }}>Endereço</span>
              <span className="text-right max-w-[60%]" style={{ color: theme.colors.text }}>
                {address.rua}, {address.numero}{address.complemento ? ` - ${address.complemento}` : ''} — {address.bairro}, {address.cidade}/{address.estado}
              </span>
            </div>
          )}
          {selectedShipping && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: theme.colors.textMuted }}>Frete</span>
              <span style={{ color: theme.colors.text }}>
                {selectedShipping.name} — {selectedShipping.price_cents === 0 ? 'Grátis' : `R$ ${(selectedShipping.price_cents / 100).toFixed(2).replace('.', ',')}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cart summary */}
      {elements.filter((e) => e.type === 'cart_summary').map((element) => (
        <div key={element.id} style={element.styles}>
          <CartSummaryElement
            props={element.props}
            theme={theme}
            products={products}
            shippingContext={{ selectedShippingCents, selectedShippingName: selectedShipping?.name || '', selectedBumpsCents, selectedBumpItems, quantity, onQuantityChange }}
            compact={compact}
          />
        </div>
      ))}

      {/* Payment elements */}
      {elements.filter((e) => e.type === 'payment').map((element) => (
        <div key={element.id} style={element.styles}>
          <ElementRenderer element={element} theme={theme} products={products} compact={compact} />
        </div>
      ))}

      {/* Submit button */}
      {elements.filter((e) => e.type === 'button').map((element) => (
        <div key={element.id} style={element.styles}>
          <ElementRenderer
            element={element}
            theme={theme}
            products={products}
            onFormSubmit={onSubmit}
            isSubmitting={isSubmitting}
            compact={compact}
          />
        </div>
      ))}

      {/* Payment methods */}
      {elements.filter((e) => e.type === 'payment_methods').map((element) => (
        <div key={element.id} style={element.styles}>
          <ElementRenderer element={element} theme={theme} products={products} compact={compact} />
        </div>
      ))}

      {/* Security badges */}
      {elements.filter((e) => e.type === 'security_badge').map((element) => (
        <div key={element.id} style={element.styles}>
          <ElementRenderer element={element} theme={theme} products={products} compact={compact} />
        </div>
      ))}
    </form>
  );
}

export default CheckoutRenderer;
