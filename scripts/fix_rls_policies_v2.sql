-- ============================================================
-- CORRECCIÓN DE POLÍTICAS RLS V2 - ELIMINA TODO Y RECREA
-- ============================================================

-- Desactivar RLS temporalmente para eliminar todas las políticas
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_extras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_commitments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Volver a habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREAR NUEVAS POLÍTICAS PERMISIVAS PARA USUARIOS AUTENTICADOS
-- ============================================================

-- CLIENTES
CREATE POLICY allow_all_clients ON public.clients
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- PROYECTOS
CREATE POLICY allow_all_projects ON public.projects
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- PROJECT_COSTS
CREATE POLICY allow_all_project_costs ON public.project_costs
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- PROJECT_PAYMENTS
CREATE POLICY allow_all_project_payments ON public.project_payments
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- PROJECT_EXTRAS
CREATE POLICY allow_all_project_extras ON public.project_extras
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- PROJECT_COMMITMENTS
CREATE POLICY allow_all_project_commitments ON public.project_commitments
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- MATERIALS
CREATE POLICY allow_all_materials ON public.materials
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- PROFILES
CREATE POLICY allow_all_profiles ON public.profiles
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
