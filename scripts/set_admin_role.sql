-- ============================================================
-- CAMBIAR ROL A ADMINISTRADOR PARA henrydanielperaza@gmail.com
-- ============================================================

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'henrydanielperaza@gmail.com'
);

-- Verificar que se actualizó correctamente
SELECT id, email, (SELECT role FROM profiles WHERE id = auth.users.id) as role
FROM auth.users
WHERE email = 'henrydanielperaza@gmail.com';
