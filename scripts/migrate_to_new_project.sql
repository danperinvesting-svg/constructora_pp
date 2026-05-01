-- ============================================================
-- MIGRACIÓN CONSTRUCT_PP
-- Ejecutar en: tyafjhkdxuygnbejbymp (SQL Editor de Supabase)
-- ============================================================

-- 1. SECUENCIA para proposal_number
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS proposal_number_seq START WITH 100107;


-- 2. TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY,
  name       text,
  role       text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  company_name       text,
  tax_id             text,
  phone              text,
  email              text,
  address            text,
  status             text DEFAULT 'active',
  created_at         timestamptz DEFAULT now(),
  notes              text,
  committed_expenses numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS financial_accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text,
  currency   text,
  balance    numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  unit       text NOT NULL,
  price_usd  numeric NOT NULL DEFAULT 0,
  category   text NOT NULL DEFAULT 'General',
  provider   text,
  notes      text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS global_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   text NOT NULL,
  setting_value jsonb,
  updated_at    timestamptz DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES clients(id),
  title           text NOT NULL,
  description     text,
  status          text DEFAULT 'proposal',
  start_date      date,
  end_date        date,
  budget_usd      numeric DEFAULT 0,
  budget_ves      numeric DEFAULT 0,
  progress_pct    integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  proposal_number integer DEFAULT nextval('proposal_number_seq')
);

CREATE TABLE IF NOT EXISTS transactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES financial_accounts(id),
  type       text,
  amount     numeric NOT NULL,
  concept    text,
  reference  text,
  date       date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_costs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES projects(id),
  description   text NOT NULL,
  category      text,
  quantity      numeric DEFAULT 1,
  unit          text,
  unit_price_usd numeric DEFAULT 0,
  total_usd     numeric,
  created_at    timestamptz DEFAULT now(),
  provider      text,
  date          date DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS project_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES projects(id),
  amount_usd  numeric NOT NULL DEFAULT 0,
  amount_ves  numeric NOT NULL DEFAULT 0,
  date        date DEFAULT CURRENT_DATE,
  reference   text,
  description text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_extras (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES projects(id),
  description text NOT NULL,
  amount_usd  numeric NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_commitments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES projects(id),
  description   text NOT NULL,
  amount_usd    numeric NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  date          date DEFAULT CURRENT_DATE,
  reference     text,
  provider      text,
  category      text DEFAULT 'materials',
  quantity      numeric DEFAULT 1,
  unit_price_usd numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS partner_advances (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   uuid REFERENCES projects(id),
  partner_name text NOT NULL,
  amount_usd   numeric NOT NULL,
  date         date NOT NULL DEFAULT CURRENT_DATE,
  description  text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid,
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text,
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz DEFAULT now()
);


-- 3. ROW LEVEL SECURITY + POLÍTICAS
-- ============================================================

ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials            ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_costs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_extras       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_commitments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_advances     ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all_clients            ON clients            FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY allow_all_financial_accounts ON financial_accounts FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY allow_all_projects           ON projects           FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY allow_all_project_costs      ON project_costs      FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY allow_all_transactions       ON transactions        FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY allow_all_project_extras     ON project_extras     FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY allow_all_partner_advances   ON partner_advances   FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY allow_all_project_commitments ON project_commitments FOR ALL TO public USING (true);
CREATE POLICY allow_all_project_payments   ON project_payments   FOR ALL TO public USING (true) WITH CHECK (true);

-- materials
CREATE POLICY "Permitir lectura anonima"          ON materials FOR SELECT TO anon    USING (true);
CREATE POLICY "Permitir insercion anonima"         ON materials FOR INSERT TO anon    WITH CHECK (true);
CREATE POLICY "Permitir update anonima"            ON materials FOR UPDATE TO anon    USING (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- global_settings
CREATE POLICY "Allow full access to global_settings for development"
  ON global_settings FOR ALL TO public USING (true);
CREATE POLICY "Authenticated users can read global_settings"
  ON global_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can write global_settings"
  ON global_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- 4. TRIGGER: auto-crear perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', 'admin')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. DATOS: clients
-- ============================================================
INSERT INTO clients (id, name, company_name, tax_id, phone, email, address, status, created_at, notes, committed_expenses) VALUES
('e0da6455-1c6c-4599-aa26-bc70b69ce6d7', 'EDWARD ALMENAR',  '', 'V-13801116', '', '', 'CALLE LA CIMA, VILLAS DE LA LAGUNITA TH, CALLE 3 TH-04, EL HATILLO',              'active', '2026-04-28 14:24:18.953294+00', null, 0),
('2d56d8d0-c874-4602-9f47-cc4144fdd116', 'JESUS IRAUSQUIN', '', '',            '', '', 'CALLE LA CIMA, URB. VILLAS DE LA LAGUNITA TH, CALLE 1, TH-70, EL HATILLO',       'active', '2026-04-28 14:27:25.030247+00', null, 0),
('d9447fd5-ab30-4af6-b44e-81fd9efe92b4', 'JONATHAN LORCA',  '', '',            '', '', 'CALLE LA CIMA, URB. VILLAS DE LA LAGUNITA TH, CALLE 3, TH-14, EL HATILLO',       'active', '2026-04-28 14:28:12.448035+00', null, 0),
('3d918e10-6d69-4883-9581-96ff86ac82d8', 'ANGEL FUNTES',    '', '',            '', '', 'CALLE LA CIMA, URB. VILLAS DE LA LAGUNITA TH, CALLE 3, TH',                      'active', '2026-04-28 14:28:56.14246+00',  null, 0);


-- 6. DATOS: projects
-- ============================================================
INSERT INTO projects (id, client_id, title, description, status, start_date, end_date, budget_usd, budget_ves, progress_pct, created_at, proposal_number) VALUES
('b5f39c5a-3b0e-4452-821d-0e093ffb9456', 'd9447fd5-ab30-4af6-b44e-81fd9efe92b4',
 'Adecuación Eléctrica Integral y Climatización',
 '---
Proyecto: Adecuación Eléctrica Integral y Climatización
Fecha: 28/04/2026
Para: Nathan Lorca
Área del Proyecto: 13 ml de recorrido y 2.5 ml de regata técnica.

Objetivo del Proyecto
Ejecutar la instalación de un circuito eléctrico independiente para una unidad de aire acondicionado de 12.000 BTU (220V) y la implementación de un sistema de iluminación funcional. El proyecto está diseñado para garantizar la seguridad operativa del equipo mediante una acometida robusta y un acabado estético impecable mediante canalizaciones empotradas en pared.

Fases del Trabajo (Alcance Técnico)
1.  **Sondeo y Cableado de Acometida (Fuerza):** Tendido de conductores de cobre THHW #12 AWG a través de 13 metros de tubería existente. Se realizará la gestión técnica y pesca de cable en cada cajetín de paso intermedio para asegurar una conexión continua y sin fricciones. Se instalarán 3 líneas.
2.  **Obra Civil y Canalización Empotrada:** Apertura de regata estructural de 2.5 metros en pared. Instalación de tubería y cajetín rectangular (2x4) para el punto de alimentación del aire acondicionado.
3.  **Sistema de Iluminación y Control:** Montaje y conexión de dos (2) lámparas, incluyendo el cableado correspondiente y la instalación de un interruptor (prende/apaga) para el control centralizado de las luminarias.
4.  **Protecciones y Tablero Central:** Instalación de protección termomagnética (breaker bipolar) en el tablero principal. Verificación de voltajes y pruebas de carga para asegurar la estabilidad del sistema.

Tiempo de Ejecución y Entrega
El proyecto tiene un tiempo estimado de 2 días hábiles continuos.

Presupuesto de Inversión (A Todo Costo)
Esta cotización se presenta bajo la modalidad "A Todo Costo". Incluye todos los materiales, transporte, herramientas y mano de obra calificada necesarios para entregar la obra terminada.
Nota: Las lámparas (luminarias) son suministradas por el cliente.

INVERSIÓN TOTAL: $150.00

Condiciones y Métodos de Pago
Esquema de Pago: Anticipo del 60% para la adquisición de materiales y movilización; 40% restante al finalizar la obra.
Tasa de Cambio: El presupuesto se mantiene en divisas. De realizarse el pago en moneda nacional, se aplicará la tasa Binance vigente para el día del pago.
---',
 'in_progress', null, null, 150, 0, 0, '2026-04-29 01:31:39.148538+00', 100101),

('87bb3bee-1e1c-44ce-b237-be60516e3bfe', '2d56d8d0-c874-4602-9f47-cc4144fdd116',
 'Saneamiento y Reparación de Base',
 'Proyecto: Saneamiento de Emergencia y Reparación de Base
Fecha: 29/04/2026
Para: Jesús Irausquín / Carmen de Irausquín
Área del Proyecto: 17 m²

Objetivo del Proyecto
Realizar un saneamiento estructural puntual en la zona más afectada del techo, sustituyendo la base dañada por láminas de fibrocemento, corregir las pendientes en el área de equipos y sellar el área intervenida para detener las filtraciones de forma inmediata.

Fases del Trabajo (Alcance Técnico)
1.  **Saneamiento Estructural (Fibrocemento)**: Remoción del material degradado en el área crítica de 17 m² e instalación de láminas de fibrocemento (Plycem) de 11 mm para recuperar la firmeza de la base. Se aplicará tratamiento preventivo antitermitas.
2.  **Corrección de Pendiente (Sobrepiso)**: Vaciado de un sobrepiso de concreto de 6 cm de espesor en el área de los aires acondicionados (9.5 m²). Se diseñará la inclinación exacta hacia los desagües para eliminar permanentemente el empozamiento de agua en esta zona.
3.  **Sellado e Imprimación**: Aplicación de primer asfáltico sobre el fibrocemento nuevo y el concreto (26.5 m²) para asegurar la unión molecular con el sistema impermeabilizante.
4.  **Instalación Termofusionada**: Colocación de manto asfáltico mediante soplete de calor en los 26.5 m², asegurando una transición perfecta con la impermeabilización existente y el bloqueo de cualquier vía de agua.
5.  **Pintura Impermeabilizante Elastomérica**: Acabado final con pintura de alta elasticidad para sellar completamente los parches intervenidos y proteger el material nuevo de la degradación ambiental.

Tiempo de Ejecución y Entrega
El proyecto tiene un tiempo estimado de 4 a 5 días hábiles continuos (sujeto a condiciones climáticas y tiempo de fraguado).

INVERSIÓN TOTAL: $1,192.25

Condiciones y Métodos de Pago
Esquema de Pago: Anticipo del 60% para la adquisición de materiales y movilización; 40% restante al finalizar la obra.
Tasa de Cambio: El presupuesto se mantiene en divisas. De realizarse el pago en moneda nacional, se aplicará la tasa Binance vigente para el día del pago.',
 'in_progress', null, null, 1192.25, 0, 0, '2026-04-29 23:03:47.518924+00', 100102),

('68703eee-e419-478d-836a-bdbf63c355ad', '2d56d8d0-c874-4602-9f47-cc4144fdd116',
 'Cierre de Tragaluz',
 'Proyecto: Cierre Estructural de Tragaluz y Construcción de Mini Placa
Fecha: 29/04/2026
Para: Jesús Irausquín / Carmen de Irausquín
Área del Proyecto: 1.58 m² (72 cm x 219 cm)

Objetivo del Proyecto
Ejecutar el cierre definitivo del área del tragaluz mediante la construcción de una mini placa de concreto reforzada, integrada estructuralmente a la losa existente.

INVERSIÓN TOTAL: $535.00

Condiciones y Métodos de Pago
Esquema de Pago: Anticipo del 60% para la adquisición de materiales y movilización; 40% restante al finalizar la obra.
Tasa de Cambio: El presupuesto se mantiene en divisas. De realizarse el pago en moneda nacional, se aplicará la tasa Binance vigente para el día del pago.',
 'in_progress', null, null, 535, 0, 0, '2026-04-29 23:59:21.362997+00', 100103),

('f5e232ab-c5bc-43cc-9469-d16f74d5f9ce', '2d56d8d0-c874-4602-9f47-cc4144fdd116',
 'Restauración de Escalera',
 'Proyecto: Restauración, Mantenimiento y Acabado de Escalera
Fecha: 30/04/2026
Para: Jesús Irausquín / Carmen de Irausquín

INVERSIÓN TOTAL: $1,000.00

Esquema de Pago: Anticipo del 60%; 40% restante al finalizar la obra.',
 'proposal', null, null, 1000, 0, 0, '2026-05-01 00:28:12.254295+00', 100105),

('4f19aa10-46b2-42df-8cd4-1bf150448c5e', '2d56d8d0-c874-4602-9f47-cc4144fdd116',
 'Adecuación Techo Drywall y Reparación Filtración',
 'Proyecto: Adecuación Decorativa de Techo en Drywall y Reparación de Filtración en Bajante Empotrado
Fecha: 01/05/2026
Para: Jesús Irausquín / Carmen de Irausquín

INVERSIÓN TOTAL: 870.00 $

Esquema de Pago: Anticipo del 60%; 40% restante al finalizar la obra.',
 'proposal', null, null, 870, 0, 0, '2026-05-01 00:41:35.557499+00', 100106);


-- 7. DATOS: project_costs
-- ============================================================
INSERT INTO project_costs (id, project_id, description, category, quantity, unit, unit_price_usd, total_usd, created_at, provider, date) VALUES
('8ef1c2a2-8eb1-4e4a-89ce-737423c5a5ef', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', '1 m3 DE ARENA LAVADA',                    'materials', 1,  null, 35,     35,     '2026-04-30 18:05:37.686519+00', 'GOCHO',           '2026-04-17'),
('6b4bdfa2-c6ca-4fad-b64a-4c83eea9116e', '68703eee-e419-478d-836a-bdbf63c355ad', '6 CEMENTO',                                'materials', 6,  null, 11,     66,     '2026-04-30 18:06:54.863892+00', 'GOCHO',           '2026-04-17'),
('54c796ba-8c57-4752-9200-764dd56be0d5', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', '1 DISCO DE MADERA',                        'materials', 1,  null, 10,     10,     '2026-04-30 18:07:43.137268+00', 'FERREVEN',        '2026-04-02'),
('20694da8-187a-4d06-9596-6c6504bf44fc', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', '4 MANTOS EDIL 3.2mm',                     'materials', 4,  null, 43,     172,    '2026-04-30 18:08:32.885684+00', 'PAINT SHOP',      '2026-04-20'),
('0d130947-8881-469a-8438-2a065cbd06d0', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', '2 LAMINAS DE FIBROCEMENTO',               'materials', 2,  null, 42,     84,     '2026-04-30 18:09:18.149181+00', 'PAINT SHOP',      '2026-04-20'),
('948a5725-9e72-4cde-9780-364e62166c86', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', 'TORNILLOS AUTOPERFORANTES',               'materials', 1,  null, 3,      3,      '2026-04-30 18:10:14.461223+00', 'PAINT SHOP',      '2026-04-20'),
('ff64523b-5b3b-4346-85df-1e467eb47862', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', 'FLETE PAINT SHOP /  EL HATILLO',          'other',     1,  null, 30,     30,     '2026-04-30 18:11:24.764638+00', 'JONNATHAN',       '2026-04-20'),
('df5bc02e-b980-404b-802e-4263602b39c7', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', 'TORNILLOS, LISTONES, TEIPE, CEMENTO PLASTICO.', 'materials', 1, null, 28.08, 28.08, '2026-04-30 18:12:39.513799+00', 'EPA',             '2026-04-21'),
('987a4b93-30de-4d1a-9fc6-06b7e6ceaa7c', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', 'RECARGA DE LA BOMBONA',                   'materials', 1,  null, 13.98,  13.98,  '2026-04-30 18:14:22.039456+00', 'CAMION DEL GAS',  '2026-04-20'),
('2a3be3ec-9a19-4770-9791-2b0d95449190', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', '4 BOLSAS DE ESCROMBRO',                   'materials', 4,  null, 0.94,   3.76,   '2026-04-30 18:15:17.960819+00', 'FERREVEN',        '2026-04-24'),
('d637dbf7-48f5-412d-b342-92882d98b230', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', 'ABONO AYUDANTE',                          'labor',     1,  null, 47.68,  47.68,  '2026-04-30 18:16:01.386014+00', 'JAIRO',           '2026-04-24'),
('41623092-da16-4ef6-9571-8599cca372f0', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', '1 CUÑETE DE MANTOFLEX / BROCHA / RODILLO','materials', 1,  null, 85,     85,     '2026-04-30 18:17:59.324284+00', 'PAINT SHOP',      '2026-04-24'),
('7ae17064-919e-42ed-89b4-266428a5d3a2', '68703eee-e419-478d-836a-bdbf63c355ad', '4 BOLSAS DE ESCOMBRO',                    'materials', 4,  null, 0.94,   3.76,   '2026-04-30 18:19:08.858665+00', 'FERREVEN',        '2026-04-27'),
('032b413a-f580-4d0a-bcf2-ddf8495512cc', '68703eee-e419-478d-836a-bdbf63c355ad', '4 BOLSAS DE ESCOMBRO',                    'materials', 4,  null, 0.94,   3.76,   '2026-04-30 18:19:42.289639+00', 'FERREVEN',        '2026-04-27'),
('f6d4211e-0a66-495b-8dde-f94f5525c0e6', '68703eee-e419-478d-836a-bdbf63c355ad', 'PAGO MANO DE OBRA CIERRE TRAGALUZ: ESTRUCTURA / VACIADO', 'labor', 1, null, 160, 160, '2026-04-30 18:20:38.631045+00', 'EDUARDO', '2026-04-22');


-- 8. DATOS: project_payments
-- ============================================================
INSERT INTO project_payments (id, project_id, amount_usd, amount_ves, date, reference, description, created_at) VALUES
('ca8f85b9-2952-4978-96a1-75eab3e6e489', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', 10,   0, '2026-04-16', 'BINANCE - 537088', 'ABONO PROPUESTA',                    '2026-04-30 00:24:13.422536+00'),
('25ea8ebe-cd57-49aa-86e0-11d035382edc', '87bb3bee-1e1c-44ce-b237-be60516e3bfe', 1182, 0, '2026-04-16', 'BINANCE - 493248', 'COMPLEMENTO PAGO PROPUESTA 100102',  '2026-04-30 00:25:19.831175+00'),
('b814d339-f4e6-4255-8e72-d4f5c3ae27f7', '68703eee-e419-478d-836a-bdbf63c355ad', 535,  0, '2026-04-22', 'BOFA-C1ZXMD',      'PAGO PROPUESTA DE CIERRE TRAGALUZ', '2026-04-30 00:33:02.692592+00');


-- 9. DATOS: project_extras
-- ============================================================
INSERT INTO project_extras (id, project_id, description, amount_usd, created_at) VALUES
('bf361a59-8345-4ecd-8aee-687f2968af11', 'b5f39c5a-3b0e-4452-821d-0e093ffb9456', 'Instalacion de 2  lamaparas en el patio', 30, '2026-04-29 19:35:19.075772+00');


-- 10. DATOS: project_commitments
-- ============================================================
INSERT INTO project_commitments (id, project_id, description, amount_usd, created_at, date, reference, provider, category, quantity, unit_price_usd) VALUES
('03289d25-3f2b-475c-a3bb-5bc03f8855da', '68703eee-e419-478d-836a-bdbf63c355ad', '1 TUBO DE 100X40',         35, '2026-04-30 19:42:09.883099+00', '2026-04-21', null, 'POR DEFINIR', 'materials', 1, 35),
('193b4edd-09aa-491b-b77f-6e5bff0dd38f', '68703eee-e419-478d-836a-bdbf63c355ad', 'FLETE FERRETERIA A VILLAS',45, '2026-04-30 19:43:21.601608+00', '2026-04-21', null, 'POR DEFINIR', 'other',     1, 45);


-- 11. DATOS: materials
-- ============================================================
INSERT INTO materials (id, name, unit, price_usd, category, provider, notes, updated_at) VALUES
('96404eb9-7f6f-4713-bcc5-048f050cec3f', 'Cemento Gris', 'Saco', 50,   'General',     'Proveedor Prueba',       '',   '2026-04-30 10:28:34.122+00'),
('ba31fb9e-1f28-4d32-8c8f-1a6d65a65eb6', 'Cemento Gris', 'Saco', 10.5, 'Mampostería', 'Distribuidora Caracas',  null, '2026-04-30 10:29:01.418+00');


-- ============================================================
-- FIN DEL SCRIPT
-- NOTA: Después de ejecutar este script, regístrate en el
-- nuevo proyecto con tu email (henrydanielperaza@gmail.com).
-- El trigger creará tu perfil de admin automáticamente.
-- ============================================================
