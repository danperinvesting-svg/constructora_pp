-- Migration: Create full schema for construct_pp
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/tyafjhkdxuygnbejbymp/sql

-- =============================================
-- Fix existing tables (convert id text→uuid + add PRIMARY KEY)
-- =============================================

-- clients: convertir id de text a uuid si aplica
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clients'
      AND column_name = 'id') = 'text' THEN
    ALTER TABLE public.clients ALTER COLUMN id TYPE uuid USING id::uuid;
  END IF;
END $$;

-- clients: agregar PK si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index
    WHERE indrelid = 'public.clients'::regclass AND indisprimary
  ) THEN
    ALTER TABLE public.clients ADD PRIMARY KEY (id);
  END IF;
END $$;

-- materials: convertir id de text a uuid si aplica
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'materials'
      AND column_name = 'id') = 'text' THEN
    ALTER TABLE public.materials ALTER COLUMN id TYPE uuid USING id::uuid;
  END IF;
END $$;

-- materials: agregar PK si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index
    WHERE indrelid = 'public.materials'::regclass AND indisprimary
  ) THEN
    ALTER TABLE public.materials ADD PRIMARY KEY (id);
  END IF;
END $$;

-- =============================================
-- profiles
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  role        text NOT NULL DEFAULT 'viewer',
  created_at  timestamptz DEFAULT now()
);

-- =============================================
-- projects
-- =============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'proposal',
  start_date      date,
  end_date        date,
  budget_usd      numeric(12,2),
  budget_ves      numeric(18,2) DEFAULT 0,
  progress_pct    integer DEFAULT 0,
  proposal_number integer,
  created_at      timestamptz DEFAULT now()
);

-- =============================================
-- project_payments
-- =============================================

CREATE TABLE IF NOT EXISTS public.project_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  amount_usd  numeric(12,2) NOT NULL,
  amount_ves  numeric(18,2) DEFAULT 0,
  date        date,
  reference   text,
  description text,
  created_at  timestamptz DEFAULT now()
);

-- =============================================
-- project_extras
-- =============================================

CREATE TABLE IF NOT EXISTS public.project_extras (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount_usd  numeric(12,2) NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- =============================================
-- project_costs
-- =============================================

CREATE TABLE IF NOT EXISTS public.project_costs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  description    text NOT NULL,
  category       text,
  quantity       numeric(10,4),
  unit           text,
  unit_price_usd numeric(12,2),
  total_usd      numeric(12,2),
  provider       text,
  date           date,
  created_at     timestamptz DEFAULT now()
);

-- =============================================
-- project_commitments
-- =============================================

CREATE TABLE IF NOT EXISTS public.project_commitments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  description    text NOT NULL,
  amount_usd     numeric(12,2),
  date           date,
  reference      text,
  provider       text,
  category       text,
  quantity       numeric(10,4),
  unit_price_usd numeric(12,2),
  created_at     timestamptz DEFAULT now()
);

-- =============================================
-- partner_advances
-- =============================================

CREATE TABLE IF NOT EXISTS public.partner_advances (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  partner_name text NOT NULL,
  amount_usd   numeric(12,2) NOT NULL,
  description  text,
  date         date,
  created_at   timestamptz DEFAULT now()
);

-- =============================================
-- global_settings
-- =============================================

CREATE TABLE IF NOT EXISTS public.global_settings (
  setting_key   text PRIMARY KEY,
  setting_value jsonb,
  created_at    timestamptz DEFAULT now()
);

-- =============================================
-- audit_logs
-- =============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text,
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- Enable RLS (Row Level Security) - recomendado
-- =============================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_extras    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_advances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso total (el backend usa service_role key que bypasea RLS)
DO $$
DECLARE
  tbls text[] := ARRAY[
    'profiles','projects','project_payments','project_extras',
    'project_costs','project_commitments','partner_advances',
    'global_settings','audit_logs'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND policyname = 'service_role_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY service_role_all ON public.%I FOR ALL USING (true)', t
      );
    END IF;
  END LOOP;
END $$;
