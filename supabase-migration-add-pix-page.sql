-- Migração: adicionar tipo 'pix_page' na constraint de checkout_elements
-- Execute no Supabase Dashboard > SQL Editor

ALTER TABLE checkout_elements
  DROP CONSTRAINT IF EXISTS checkout_elements_type_check;

ALTER TABLE checkout_elements
  ADD CONSTRAINT checkout_elements_type_check CHECK (type IN (
    'header', 'banner', 'text', 'image', 'form', 'address', 'cart_summary',
    'payment', 'timer', 'button', 'divider', 'spacer',
    'testimonial', 'security_badge', 'payment_methods', 'pix_page'
  ));
