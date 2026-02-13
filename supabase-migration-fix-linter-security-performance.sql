-- ============================================
-- Correções do Database Linter (Supabase Advisors)
-- Migração 1: search_path + RLS otimizado + políticas unificadas
-- Migração 2: Split de políticas para evitar múltiplas permissivas
-- ============================================

-- === MIGRAÇÃO 1: fix_security_and_performance_linter ===
-- 1. Fix function search_path (security)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, approved)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''), false)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Drop existing policies to replace with optimized ones
DROP POLICY IF EXISTS "Users can manage own checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Anyone can read published checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Users can manage elements of own checkouts" ON public.checkout_elements;
DROP POLICY IF EXISTS "Anyone can read elements of published checkouts" ON public.checkout_elements;
DROP POLICY IF EXISTS "Users can manage products of own checkouts" ON public.checkout_products;
DROP POLICY IF EXISTS "Anyone can read products of published checkouts" ON public.checkout_products;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view sales of own checkouts" ON public.sales;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- 3. Create optimized RLS policies (auth.uid() wrapped in select + unified policies)
CREATE POLICY "Users can manage own checkouts"
  ON public.checkouts FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Anyone can read published or own checkouts"
  ON public.checkouts FOR SELECT
  USING (status = 'published' OR (select auth.uid()) = user_id);

CREATE POLICY "Users can manage elements of own checkouts"
  ON public.checkout_elements FOR ALL
  USING (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())))
  WITH CHECK (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));

CREATE POLICY "Anyone can read elements of published or own checkouts"
  ON public.checkout_elements FOR SELECT
  USING (
    checkout_id IN (SELECT id FROM public.checkouts WHERE status = 'published')
    OR checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can manage products of own checkouts"
  ON public.checkout_products FOR ALL
  USING (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())))
  WITH CHECK (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));

CREATE POLICY "Anyone can read products of published or own checkouts"
  ON public.checkout_products FOR SELECT
  USING (
    checkout_id IN (SELECT id FROM public.checkouts WHERE status = 'published')
    OR checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view sales of own checkouts"
  ON public.sales FOR SELECT
  USING (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = user_id);

-- === MIGRAÇÃO 2: fix_multiple_permissive_policies_merge ===
DROP POLICY IF EXISTS "Users can manage own checkouts" ON public.checkouts;
CREATE POLICY "Users can insert own checkouts"
  ON public.checkouts FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own checkouts"
  ON public.checkouts FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own checkouts"
  ON public.checkouts FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage elements of own checkouts" ON public.checkout_elements;
CREATE POLICY "Users can insert elements of own checkouts"
  ON public.checkout_elements FOR INSERT
  WITH CHECK (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));
CREATE POLICY "Users can update elements of own checkouts"
  ON public.checkout_elements FOR UPDATE
  USING (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())))
  WITH CHECK (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));
CREATE POLICY "Users can delete elements of own checkouts"
  ON public.checkout_elements FOR DELETE
  USING (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can manage products of own checkouts" ON public.checkout_products;
CREATE POLICY "Users can insert products of own checkouts"
  ON public.checkout_products FOR INSERT
  WITH CHECK (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));
CREATE POLICY "Users can update products of own checkouts"
  ON public.checkout_products FOR UPDATE
  USING (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())))
  WITH CHECK (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));
CREATE POLICY "Users can delete products of own checkouts"
  ON public.checkout_products FOR DELETE
  USING (checkout_id IN (SELECT id FROM public.checkouts WHERE user_id = (select auth.uid())));
