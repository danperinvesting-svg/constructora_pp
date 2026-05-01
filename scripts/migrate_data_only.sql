-- ============================================================
-- MIGRACIÓN CONSTRUCT_PP — solo datos (con ON CONFLICT DO NOTHING)
-- Seguro re-ejecutar aunque ya haya datos parciales
-- ============================================================

-- clients
INSERT INTO clients (id, name, company_name, tax_id, phone, email, address, status, created_at, notes, committed_expenses) VALUES
('e0da6455-1c6c-4599-aa26-bc70b69ce6d7','EDWARD ALMENAR','','V-13801116','','','CALLE LA CIMA, VILLAS DE LA LAGUNITA TH, CALLE 3 TH-04, EL HATILLO','active','2026-04-28 14:24:18.953294+00',null,0),
('2d56d8d0-c874-4602-9f47-cc4144fdd116','JESUS IRAUSQUIN','','','','','CALLE LA CIMA, URB. VILLAS DE LA LAGUNITA TH, CALLE 1, TH-70, EL HATILLO','active','2026-04-28 14:27:25.030247+00',null,0),
('d9447fd5-ab30-4af6-b44e-81fd9efe92b4','JONATHAN LORCA','','','','','CALLE LA CIMA, URB. VILLAS DE LA LAGUNITA TH, CALLE 3, TH-14, EL HATILLO','active','2026-04-28 14:28:12.448035+00',null,0),
('3d918e10-6d69-4883-9581-96ff86ac82d8','ANGEL FUNTES','','','','','CALLE LA CIMA, URB. VILLAS DE LA LAGUNITA TH, CALLE 3, TH','active','2026-04-28 14:28:56.14246+00',null,0)
ON CONFLICT (id) DO NOTHING;

-- projects
INSERT INTO projects (id, client_id, title, status, budget_usd, budget_ves, progress_pct, created_at, proposal_number) VALUES
('b5f39c5a-3b0e-4452-821d-0e093ffb9456','d9447fd5-ab30-4af6-b44e-81fd9efe92b4','Adecuación Eléctrica Integral y Climatización','in_progress',150,0,0,'2026-04-29 01:31:39.148538+00',100101),
('87bb3bee-1e1c-44ce-b237-be60516e3bfe','2d56d8d0-c874-4602-9f47-cc4144fdd116','Saneamiento y Reparación de Base','in_progress',1192.25,0,0,'2026-04-29 23:03:47.518924+00',100102),
('68703eee-e419-478d-836a-bdbf63c355ad','2d56d8d0-c874-4602-9f47-cc4144fdd116','Cierre de Tragaluz','in_progress',535,0,0,'2026-04-29 23:59:21.362997+00',100103),
('f5e232ab-c5bc-43cc-9469-d16f74d5f9ce','2d56d8d0-c874-4602-9f47-cc4144fdd116','Restauración de Escalera','proposal',1000,0,0,'2026-05-01 00:28:12.254295+00',100105),
('4f19aa10-46b2-42df-8cd4-1bf150448c5e','2d56d8d0-c874-4602-9f47-cc4144fdd116','Adecuación Techo Drywall y Reparación Filtración','proposal',870,0,0,'2026-05-01 00:41:35.557499+00',100106)
ON CONFLICT (id) DO NOTHING;

-- project_costs
INSERT INTO project_costs (id,project_id,description,category,quantity,unit,unit_price_usd,total_usd,created_at,provider,date) VALUES
('8ef1c2a2-8eb1-4e4a-89ce-737423c5a5ef','87bb3bee-1e1c-44ce-b237-be60516e3bfe','1 m3 DE ARENA LAVADA','materials',1,null,35,35,'2026-04-30 18:05:37+00','GOCHO','2026-04-17'),
('6b4bdfa2-c6ca-4fad-b64a-4c83eea9116e','68703eee-e419-478d-836a-bdbf63c355ad','6 CEMENTO','materials',6,null,11,66,'2026-04-30 18:06:54+00','GOCHO','2026-04-17'),
('54c796ba-8c57-4752-9200-764dd56be0d5','87bb3bee-1e1c-44ce-b237-be60516e3bfe','1 DISCO DE MADERA','materials',1,null,10,10,'2026-04-30 18:07:43+00','FERREVEN','2026-04-02'),
('20694da8-187a-4d06-9596-6c6504bf44fc','87bb3bee-1e1c-44ce-b237-be60516e3bfe','4 MANTOS EDIL 3.2mm','materials',4,null,43,172,'2026-04-30 18:08:32+00','PAINT SHOP','2026-04-20'),
('0d130947-8881-469a-8438-2a065cbd06d0','87bb3bee-1e1c-44ce-b237-be60516e3bfe','2 LAMINAS DE FIBROCEMENTO','materials',2,null,42,84,'2026-04-30 18:09:18+00','PAINT SHOP','2026-04-20'),
('948a5725-9e72-4cde-9780-364e62166c86','87bb3bee-1e1c-44ce-b237-be60516e3bfe','TORNILLOS AUTOPERFORANTES','materials',1,null,3,3,'2026-04-30 18:10:14+00','PAINT SHOP','2026-04-20'),
('ff64523b-5b3b-4346-85df-1e467eb47862','87bb3bee-1e1c-44ce-b237-be60516e3bfe','FLETE PAINT SHOP / EL HATILLO','other',1,null,30,30,'2026-04-30 18:11:24+00','JONNATHAN','2026-04-20'),
('df5bc02e-b980-404b-802e-4263602b39c7','87bb3bee-1e1c-44ce-b237-be60516e3bfe','TORNILLOS, LISTONES, TEIPE, CEMENTO PLASTICO.','materials',1,null,28.08,28.08,'2026-04-30 18:12:39+00','EPA','2026-04-21'),
('987a4b93-30de-4d1a-9fc6-06b7e6ceaa7c','87bb3bee-1e1c-44ce-b237-be60516e3bfe','RECARGA DE LA BOMBONA','materials',1,null,13.98,13.98,'2026-04-30 18:14:22+00','CAMION DEL GAS','2026-04-20'),
('2a3be3ec-9a19-4770-9791-2b0d95449190','87bb3bee-1e1c-44ce-b237-be60516e3bfe','4 BOLSAS DE ESCROMBRO','materials',4,null,0.94,3.76,'2026-04-30 18:15:17+00','FERREVEN','2026-04-24'),
('d637dbf7-48f5-412d-b342-92882d98b230','87bb3bee-1e1c-44ce-b237-be60516e3bfe','ABONO AYUDANTE','labor',1,null,47.68,47.68,'2026-04-30 18:16:01+00','JAIRO','2026-04-24'),
('41623092-da16-4ef6-9571-8599cca372f0','87bb3bee-1e1c-44ce-b237-be60516e3bfe','1 CUÑETE DE MANTOFLEX / BROCHA / RODILLO','materials',1,null,85,85,'2026-04-30 18:17:59+00','PAINT SHOP','2026-04-24'),
('7ae17064-919e-42ed-89b4-266428a5d3a2','68703eee-e419-478d-836a-bdbf63c355ad','4 BOLSAS DE ESCOMBRO','materials',4,null,0.94,3.76,'2026-04-30 18:19:08+00','FERREVEN','2026-04-27'),
('032b413a-f580-4d0a-bcf2-ddf8495512cc','68703eee-e419-478d-836a-bdbf63c355ad','4 BOLSAS DE ESCOMBRO','materials',4,null,0.94,3.76,'2026-04-30 18:19:42+00','FERREVEN','2026-04-27'),
('f6d4211e-0a66-495b-8dde-f94f5525c0e6','68703eee-e419-478d-836a-bdbf63c355ad','PAGO MANO DE OBRA CIERRE TRAGALUZ: ESTRUCTURA / VACIADO','labor',1,null,160,160,'2026-04-30 18:20:38+00','EDUARDO','2026-04-22')
ON CONFLICT (id) DO NOTHING;

-- project_payments
INSERT INTO project_payments (id,project_id,amount_usd,amount_ves,date,reference,description,created_at) VALUES
('ca8f85b9-2952-4978-96a1-75eab3e6e489','87bb3bee-1e1c-44ce-b237-be60516e3bfe',10,0,'2026-04-16','BINANCE - 537088','ABONO PROPUESTA','2026-04-30 00:24:13+00'),
('25ea8ebe-cd57-49aa-86e0-11d035382edc','87bb3bee-1e1c-44ce-b237-be60516e3bfe',1182,0,'2026-04-16','BINANCE - 493248','COMPLEMENTO PAGO PROPUESTA 100102','2026-04-30 00:25:19+00'),
('b814d339-f4e6-4255-8e72-d4f5c3ae27f7','68703eee-e419-478d-836a-bdbf63c355ad',535,0,'2026-04-22','BOFA-C1ZXMD','PAGO PROPUESTA DE CIERRE TRAGALUZ','2026-04-30 00:33:02+00')
ON CONFLICT (id) DO NOTHING;

-- project_extras
INSERT INTO project_extras (id,project_id,description,amount_usd,created_at) VALUES
('bf361a59-8345-4ecd-8aee-687f2968af11','b5f39c5a-3b0e-4452-821d-0e093ffb9456','Instalacion de 2 lamaparas en el patio',30,'2026-04-29 19:35:19+00')
ON CONFLICT (id) DO NOTHING;

-- project_commitments
INSERT INTO project_commitments (id,project_id,description,amount_usd,created_at,date,provider,category,quantity,unit_price_usd) VALUES
('03289d25-3f2b-475c-a3bb-5bc03f8855da','68703eee-e419-478d-836a-bdbf63c355ad','1 TUBO DE 100X40',35,'2026-04-30 19:42:09+00','2026-04-21','POR DEFINIR','materials',1,35),
('193b4edd-09aa-491b-b77f-6e5bff0dd38f','68703eee-e419-478d-836a-bdbf63c355ad','FLETE FERRETERIA A VILLAS',45,'2026-04-30 19:43:21+00','2026-04-21','POR DEFINIR','other',1,45)
ON CONFLICT (id) DO NOTHING;

-- materials
INSERT INTO materials (id,name,unit,price_usd,category,provider,notes,updated_at) VALUES
('96404eb9-7f6f-4713-bcc5-048f050cec3f','Cemento Gris','Saco',50,'General','Proveedor Prueba','','2026-04-30 10:28:34+00'),
('ba31fb9e-1f28-4d32-8c8f-1a6d65a65eb6','Cemento Gris','Saco',10.5,'Mampostería','Distribuidora Caracas',null,'2026-04-30 10:29:01+00')
ON CONFLICT (id) DO NOTHING;
