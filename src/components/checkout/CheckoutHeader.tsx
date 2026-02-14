import { Shield } from "lucide-react";

const CheckoutHeader = () => {
  return (
    <div className="flex items-center justify-between py-2 px-2 pb-1">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" className="h-12 object-contain" />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Shield className="w-6 h-6 text-checkout-success fill-checkout-success" />
        <span className="text-checkout-success font-bold tracking-tight leading-tight">
          PAGAMENTO
          <br />
          100% SEGURO
        </span>
      </div>
    </div>
  );
};

export default CheckoutHeader;
