-- Domínio personalizado por checkout (hospedar cada checkout em um domínio próprio)
ALTER TABLE checkouts
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

COMMENT ON COLUMN checkouts.custom_domain IS 'Domínio próprio para exibir este checkout (ex: pagamento.minhaloja.com.br). Deve apontar via DNS/CNAME para esta aplicação.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkouts_custom_domain
ON checkouts(custom_domain) WHERE custom_domain IS NOT NULL;
