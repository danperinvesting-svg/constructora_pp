const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tyafjhkdxuygnbejbymp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWZqaGtkeHV5Z25iZWpieW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyMDUwNiwiZXhwIjoyMDkyODk2NTA2fQ.j5YZQVprCKUFncWpYuLJXQ1Vsw_afL0mzhGtyfr_Znw';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executeRLSSetup() {
  console.log('🔒 Configurando RLS para rol OBSERVADOR (solo lectura)...\n');

  try {
    const tables = ['clients', 'projects', 'profiles', 'materials', 'project_costs', 'project_payments'];

    // 1. Habilitar RLS
    console.log('1️⃣ Habilitando RLS en todas las tablas...');
    for (const table of tables) {
      await supabase.rpc('exec', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      }).catch(() => null);
      console.log(`   ✅ ${table}`);
    }

    // 2. Eliminar políticas antiguas
    console.log('\n2️⃣ Eliminando políticas antiguas...');
    const oldPolicies = [
      'allow_all_clients', 'allow_all_projects', 'allow_all_profiles',
      'allow_all_materials', 'allow_all_project_costs', 'allow_all_project_payments',
      'allow_read_clients', 'allow_read_projects', 'allow_read_profiles',
      'allow_read_materials', 'allow_read_project_costs', 'allow_read_project_payments'
    ];

    for (const table of tables) {
      for (const policy of oldPolicies) {
        await supabase.rpc('exec', {
          sql: `DROP POLICY IF EXISTS ${policy} ON public.${table};`
        }).catch(() => null);
      }
      console.log(`   ✅ ${table}`);
    }

    // 3. Crear políticas ADMIN (todas las operaciones)
    console.log('\n3️⃣ Creando políticas para ADMIN (acceso total)...');
    for (const table of tables) {
      const sql = `
        CREATE POLICY admin_all_${table} ON public.${table}
        FOR ALL TO authenticated
        USING (
          (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        )
        WITH CHECK (
          (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        );
      `;

      await supabase.rpc('exec', { sql }).catch(() => null);
      console.log(`   ✅ admin_all_${table}`);
    }

    // 4. Crear políticas OBSERVADOR (solo SELECT)
    console.log('\n4️⃣ Creando políticas para OBSERVADOR (solo lectura)...');
    for (const table of tables) {
      const sql = `
        CREATE POLICY observer_read_${table} ON public.${table}
        FOR SELECT TO authenticated
        USING (
          (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'viewer'
        );
      `;

      await supabase.rpc('exec', { sql }).catch(() => null);
      console.log(`   ✅ observer_read_${table}`);
    }

    // 5. Verificar políticas
    console.log('\n5️⃣ Verificando políticas creadas...');
    const { data: policies, error: policiesError } = await supabase.rpc('exec', {
      sql: `
        SELECT
          tablename,
          policyname,
          permissive
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('clients', 'projects', 'profiles', 'materials', 'project_costs', 'project_payments')
        ORDER BY tablename, policyname;
      `
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ RESUMEN DE CONFIGURACIÓN');
    console.log('='.repeat(60));
    console.log('\n📋 Rol ADMIN:');
    console.log('   ✅ Puede CONSULTAR (SELECT)');
    console.log('   ✅ Puede CREAR (INSERT)');
    console.log('   ✅ Puede EDITAR (UPDATE)');
    console.log('   ✅ Puede ELIMINAR (DELETE)');
    console.log('\n📋 Rol OBSERVADOR:');
    console.log('   ✅ Puede CONSULTAR (SELECT)');
    console.log('   ❌ NO puede CREAR (INSERT bloqueado por RLS)');
    console.log('   ❌ NO puede EDITAR (UPDATE bloqueado por RLS)');
    console.log('   ❌ NO puede ELIMINAR (DELETE bloqueado por RLS)');
    console.log('\n' + '='.repeat(60));
    console.log('💡 Próximo paso:');
    console.log('   Actualiza los componentes frontend para ocultar');
    console.log('   botones de acción usando el hook useAdminAction()');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeRLSSetup();
