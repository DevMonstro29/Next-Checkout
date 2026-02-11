-- Tabela de vendas (transações PIX geradas pelos checkouts)
-- Execute no Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_id UUID REFERENCES checkouts(id) ON DELETE SET NULL,
  transaction_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_cpf TEXT,
  amount_cents INTEGER NOT NULL,
  product_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sales_checkout_id ON sales(checkout_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales(transaction_id);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Donadores do checkout podem ver vendas dos próprios checkouts (via service role no backend)
-- Para acesso pelo backend com service role, RLS pode ser contornado.
-- Política: usuário autenticado vê vendas dos checkouts que possui
CREATE POLICY "Users can view sales of own checkouts"
  ON sales FOR SELECT
  USING (
    checkout_id IN (SELECT id FROM checkouts WHERE user_id = auth.uid())
  );

-- Inserção/atualização apenas pelo backend (service role)
-- Nenhuma policy de INSERT para auth.uid() - o backend usa service role para inserir
COMMENT ON TABLE sales IS 'Vendas/transações PIX geradas pelo create-pix-payment; listadas no painel Vendas';
