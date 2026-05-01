const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tyafjhkdxuygnbejbymp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWZqaGtkeHV5Z25iZWpieW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyMDUwNiwiZXhwIjoyMDkyODk2NTA2fQ.j5YZQVprCKUFncWpYuLJXQ1Vsw_afL0mzhGtyfr_Znw',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createProfile() {
  try {
    console.log('👤 Creando profile para henrydanielperaza@gmail.com...\n');

    // 1. Obtener el user_id
    const { data: users } = await supabase.auth.admin.listUsers();
    const myUser = users.users.find(u => u.email === 'henrydanielperaza@gmail.com');

    if (!myUser) {
      console.error('❌ Usuario no encontrado en auth.users');
      return;
    }

    console.log(`✅ Usuario encontrado: ${myUser.id}`);
    console.log(`   Email: ${myUser.email}`);

    // 2. Crear el profile CON SOLO LAS COLUMNAS NECESARIAS
    console.log('\n📝 Creando profile...');
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: myUser.id,
        role: 'admin',
        name: 'Henry Daniel Peraza'
      });

    if (error) {
      console.error('❌ Error creando profile:', error.message);
      console.error('Details:', error.details);
      return;
    }

    console.log('✅ Profile creado exitosamente');
    console.log('   ID:', myUser.id);
    console.log('   Rol: admin');
    console.log('   Nombre: Henry Daniel Peraza');

    // 3. Verificar que se creó
    console.log('\n✔️ Verificando...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', myUser.id)
      .single();

    console.log('Profile verificado:', profile);

    console.log('\n' + '='.repeat(50));
    console.log('✅ LISTO! Tu profile fue creado como ADMINISTRADOR');
    console.log('='.repeat(50));
    console.log('\n💡 Ahora haz en la app:');
    console.log('   1. Logout (Cerrar Sesión)');
    console.log('   2. Login nuevamente');
    console.log('   3. Ve a Administración → Gestión de Usuarios');
    console.log('   4. ¡Deberías verte como ADMIN!');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

createProfile();
