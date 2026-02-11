import { useState } from "react";
import CheckoutHeader from "@/components/checkout/CheckoutHeader";
import CartSummary from "@/components/checkout/CartSummary";
import IdentificationForm from "@/components/checkout/IdentificationForm";
import PixPayment from "@/components/checkout/PixPayment";

interface PixPaymentData {
  transaction_id: string;
  pix_code: string;
  pix_qr_code: string;
  amount: string;
  status: string;
  expires_at: string;
}

interface CheckoutPageProps {
  productName: string;
  amountCents: number;
  amountFormatted: string;
  bannerText: React.ReactNode;
  redirectUrl?: string;
}

const CheckoutPage = ({
  productName,
  amountCents,
  amountFormatted,
  bannerText,
  redirectUrl,
}: CheckoutPageProps) => {
  const [step, setStep] = useState<"form" | "pix">("form");
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  const [customerName, setCustomerName] = useState("");

  const handlePaymentCreated = (data: PixPaymentData) => {
    setPaymentData(data);
    setStep("pix");
  };

  return (
    <div className="min-h-screen bg-checkout-bg">
      <div className="max-w-md mx-auto px-4 pb-8">
        <CheckoutHeader />

        {step === "form" && (
          <>
            {/* Alert banner */}
            <div className="bg-[#DBEAFE] border border-[#DBEAFE] rounded-2xl p-4 mb-5 fade-in">
              <p className="text-black text-sm leading-relaxed text-center">
                {bannerText}
              </p>
            </div>

            <div className="mb-5">
              <CartSummary
                productName={productName}
                amountFormatted={amountFormatted}
              />
            </div>

            <IdentificationForm
              productName={productName}
              amountCents={amountCents}
              onSubmit={(data) => {
                handlePaymentCreated(data);
              }}
              onNameCapture={setCustomerName}
            />
          </>
        )}

        {step === "pix" && paymentData && (
          <PixPayment
            paymentData={paymentData}
            customerName={customerName}
            redirectUrl={redirectUrl}
          />
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
