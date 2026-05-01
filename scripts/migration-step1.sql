-- PASO 1: Arreglar tablas existentes (clients y materials)
-- Ejecuta esto PRIMERO en el SQL Editor

-- Convertir clients.id de text a uuid
ALTER TABLE public.clients ALTER COLUMN id TYPE uuid USING id::uuid;

-- Agregar PRIMARY KEY a clients
ALTER TABLE public.clients ADD CONSTRAINT clients_pkey PRIMARY KEY (id);

-- Convertir materials.id de text a uuid
ALTER TABLE public.materials ALTER COLUMN id TYPE uuid USING id::uuid;

-- Agregar PRIMARY KEY a materials
ALTER TABLE public.materials ADD CONSTRAINT materials_pkey PRIMARY KEY (id);

-- Verificación final
SELECT 'clients' AS tabla, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'id'
UNION ALL
SELECT 'materials', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'materials' AND column_name = 'id';
