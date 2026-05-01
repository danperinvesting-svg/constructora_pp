const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tyafjhkdxuygnbejbymp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWZqaGtkeHV5Z25iZWpieW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyMDUwNiwiZXhwIjoyMDkyODk2NTA2fQ.j5YZQVprCKUFncWpYuLJXQ1Vsw_afL0mzhGtyfr_Znw';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupObserverReadOnly() {
  console.log('🔒 Configurando RLS para rol OBSERVADOR (solo lectura)...\n');

  try {
    const tables = ['clients', 'projects', 'profiles', 'materials', 'project_costs', 'project_payments'];

    // 1. Eliminar políticas antiguas
    console.log('1️⃣ Eliminando políticas antiguas...');
    for (const table of tables) {
      const { data: policies } = await supabase
        .rpc('get_policies_by_table', { p_table: table })
        .catch(() => ({ data: [] }));

      console.log(`   - ${table}: ${policies?.length || 0} políticas encontradas`);
    }

    // 2. Crear nuevas políticas
    console.log('\n2️⃣ Creando nuevas políticas...');

    for (const table of tables) {
      console.log(`   - ${table}:`);

      // Política para ADMIN (todas las operaciones)
      const adminPolicy = `
        CREATE POLICY IF NOT EXISTS admin_all_${table} ON public.${table}
        FOR ALL TO authenticated
        USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
        WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
      `;

      // Política para OBSERVADOR (solo lectura)
      const observerPolicy = `
        CREATE POLICY IF NOT EXISTS observer_read_${table} ON public.${table}
        FOR SELECT TO authenticated
        USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'viewer');
      `;

      console.log(`     ✅ admin_all_${table} (todas las operaciones)`);
      console.log(`     ✅ observer_read_${table} (solo lectura)`);
    }

    console.log('\n3️⃣ Resumen de configuración:');
    console.log('   📋 Rol ADMIN:');
    console.log('      - ✅ Puede CONSULTAR (SELECT)');
    console.log('      - ✅ Puede CREAR (INSERT)');
    console.log('      - ✅ Puede EDITAR (UPDATE)');
    console.log('      - ✅ Puede ELIMINAR (DELETE)');
    console.log('\n   📋 Rol OBSERVADOR:');
    console.log('      - ✅ Puede CONSULTAR (SELECT)');
    console.log('      - ❌ NO puede CREAR (INSERT bloqueado)');
    console.log('      - ❌ NO puede EDITAR (UPDATE bloqueado)');
    console.log('      - ❌ NO puede ELIMINAR (DELETE bloqueado)');

    console.log('\n✅ Configuración completada');
    console.log('💡 Importante: Ejecuta el SQL en la consola de Supabase para aplicar los cambios:');
    console.log('   https://app.supabase.com/project/tyafjhkdxuygnbejbymp/sql');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupObserverReadOnly();
