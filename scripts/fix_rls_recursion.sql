-- ============================================================
-- FIX: Recursión infinita en RLS de tabla profiles
-- PROBLEMA: Las políticas de profiles se auto-consultan para
--           verificar el rol, causando recursión infinita.
-- SOLUCIÓN: Función SECURITY DEFINER que bypasea RLS,
--           más política directa para lectura propia.
-- ============================================================

-- 1. Crear función que obtiene el rol SIN pasar por RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Eliminar políticas antiguas problemáticas
DROP POLICY IF EXISTS admin_all_clients ON public.clients;
DROP POLICY IF EXISTS admin_all_projects ON public.projects;
DROP POLICY IF EXISTS admin_all_profiles ON public.profiles;
DROP POLICY IF EXISTS admin_all_materials ON public.materials;
DROP POLICY IF EXISTS admin_all_project_costs ON public.project_costs;
DROP POLICY IF EXISTS admin_all_project_payments ON public.project_payments;

DROP POLICY IF EXISTS observer_read_clients ON public.clients;
DROP POLICY IF EXISTS observer_read_projects ON public.projects;
DROP POLICY IF EXISTS observer_read_profiles ON public.profiles;
DROP POLICY IF EXISTS observer_read_materials ON public.materials;
DROP POLICY IF EXISTS observer_read_project_costs ON public.project_costs;
DROP POLICY IF EXISTS observer_read_project_payments ON public.project_payments;

-- ============================================================
-- 3. TABLA PROFILES: política especial para evitar recursión
-- ============================================================

-- Cualquier usuario autenticado puede leer SU PROPIA fila (sin subquery, sin recursión)
CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admin puede leer TODOS los perfiles (usa función para evitar recursión)
CREATE POLICY profiles_admin_read_all ON public.profiles
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');

-- Admin puede modificar perfiles (INSERT, UPDATE, DELETE)
CREATE POLICY profiles_admin_write ON public.profiles
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ============================================================
-- 4. RESTO DE TABLAS: usar función en lugar de subquery
-- ============================================================

-- CLIENTS
CREATE POLICY admin_all_clients ON public.clients
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY observer_read_clients ON public.clients
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'viewer');

-- PROJECTS
CREATE POLICY admin_all_projects ON public.projects
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY observer_read_projects ON public.projects
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'viewer');

-- MATERIALS
CREATE POLICY admin_all_materials ON public.materials
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY observer_read_materials ON public.materials
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'viewer');

-- PROJECT_COSTS
CREATE POLICY admin_all_project_costs ON public.project_costs
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY observer_read_project_costs ON public.project_costs
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'viewer');

-- PROJECT_PAYMENTS
CREATE POLICY admin_all_project_payments ON public.project_payments
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY observer_read_project_payments ON public.project_payments
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'viewer');

-- ============================================================
-- 5. Verificar que tu usuario admin tenga rol correcto
-- ============================================================
-- Si necesitas forzar el rol admin para henrydanielperaza@gmail.com:
-- UPDATE public.profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'henrydanielperaza@gmail.com');

-- 6. Verificar políticas creadas
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clients','projects','profiles','materials','project_costs','project_payments')
ORDER BY tablename, policyname;
