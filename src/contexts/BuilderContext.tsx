import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Checkout,
  CheckoutElement,
  CheckoutProduct,
  CheckoutTheme,
  CheckoutSettings,
  CheckoutElementType,
  DEFAULT_ELEMENT_PROPS,
} from '@/types/checkout';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

type ActiveTab = 'elements' | 'theme' | 'product' | 'settings' | 'pix_page';

interface BuilderContextType {
  // State
  checkout: Checkout | null;
  elements: CheckoutElement[];
  products: CheckoutProduct[];
  selectedElementId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  activeTab: ActiveTab;

  // Actions
  loadCheckout: (id: string) => Promise<void>;
  saveCheckout: () => Promise<void>;
  setActiveTab: (tab: ActiveTab) => void;

  // Checkout
  updateCheckoutName: (name: string) => void;
  updateCheckoutSlug: (slug: string) => void;
  updateTheme: (theme: Partial<CheckoutTheme>) => void;
  updateThemeColors: (colors: Partial<CheckoutTheme['colors']>) => void;
  updateSettings: (settings: Partial<CheckoutSettings>) => void;

  // Elements
  selectElement: (id: string | null) => void;
  addElement: (type: CheckoutElementType, atIndex?: number) => void;
  removeElement: (id: string) => void;
  updateElementProps: (id: string, props: Record<string, any>) => void;
  updateElementStyles: (id: string, styles: Record<string, any>) => void;
  toggleElementVisibility: (id: string) => void;
  reorderElements: (oldIndex: number, newIndex: number) => void;

  // Products
  updateProduct: (id: string, data: Partial<CheckoutProduct>) => void;
  addProduct: () => void;
  removeProduct: (id: string) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

interface HistoryEntry {
  elements: CheckoutElement[];
  products: CheckoutProduct[];
  checkout: Checkout | null;
}

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [elements, setElements] = useState<CheckoutElement[]>([]);
  const [products, setProducts] = useState<CheckoutProduct[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('settings');

  // Undo/Redo
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const skipHistoryRef = useRef(false);

  const pushHistory = useCallback(() => {
    if (skipHistoryRef.current) return;
    const entry: HistoryEntry = {
      elements: JSON.parse(JSON.stringify(elements)),
      products: JSON.parse(JSON.stringify(products)),
      checkout: checkout ? JSON.parse(JSON.stringify(checkout)) : null,
    };
    // Remove any future entries if we've undone
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(entry);
    historyIndexRef.current = historyRef.current.length - 1;
    // Limit history size
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  }, [elements, products, checkout]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    pushHistory();
  }, [pushHistory]);

  // Load checkout from Supabase
  const loadCheckout = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const [checkoutRes, elementsRes, productsRes] = await Promise.all([
        supabase.from('checkouts').select('*').eq('id', id).single(),
        supabase.from('checkout_elements').select('*').eq('checkout_id', id).order('order_index'),
        supabase.from('checkout_products').select('*').eq('checkout_id', id).order('order_index'),
      ]);

      if (checkoutRes.error) throw checkoutRes.error;

      setCheckout(checkoutRes.data);

      // Ensure special elements always exist
      let loadedElements: CheckoutElement[] = elementsRes.data || [];

      // Auto-create pix_page if missing (managed separately from canvas)
      const hasPixPage = loadedElements.some((el) => el.type === 'pix_page');
      if (!hasPixPage) {
        loadedElements = [
          ...loadedElements,
          {
            id: uuidv4(),
            checkout_id: id,
            type: 'pix_page',
            props: { ...DEFAULT_ELEMENT_PROPS['pix_page'] },
            styles: {},
            order_index: loadedElements.length,
            visible: true,
          },
        ];
      }

      setElements(loadedElements);
      setProducts(productsRes.data || []);
      setSelectedElementId(null);
      setIsDirty(false);

      // Initialize history
      historyRef.current = [{
        elements: elementsRes.data || [],
        products: productsRes.data || [],
        checkout: checkoutRes.data,
      }];
      historyIndexRef.current = 0;
    } catch (err: any) {
      toast.error('Erro ao carregar checkout');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save checkout to Supabase
  const saveCheckout = useCallback(async () => {
    if (!checkout) return;
    setIsSaving(true);

    try {
      // Update checkout
      const { error: checkoutError } = await supabase
        .from('checkouts')
        .update({
          name: checkout.name,
          slug: checkout.slug,
          status: checkout.status,
          theme: checkout.theme,
          settings: checkout.settings,
        })
        .eq('id', checkout.id);

      if (checkoutError) throw checkoutError;

      // Delete existing elements and re-insert
      await supabase.from('checkout_elements').delete().eq('checkout_id', checkout.id);
      if (elements.length > 0) {
        const elementsToInsert = elements.map(({ id, ...rest }) => ({
          ...rest,
          checkout_id: checkout.id,
        }));
        const { error: elemError } = await supabase
          .from('checkout_elements')
          .insert(elementsToInsert);
        if (elemError) throw elemError;
      }

      // Delete existing products and re-insert
      await supabase.from('checkout_products').delete().eq('checkout_id', checkout.id);
      if (products.length > 0) {
        const productsToInsert = products.map(({ id, ...rest }) => ({
          ...rest,
          checkout_id: checkout.id,
        }));
        const { error: prodError } = await supabase
          .from('checkout_products')
          .insert(productsToInsert);
        if (prodError) throw prodError;
      }

      // Reload to get server-generated IDs
      const [newElements, newProducts] = await Promise.all([
        supabase.from('checkout_elements').select('*').eq('checkout_id', checkout.id).order('order_index'),
        supabase.from('checkout_products').select('*').eq('checkout_id', checkout.id).order('order_index'),
      ]);

      setElements(newElements.data || []);
      setProducts(newProducts.data || []);
      setIsDirty(false);
      toast.success('Checkout salvo!');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || ''));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [checkout, elements, products]);

  // Checkout updates
  const updateCheckoutName = useCallback((name: string) => {
    setCheckout((prev) => prev ? { ...prev, name } : null);
    markDirty();
  }, [markDirty]);

  const updateCheckoutSlug = useCallback((slug: string) => {
    setCheckout((prev) => prev ? { ...prev, slug } : null);
    markDirty();
  }, [markDirty]);

  const updateTheme = useCallback((partial: Partial<CheckoutTheme>) => {
    setCheckout((prev) => {
      if (!prev) return null;
      return { ...prev, theme: { ...prev.theme, ...partial } };
    });
    markDirty();
  }, [markDirty]);

  const updateThemeColors = useCallback((colors: Partial<CheckoutTheme['colors']>) => {
    setCheckout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        theme: { ...prev.theme, colors: { ...prev.theme.colors, ...colors } },
      };
    });
    markDirty();
  }, [markDirty]);

  const updateSettings = useCallback((partial: Partial<CheckoutSettings>) => {
    setCheckout((prev) => {
      if (!prev) return null;
      return { ...prev, settings: { ...prev.settings, ...partial } };
    });
    markDirty();
  }, [markDirty]);

  // Element actions
  const selectElement = useCallback((id: string | null) => {
    setSelectedElementId(id);
    if (id) setActiveTab('elements');
  }, []);

  const addElement = useCallback((type: CheckoutElementType, atIndex?: number) => {
    const newElement: CheckoutElement = {
      id: uuidv4(),
      checkout_id: checkout?.id || '',
      type,
      props: { ...DEFAULT_ELEMENT_PROPS[type] },
      styles: {},
      order_index: atIndex ?? elements.length,
      visible: true,
    };

    setElements((prev) => {
      const copy = [...prev];
      const insertAt = atIndex ?? copy.length;
      copy.splice(insertAt, 0, newElement);
      // Re-index
      return copy.map((el, i) => ({ ...el, order_index: i }));
    });
    setSelectedElementId(newElement.id);
    markDirty();
  }, [checkout, elements.length, markDirty]);

  const removeElement = useCallback((id: string) => {
    setElements((prev) => {
      const filtered = prev.filter((el) => el.id !== id);
      return filtered.map((el, i) => ({ ...el, order_index: i }));
    });
    if (selectedElementId === id) setSelectedElementId(null);
    markDirty();
  }, [selectedElementId, markDirty]);

  const updateElementProps = useCallback((id: string, props: Record<string, any>) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, props: { ...el.props, ...props } } : el
      )
    );
    markDirty();
  }, [markDirty]);

  const updateElementStyles = useCallback((id: string, styles: Record<string, any>) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, styles: { ...el.styles, ...styles } } : el
      )
    );
    markDirty();
  }, [markDirty]);

  const toggleElementVisibility = useCallback((id: string) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, visible: !el.visible } : el
      )
    );
    markDirty();
  }, [markDirty]);

  const reorderElements = useCallback((oldIndex: number, newIndex: number) => {
    setElements((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(oldIndex, 1);
      copy.splice(newIndex, 0, moved);
      return copy.map((el, i) => ({ ...el, order_index: i }));
    });
    markDirty();
  }, [markDirty]);

  // Product actions
  const updateProduct = useCallback((id: string, data: Partial<CheckoutProduct>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    markDirty();
  }, [markDirty]);

  const addProduct = useCallback(() => {
    const newProduct: CheckoutProduct = {
      id: uuidv4(),
      checkout_id: checkout?.id || '',
      name: 'Novo Produto',
      amount_cents: 0,
      description: '',
      is_upsell: products.length > 0,
      redirect_url: '',
      order_index: products.length,
      product_type: 'digital',
      shipping_options: [],
    };
    setProducts((prev) => [...prev, newProduct]);
    markDirty();
  }, [checkout, products.length, markDirty]);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    markDirty();
  }, [markDirty]);

  // Undo/Redo
  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setElements(JSON.parse(JSON.stringify(entry.elements)));
    setProducts(JSON.parse(JSON.stringify(entry.products)));
    if (entry.checkout) setCheckout(JSON.parse(JSON.stringify(entry.checkout)));
    setIsDirty(true);
    skipHistoryRef.current = false;
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setElements(JSON.parse(JSON.stringify(entry.elements)));
    setProducts(JSON.parse(JSON.stringify(entry.products)));
    if (entry.checkout) setCheckout(JSON.parse(JSON.stringify(entry.checkout)));
    setIsDirty(true);
    skipHistoryRef.current = false;
  }, []);

  return (
    <BuilderContext.Provider
      value={{
        checkout,
        elements,
        products,
        selectedElementId,
        isDirty,
        isSaving,
        isLoading,
        activeTab,
        loadCheckout,
        saveCheckout,
        setActiveTab,
        updateCheckoutName,
        updateCheckoutSlug,
        updateTheme,
        updateThemeColors,
        updateSettings,
        selectElement,
        addElement,
        removeElement,
        updateElementProps,
        updateElementStyles,
        toggleElementVisibility,
        reorderElements,
        updateProduct,
        addProduct,
        removeProduct,
        undo,
        redo,
        canUndo,
        canRedo,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return context;
}
