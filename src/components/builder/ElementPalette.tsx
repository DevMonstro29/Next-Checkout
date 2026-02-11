import { useDraggable } from '@dnd-kit/core';
import { CheckoutElementType, ELEMENT_LABELS } from '@/types/checkout';
import {
  Layout, Megaphone, Type, Image, ClipboardList, MapPin, ShoppingCart,
  Wallet, Clock, MousePointerClick, Minus, MoveVertical,
  MessageSquare, ShieldCheck, CreditCard, QrCode, ListOrdered, Gift,
} from 'lucide-react';

const ICON_MAP: Record<CheckoutElementType, React.ReactNode> = {
  header: <Layout className="w-4 h-4" />,
  banner: <Megaphone className="w-4 h-4" />,
  text: <Type className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  form: <ClipboardList className="w-4 h-4" />,
  address: <MapPin className="w-4 h-4" />,
  cart_summary: <ShoppingCart className="w-4 h-4" />,
  payment: <Wallet className="w-4 h-4" />,
  timer: <Clock className="w-4 h-4" />,
  button: <MousePointerClick className="w-4 h-4" />,
  divider: <Minus className="w-4 h-4" />,
  spacer: <MoveVertical className="w-4 h-4" />,
  testimonial: <MessageSquare className="w-4 h-4" />,
  security_badge: <ShieldCheck className="w-4 h-4" />,
  payment_methods: <CreditCard className="w-4 h-4" />,
  step_indicator: <ListOrdered className="w-4 h-4" />,
  order_bump: <Gift className="w-4 h-4" />,
  pix_page: <QrCode className="w-4 h-4" />,
};

const ALL_TYPES: CheckoutElementType[] = [
  'header', 'banner', 'text', 'image', 'form', 'address', 'cart_summary',
  'payment', 'timer', 'button', 'divider', 'spacer',
  'testimonial', 'security_badge', 'payment_methods', 'step_indicator', 'order_bump',
];

function DraggablePaletteItem({ type }: { type: CheckoutElementType }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 ${
        isDragging ? 'opacity-50 bg-neutral-100 dark:bg-neutral-700 border-brand-500/50' : ''
      }`}
    >
      <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-300 flex-shrink-0">
        {ICON_MAP[type]}
      </div>
      <span className="text-neutral-700 dark:text-neutral-300 text-sm font-medium">{ELEMENT_LABELS[type]}</span>
    </div>
  );
}

const ElementPalette = () => {
  return (
    <div className="space-y-1">
      <h3 className="text-neutral-400 dark:text-neutral-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
        Elementos
      </h3>
      {ALL_TYPES.map((type) => (
        <DraggablePaletteItem key={type} type={type} />
      ))}
    </div>
  );
};

export default ElementPalette;
