import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function diagnoseRLS() {
  console.log('🔍 Diagnóstico de RLS para tyafjhkdxuygnbejbymp\n');

  // Cliente admin
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Cliente anon (como lo hace el frontend)
  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Verificar datos con admin (debe funcionar)
    console.log('1️⃣  Intentando leer clientes con SERVICE ROLE (admin)...');
    const { data: adminClients, error: adminError } = await adminClient
      .from('clients')
      .select('*')
      .limit(2);

    if (adminError) {
      console.log(`❌ Error: ${adminError.message}`);
    } else {
      console.log(`✅ Éxito: encontrados ${adminClients?.length || 0} clientes`);
      if (adminClients?.length) console.log(`   Primero: ${adminClients[0].name}`);
    }

    // 2. Verificar datos con anon (como el frontend)
    console.log('\n2️⃣  Intentando leer clientes con ANON KEY (usuario autenticado)...');
    const { data: anonClients, error: anonError } = await anonClient
      .from('clients')
      .select('*')
      .limit(2);

    if (anonError) {
      console.log(`❌ Error: ${anonError.message}`);
    } else {
      console.log(`✅ Éxito: encontrados ${anonClients?.length || 0} clientes`);
      if (anonClients?.length) console.log(`   Primero: ${anonClients[0].name}`);
    }

    // 3. Revisar políticas RLS de la tabla clients
    console.log('\n3️⃣  Verificando políticas RLS en tabla "clients"...');
    const { data: policies, error: policiesError } = await adminClient
      .rpc('get_policies', { schema: 'public', table: 'clients' })
      .single()
      .catch(() => ({ data: null, error: { message: 'RPC no disponible' } }));

    if (policiesError) {
      console.log(`⚠️  No se pudo usar RPC get_policies, revisando directamente...`);
      // Intentar query directa a pg_policies
      const { data: pgPolicies } = await adminClient
        .rpc('sql', { query: `SELECT * FROM pg_policies WHERE tablename = 'clients'` })
        .catch(() => ({ data: null }));

      if (pgPolicies) {
        console.log(`Encontradas ${pgPolicies.length} políticas en clients`);
      }
    } else if (policies) {
      console.log(`✅ Políticas encontradas: ${JSON.stringify(policies, null, 2)}`);
    }

    // 4. Revisar si la tabla tiene RLS habilitado
    console.log('\n4️⃣  Verificando si RLS está habilitado en "clients"...');
    const { data: tableInfo } = await adminClient
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_name', 'clients')
      .eq('table_schema', 'public')
      .single();

    if (tableInfo) {
      console.log(`✅ Tabla "clients" existe en schema public`);
    }

    // 5. Verificar con query SQL directo
    console.log('\n5️⃣  Query SQL directo: SELECT COUNT(*) FROM public.clients...');
    const { data: count } = await adminClient
      .from('clients')
      .select('*', { count: 'exact' })
      .limit(0);

    console.log(`✅ Total de clientes en tabla: ${count}`);

  } catch (err: any) {
    console.error('💥 Error crítico:', err.message);
  }
}

diagnoseRLS().catch(console.error);
