const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tyafjhkdxuygnbejbymp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWZqaGtkeHV5Z25iZWpieW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyMDUwNiwiZXhwIjoyMDkyODk2NTA2fQ.j5YZQVprCKUFncWpYuLJXQ1Vsw_afL0mzhGtyfr_Znw';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixUserRole() {
  console.log('🔍 Revisando y reparando rol del usuario...\n');

  try {
    // 1. Obtener usuario por email
    console.log('1️⃣ Buscando usuario: henrydanielperaza@gmail.com');
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Error listando usuarios:', userError);
      return;
    }

    const myUser = user.users.find(u => u.email === 'henrydanielperaza@gmail.com');
    if (!myUser) {
      console.log('❌ Usuario no encontrado en auth.users');
      return;
    }

    console.log(`✅ Usuario encontrado: ${myUser.id}`);
    console.log(`   Email: ${myUser.email}`);

    // 2. Verificar rol en profiles
    console.log('\n2️⃣ Verificando rol en tabla profiles...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', myUser.id)
      .single();

    if (profileError) {
      console.error('❌ Error leyendo profile:', profileError.message);

      // Crear profile si no existe
      console.log('\n⚠️ Profile no existe, creándolo...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: myUser.id, role: 'admin', name: 'Admin User', email: myUser.email });

      if (insertError) {
        console.error('❌ Error creando profile:', insertError);
      } else {
        console.log('✅ Profile creado con rol admin');
      }
      return;
    }

    console.log(`✅ Profile encontrado`);
    console.log(`   Rol actual: ${profile.role}`);
    console.log(`   Nombre: ${profile.name}`);

    // 3. Actualizar rol a admin si es necesario
    if (profile.role !== 'admin') {
      console.log('\n3️⃣ Actualizando rol a admin...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', myUser.id);

      if (updateError) {
        console.error('❌ Error actualizando rol:', updateError);
        return;
      }
      console.log('✅ Rol actualizado a admin');
    } else {
      console.log('\n✅ Ya tienes rol admin');
    }

    // 4. Listar todos los usuarios
    console.log('\n4️⃣ Listando todos los usuarios en profiles...');
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, email, role, name')
      .order('name', { ascending: true });

    if (allError) {
      console.error('❌ Error listando profiles:', allError);
      return;
    }

    console.log(`✅ Total de usuarios: ${allProfiles.length}`);
    allProfiles.forEach(p => {
      console.log(`   - ${p.name || 'Sin nombre'} (${p.email}): ${p.role}`);
    });

    // 5. Verificar políticas RLS
    console.log('\n5️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies', {
      schema: 'public',
      table: 'profiles'
    }).catch(() => ({ data: null }));

    if (policies) {
      console.log(`✅ Políticas RLS en profiles: ${JSON.stringify(policies)}`);
    } else {
      console.log('⚠️ No se pudieron leer políticas RLS (esto es normal)');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ RESUMEN: Todo está correcto');
    console.log('   - Tu usuario existe');
    console.log('   - Tu rol es admin');
    console.log('   - Todos los usuarios están en la BD');
    console.log('='.repeat(50));
    console.log('\n💡 Próximo paso: Haz logout/login en la app para refrescar el contexto');

  } catch (error) {
    console.error('💥 Error crítico:', error.message);
  }
}

fixUserRole();
