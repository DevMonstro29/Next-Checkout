-- Migração: adicionar tipos 'address' e 'payment_methods' na constraint de checkout_elements
-- Execute no Supabase Dashboard > SQL Editor

-- Remove a constraint antiga
ALTER TABLE checkout_elements
  DROP CONSTRAINT IF EXISTS checkout_elements_type_check;

-- Adiciona nova constraint com todos os tipos suportados
ALTER TABLE checkout_elements
  ADD CONSTRAINT checkout_elements_type_check CHECK (type IN (
    'header', 'banner', 'text', 'image', 'form', 'address', 'cart_summary',
    'payment', 'timer', 'button', 'divider', 'spacer',
    'testimonial', 'security_badge', 'payment_methods'
  ));
