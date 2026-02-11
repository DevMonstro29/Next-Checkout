import CheckoutPage from "@/components/checkout/CheckoutPage";

const Upsell2 = () => {
  return (
    <CheckoutPage
      productName="Ressarcimento Extra"
      amountCents={3250}
      amountFormatted="32,50"
      bannerText={
        <>
          A sua <span className="font-bold">Tarifa Bancária</span> já está
          vinculada ao seu CPF. Você possui{" "}
          <span className="font-bold">5 minutos</span> para finalizar o
          pagamento, essa é a última etapa para você receber o seu valor de{" "}
          <span className="font-bold">R$8.965,50</span> na sua{" "}
          <span className="font-bold">CHAVE PIX</span> cadastrada.
        </>
      }
    />
  );
};

export default Upsell2;
