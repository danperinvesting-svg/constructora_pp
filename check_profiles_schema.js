const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tyafjhkdxuygnbejbymp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWZqaGtkeHV5Z25iZWpieW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyMDUwNiwiZXhwIjoyMDkyODk2NTA2fQ.j5YZQVprCKUFncWpYuLJXQ1Vsw_afL0mzhGtyfr_Znw',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSchema() {
  console.log('📋 Verificando esquema de la tabla profiles...\n');

  // Query SQL directo para ver las columnas
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position;
    `
  }).catch(async () => {
    // Si rpc no funciona, intentar lectura directa
    const result = await supabase
      .from('profiles')
      .select('*')
      .limit(0);
    return result;
  });

  console.log('Resultado:', data);
  if (error) console.error('Error:', error);

  // Contar usuarios en profiles
  console.log('\n📊 Contando usuarios en profiles...');
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .limit(0);

  console.log(`Total de perfiles: ${count}`);

  // Listar todos
  console.log('\n👥 Listando todos los perfiles...');
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*');

  console.log(JSON.stringify(allProfiles, null, 2));
}

checkSchema();
