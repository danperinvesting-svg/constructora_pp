-- Ejecutar en SQL Editor para diagnosticar el estado actual

-- 1. ¿Qué columnas tienen clients y materials?
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('clients', 'materials')
ORDER BY table_name, ordinal_position;

-- 2. ¿Tienen primary key?
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('clients', 'materials');

-- 3. Listar todas las tablas que existen en public
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
