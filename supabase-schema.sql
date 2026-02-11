-- ============================================
-- Schema do Sistema de Checkout Builder
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================

-- Tabela de checkouts
CREATE TABLE IF NOT EXISTS checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Novo Checkout',
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  custom_domain TEXT UNIQUE,
  theme JSONB NOT NULL DEFAULT '{
    "colors": {
      "background": "#f5f7fa",
      "card": "#ffffff",
      "border": "#e5e7eb",
      "primary": "#22c55e",
      "primaryText": "#ffffff",
      "text": "#1a1a2e",
      "textMuted": "#6b7280",
      "timer": "#ef4444",
      "banner": "#DBEAFE",
      "bannerText": "#000000"
    },
    "font": {
      "family": "Inter",
      "headingWeight": "700",
      "bodyWeight": "400"
    },
    "borderRadius": "16px",
    "maxWidth": "448px",
    "customCSS": ""
  }'::jsonb,
  settings JSONB NOT NULL DEFAULT '{
    "logoUrl": "/logo.png",
    "showSecurityBadge": true,
    "securityText": "PAGAMENTO 100% SEGURO",
    "paymentMethods": ["pix"],
    "pixExpirationMinutes": 30,
    "showInstructions": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de elementos do checkout
CREATE TABLE IF NOT EXISTS checkout_elements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_id UUID REFERENCES checkouts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'header', 'banner', 'text', 'image', 'form', 'address', 'cart_summary',
    'payment', 'timer', 'button', 'divider', 'spacer',
    'testimonial', 'security_badge', 'payment_methods', 'step_indicator', 'order_bump', 'pix_page'
  )),
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  styles JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de produtos do checkout
CREATE TABLE IF NOT EXISTS checkout_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_id UUID REFERENCES checkouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Produto',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  is_upsell BOOLEAN NOT NULL DEFAULT false,
  redirect_url TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkouts_user_id ON checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_slug ON checkouts(slug);
CREATE INDEX IF NOT EXISTS idx_checkout_elements_checkout_id ON checkout_elements(checkout_id);
CREATE INDEX IF NOT EXISTS idx_checkout_products_checkout_id ON checkout_products(checkout_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER checkouts_updated_at
  BEFORE UPDATE ON checkouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER checkout_elements_updated_at
  BEFORE UPDATE ON checkout_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER checkout_products_updated_at
  BEFORE UPDATE ON checkout_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabela de configurações do usuário (API keys por usuário)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  portopag_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_products ENABLE ROW LEVEL SECURITY;

-- Checkouts: owner can CRUD, anyone can read published
CREATE POLICY "Users can manage own checkouts"
  ON checkouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read published checkouts"
  ON checkouts FOR SELECT
  USING (status = 'published');

-- Elements: owner can CRUD via checkout, anyone can read from published checkouts
CREATE POLICY "Users can manage elements of own checkouts"
  ON checkout_elements FOR ALL
  USING (checkout_id IN (SELECT id FROM checkouts WHERE user_id = auth.uid()))
  WITH CHECK (checkout_id IN (SELECT id FROM checkouts WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can read elements of published checkouts"
  ON checkout_elements FOR SELECT
  USING (checkout_id IN (SELECT id FROM checkouts WHERE status = 'published'));

-- Products: owner can CRUD, anyone can read from published
CREATE POLICY "Users can manage products of own checkouts"
  ON checkout_products FOR ALL
  USING (checkout_id IN (SELECT id FROM checkouts WHERE user_id = auth.uid()))
  WITH CHECK (checkout_id IN (SELECT id FROM checkouts WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can read products of published checkouts"
  ON checkout_products FOR SELECT
  USING (checkout_id IN (SELECT id FROM checkouts WHERE status = 'published'));
