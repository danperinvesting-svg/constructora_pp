-- Verificar el rol de henrydanielperaza@gmail.com
SELECT
  u.id,
  u.email,
  p.id as profile_id,
  p.role,
  p.name,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'henrydanielperaza@gmail.com';
