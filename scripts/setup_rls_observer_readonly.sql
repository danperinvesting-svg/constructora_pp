-- Configurar RLS para rol observador (solo lectura)
-- Admin: acceso total (SELECT, INSERT, UPDATE, DELETE)
-- Observador: solo SELECT (lectura)

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas
DROP POLICY IF EXISTS allow_all_clients ON public.clients;
DROP POLICY IF EXISTS allow_all_projects ON public.projects;
DROP POLICY IF EXISTS allow_all_profiles ON public.profiles;
DROP POLICY IF EXISTS allow_all_materials ON public.materials;
DROP POLICY IF EXISTS allow_all_project_costs ON public.project_costs;
DROP POLICY IF EXISTS allow_all_project_payments ON public.project_payments;
DROP POLICY IF EXISTS allow_read_clients ON public.clients;
DROP POLICY IF EXISTS allow_read_projects ON public.projects;
DROP POLICY IF EXISTS allow_read_profiles ON public.profiles;
DROP POLICY IF EXISTS allow_read_materials ON public.materials;
DROP POLICY IF EXISTS allow_read_project_costs ON public.project_costs;
DROP POLICY IF EXISTS allow_read_project_payments ON public.project_payments;

-- 3. Crear políticas para ADMIN (acceso total)
CREATE POLICY admin_all_clients ON public.clients
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY admin_all_projects ON public.projects
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY admin_all_profiles ON public.profiles
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY admin_all_materials ON public.materials
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY admin_all_project_costs ON public.project_costs
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY admin_all_project_payments ON public.project_payments
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 4. Crear políticas para OBSERVADOR (solo lectura / SELECT)
CREATE POLICY observer_read_clients ON public.clients
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'viewer'
  );

CREATE POLICY observer_read_projects ON public.projects
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'viewer'
  );

CREATE POLICY observer_read_profiles ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'viewer'
  );

CREATE POLICY observer_read_materials ON public.materials
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'viewer'
  );

CREATE POLICY observer_read_project_costs ON public.project_costs
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'viewer'
  );

CREATE POLICY observer_read_project_payments ON public.project_payments
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'viewer'
  );

-- 5. Verificar políticas creadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'projects', 'profiles', 'materials', 'project_costs', 'project_payments')
ORDER BY tablename, policyname;
