import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilder } from '@/contexts/BuilderContext';
import { RenderContext } from './elements/ElementRenderer';
import AddressElement from './elements/AddressElement';
import ShippingSelector from './elements/ShippingSelector';
import CartSummaryElement from './elements/CartSummaryElement';
import { CheckoutElement } from '@/types/checkout';
import { Eye, EyeOff, Trash2, GripVertical } from 'lucide-react';

const SHIPPING_BLOCK_ID = 'shipping-block';

/**
 * Bloco selecionável para o elemento Opções de Frete - permite editar no painel de propriedades.
 */
function SelectableShippingBlock({
  addressElement,
  theme,
  children,
}: {
  addressElement: CheckoutElement | undefined;
  theme: any;
  children: React.ReactNode;
}) {
  const { selectedElementId, selectElement } = useBuilder();
  const isSelected = selectedElementId === SHIPPING_BLOCK_ID;

  return (
    <div className="relative group">
      <div
        onClick={() => selectElement(SHIPPING_BLOCK_ID)}
        className={`relative rounded-lg transition-all cursor-pointer ${
          isSelected
            ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-900'
            : 'hover:ring-1 hover:ring-neutral-400 dark:hover:ring-neutral-500 hover:ring-offset-1 hover:ring-offset-neutral-100 dark:hover:ring-offset-neutral-900'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Bloco arrastável e selecionável para elementos do Passo 2.
 */
function SortableStep2Block({
  element,
  theme,
  children,
}: {
  element: CheckoutElement;
  theme: any;
  children: React.ReactNode;
}) {
  const { selectedElementId, selectElement, toggleElementVisibility, removeElement } = useBuilder();
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50 opacity-70' : ''} ${!element.visible ? 'opacity-40' : ''}`}
    >
      <div
        onClick={() => selectElement(element.id)}
        className={`relative rounded-lg transition-all cursor-pointer ${
          isSelected
            ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-neutral-100 dark:ring-offset-neutral-900'
            : 'hover:ring-1 hover:ring-neutral-400 dark:hover:ring-neutral-500 hover:ring-offset-1 hover:ring-offset-neutral-100 dark:hover:ring-offset-neutral-900'
        }`}
      >
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
              onClick={(e) => {
                e.stopPropagation();
                toggleElementVisibility(element.id);
              }}
              className="p-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-transparent rounded-md text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm"
              title={element.visible ? 'Ocultar' : 'Mostrar'}
            >
              {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeElement(element.id);
              }}
              className="p-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-transparent rounded-md text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shadow-sm"
              title="Remover"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Preview do Passo 2 (Endereço) no builder, exibido quando checkout tem 3 passos.
 * Elementos arrastáveis e editáveis: endereço, opções de frete, resumo do carrinho.
 */
const Step2AddressPreview = () => {
  const { elements, checkout, products } = useBuilder();
  const theme = checkout?.theme;

  const addressElement = elements.find((e) => e.type === 'address');
  const cartSummaryElements = elements.filter((e) => e.type === 'cart_summary');
  const mainProduct = products.find((p) => !p.is_upsell) || products[0];
  const shippingOptions = mainProduct?.shipping_options || [];

  const step2Items = [...(addressElement ? [addressElement] : []), ...cartSummaryElements].sort(
    (a, b) => a.order_index - b.order_index
  );
  const sortableIds = step2Items.map((e) => e.id);

  return (
    <RenderContext.Provider value={{ theme, products, checkoutSteps: 3 }}>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {step2Items.map((element) => (
            <div key={element.id}>
              <SortableStep2Block element={element} theme={theme}>
                {element.type === 'address' ? (
                  <div style={element.styles}>
                    <AddressElement props={element.props} theme={theme} isBuilder />
                  </div>
                ) : (
                  <div style={element.styles}>
                    <CartSummaryElement
                      props={element.props}
                      theme={theme}
                      products={products}
                      shippingContext={{
                        selectedShippingCents: shippingOptions[0]?.price_cents ?? 0,
                        selectedShippingName: shippingOptions[0]?.name ?? '',
                        selectedBumpsCents: 0,
                        selectedBumpItems: [],
                        quantity: 1,
                      }}
                    />
                  </div>
                )}
              </SortableStep2Block>
              {element.type === 'address' && shippingOptions.length > 0 && (
                <div className="mt-4">
                  <SelectableShippingBlock addressElement={addressElement} theme={theme}>
                    <ShippingSelector
                      options={shippingOptions}
                      selectedId={shippingOptions[0]?.id}
                      onSelect={() => {}}
                      theme={theme}
                      isBuilder
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
                  </SelectableShippingBlock>
                </div>
              )}
            </div>
          ))}

          {step2Items.length === 0 && (
            <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-sm rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600">
              Adicione o elemento Endereço e configure opções de frete no produto para ver o preview do Passo 2.
            </div>
          )}
        </div>
      </SortableContext>
    </RenderContext.Provider>
  );
};

export default Step2AddressPreview;
