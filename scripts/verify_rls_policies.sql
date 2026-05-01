-- Verificar todas las políticas RLS en las tablas principales
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

-- Verificar si RLS está habilitado en las tablas
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'projects', 'profiles', 'materials', 'project_costs', 'project_payments')
ORDER BY tablename;

-- Contar usuarios en profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Listar todos los usuarios en profiles
SELECT id, name, email, role FROM public.profiles ORDER BY name;
