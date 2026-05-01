-- ============================================================
-- CORRECCIÓN DE POLÍTICAS RLS EN tyafjhkdxuygnbejbymp
-- El problema: las políticas fueron creadas con "TO public"
-- pero los usuarios autenticados tienen el rol "authenticated"
-- ============================================================

-- 1. Eliminar políticas incorrectas (las que tienen TO public)
DROP POLICY IF EXISTS allow_all_clients ON public.clients;
DROP POLICY IF EXISTS allow_all_projects ON public.projects;
DROP POLICY IF EXISTS allow_all_project_costs ON public.project_costs;
DROP POLICY IF EXISTS allow_all_project_payments ON public.project_payments;
DROP POLICY IF EXISTS allow_all_project_extras ON public.project_extras;
DROP POLICY IF EXISTS allow_all_project_commitments ON public.project_commitments;
DROP POLICY IF EXISTS allow_all_materials ON public.materials;
DROP POLICY IF EXISTS allow_all_profiles ON public.profiles;

-- 2. Crear nuevas políticas que permitan usuarios autenticados
-- CLIENTES
CREATE POLICY allow_read_clients ON public.clients
FOR SELECT TO authenticated
USING (true);

CREATE POLICY allow_insert_clients ON public.clients
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY allow_update_clients ON public.clients
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY allow_delete_clients ON public.clients
FOR DELETE TO authenticated
USING (true);

-- PROYECTOS
CREATE POLICY allow_read_projects ON public.projects
FOR SELECT TO authenticated
USING (true);

CREATE POLICY allow_insert_projects ON public.projects
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY allow_update_projects ON public.projects
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY allow_delete_projects ON public.projects
FOR DELETE TO authenticated
USING (true);

-- PROJECT_COSTS
CREATE POLICY allow_read_project_costs ON public.project_costs
FOR SELECT TO authenticated
USING (true);

CREATE POLICY allow_insert_project_costs ON public.project_costs
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY allow_update_project_costs ON public.project_costs
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY allow_delete_project_costs ON public.project_costs
FOR DELETE TO authenticated
USING (true);

-- PROJECT_PAYMENTS
CREATE POLICY allow_read_project_payments ON public.project_payments
FOR SELECT TO authenticated
USING (true);

CREATE POLICY allow_insert_project_payments ON public.project_payments
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY allow_update_project_payments ON public.project_payments
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY allow_delete_project_payments ON public.project_payments
FOR DELETE TO authenticated
USING (true);

-- PROJECT_EXTRAS
CREATE POLICY allow_read_project_extras ON public.project_extras
FOR SELECT TO authenticated
USING (true);

CREATE POLICY allow_insert_project_extras ON public.project_extras
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY allow_update_project_extras ON public.project_extras
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY allow_delete_project_extras ON public.project_extras
FOR DELETE TO authenticated
USING (true);

-- PROJECT_COMMITMENTS
CREATE POLICY allow_read_project_commitments ON public.project_commitments
FOR SELECT TO authenticated
USING (true);

CREATE POLICY allow_insert_project_commitments ON public.project_commitments
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY allow_update_project_commitments ON public.project_commitments
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY allow_delete_project_commitments ON public.project_commitments
FOR DELETE TO authenticated
USING (true);

-- MATERIALS
CREATE POLICY allow_read_materials ON public.materials
FOR SELECT TO authenticated
USING (true);

CREATE POLICY allow_insert_materials ON public.materials
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY allow_update_materials ON public.materials
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY allow_delete_materials ON public.materials
FOR DELETE TO authenticated
USING (true);

-- PROFILES (para el auto-creación de admin al registrarse)
CREATE POLICY allow_read_profiles ON public.profiles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY allow_insert_profiles ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY allow_update_profiles ON public.profiles
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Después de ejecutar este script, los usuarios autenticados
-- podrán leer y modificar todos los datos en estas tablas.
-- Si necesitas restricciones más específicas, ajusta el USING/WITH CHECK.
