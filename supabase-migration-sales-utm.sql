-- Adicionar colunas UTM na tabela sales para atribuição de campanhas
-- Execute no Supabase Dashboard > SQL Editor

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT;

CREATE INDEX IF NOT EXISTS idx_sales_utm_campaign ON sales(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_utm_source ON sales(utm_source) WHERE utm_source IS NOT NULL;

COMMENT ON COLUMN sales.utm_source IS 'Origem da campanha (ex: FB, google)';
COMMENT ON COLUMN sales.utm_campaign IS 'Nome/ID da campanha';
COMMENT ON COLUMN sales.utm_medium IS 'Meio (ex: cpc, adset)';
COMMENT ON COLUMN sales.utm_content IS 'Conteúdo/anúncio';
COMMENT ON COLUMN sales.utm_term IS 'Termo (ex: placement)';
