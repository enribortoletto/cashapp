-- ================================================================
-- Spese – Supabase schema  (idempotent: safe to re-run)
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)
-- ================================================================

-- ── EXPENSES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id           text          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text          NOT NULL,
  amount       numeric(10,2) NOT NULL,
  category     text          NOT NULL,
  note         text          DEFAULT '',
  month        text          NOT NULL,
  day          integer       NOT NULL DEFAULT 1,
  created_at   timestamptz   DEFAULT now(),
  recurring    boolean       DEFAULT false,
  recurring_id text
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own expenses" ON public.expenses;
CREATE POLICY "Own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── CATEGORIES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id      bigserial PRIMARY KEY,
  user_id uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name    text  NOT NULL,
  color   text  NOT NULL,
  UNIQUE(user_id, name)
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own categories" ON public.categories;
CREATE POLICY "Own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── BUDGETS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id      bigserial     PRIMARY KEY,
  user_id uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month   text          NOT NULL,
  amount  numeric(10,2) NOT NULL,
  UNIQUE(user_id, month)
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own budgets" ON public.budgets;
CREATE POLICY "Own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── RECURRING TEMPLATES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id       text          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id  uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name     text          NOT NULL,
  amount   numeric(10,2) NOT NULL,
  category text          NOT NULL,
  note     text          DEFAULT ''
);
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own recurring" ON public.recurring_templates;
CREATE POLICY "Own recurring" ON public.recurring_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── INITIALIZED MONTHS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.initialized_months (
  id      bigserial PRIMARY KEY,
  user_id uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month   text  NOT NULL,
  UNIQUE(user_id, month)
);
ALTER TABLE public.initialized_months ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own initialized months" ON public.initialized_months;
CREATE POLICY "Own initialized months" ON public.initialized_months
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
