const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tyafjhkdxuygnbejbymp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWZqaGtkeHV5Z25iZWpieW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyMDUwNiwiZXhwIjoyMDkyODk2NTA2fQ.j5YZQVprCKUFncWpYuLJXQ1Vsw_afL0mzhGtyfr_Znw',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  try {
    console.log('📊 Listando TODO lo que hay en profiles...\n');

    const { data: all, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Details:', error.details);
      return;
    }

    console.log(`✅ Total de registros: ${all.length}`);
    console.log('\n' + JSON.stringify(all, null, 2));

    // Contar
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    console.log(`\n📌 Count exacto: ${count}`);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
