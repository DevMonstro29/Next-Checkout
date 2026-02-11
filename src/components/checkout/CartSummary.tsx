interface CartSummaryProps {
  productName: string;
  amountFormatted: string;
}

const CartSummary = ({ productName, amountFormatted }: CartSummaryProps) => {
  return (
    <div className="bg-checkout-card border border-checkout-border rounded-2xl p-5 checkout-card-glow fade-in">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-checkout-text text-sm font-medium">
              {productName}
            </p>
            <p className="text-checkout-text-muted text-xs">1 un.</p>
          </div>
          <p className="text-checkout-text text-sm font-semibold">
            R$ {amountFormatted}
          </p>
        </div>

        <div className="border-t border-checkout-border" />

        <div className="flex justify-between items-center">
          <span className="text-checkout-text-muted text-sm">Subtotal</span>
          <span className="text-checkout-text text-sm">
            R$ {amountFormatted}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-checkout-text font-semibold">Total</span>
          <span className="text-checkout-success font-bold text-lg">
            R$ {amountFormatted}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
