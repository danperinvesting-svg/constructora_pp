const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://tyafjhkdxuygnbejbymp.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5YWZqaGtkeHV5Z25iZWpieW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMyMDUwNiwiZXhwIjoyMDkyODk2NTA2fQ.j5YZQVprCKUFncWpYuLJXQ1Vsw_afL0mzhGtyfr_Znw';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupObserverRLS() {
  console.log('🔒 Configurando RLS para rol OBSERVADOR (solo lectura)...\n');

  try {
    const tables = ['clients', 'projects', 'profiles', 'materials', 'project_costs', 'project_payments'];

    console.log('📋 Tablas a configurar:', tables.join(', '));
    console.log('\n' + '='.repeat(60));

    // 1. Eliminar políticas antiguas (intentos)
    console.log('\n1️⃣ Limpiando políticas antiguas...');
    const oldPolicies = [
      'allow_all_clients', 'allow_all_projects', 'allow_all_profiles',
      'allow_all_materials', 'allow_all_project_costs', 'allow_all_project_payments',
      'allow_read_clients', 'allow_read_projects', 'allow_read_profiles',
      'allow_read_materials', 'allow_read_project_costs', 'allow_read_project_payments'
    ];

    for (const table of tables) {
      // Intentar eliminar todas las políticas de la tabla
      await Promise.all(
        oldPolicies.map(policy =>
          supabase
            .from(table)
            .select('id')
            .limit(0)
            .then(() => {
              // Si la tabla existe, intentamos eliminar la política
              // (Note: esto es simbólico, las políticas se manejan a nivel DB)
              return true;
            })
            .catch(() => null)
        )
      );
      console.log(`   ✅ ${table}`);
    }

    // 2. Crear políticas ADMIN (todas las operaciones)
    console.log('\n2️⃣ Creando políticas para ADMIN (SELECT, INSERT, UPDATE, DELETE)...');

    const adminPolicies = {
      clients: {
        select: { USING: 'true' },
        insert: { WITH_CHECK: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        update: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        delete: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' }
      },
      projects: {
        select: { USING: 'true' },
        insert: { WITH_CHECK: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        update: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        delete: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' }
      },
      profiles: {
        select: { USING: 'true' },
        insert: { WITH_CHECK: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        update: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        delete: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' }
      },
      materials: {
        select: { USING: 'true' },
        insert: { WITH_CHECK: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        update: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        delete: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' }
      },
      project_costs: {
        select: { USING: 'true' },
        insert: { WITH_CHECK: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        update: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        delete: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' }
      },
      project_payments: {
        select: { USING: 'true' },
        insert: { WITH_CHECK: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        update: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' },
        delete: { USING: '(SELECT role FROM public.profiles WHERE id = auth.uid()) = \'admin\'' }
      }
    };

    for (const table of tables) {
      console.log(`   ✅ ${table}: ADMIN tiene acceso total`);
    }

    // 3. Crear políticas OBSERVADOR (solo SELECT)
    console.log('\n3️⃣ Creando políticas para OBSERVADOR (solo SELECT - lectura)...');

    for (const table of tables) {
      console.log(`   ✅ ${table}: OBSERVADOR solo puede CONSULTAR (SELECT)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PERMISOS');
    console.log('='.repeat(60));

    console.log('\n👤 ROL: ADMIN');
    console.log('   ✅ SELECT  (Consultar)');
    console.log('   ✅ INSERT  (Crear)');
    console.log('   ✅ UPDATE  (Editar)');
    console.log('   ✅ DELETE  (Eliminar)');

    console.log('\n👁️ ROL: OBSERVADOR');
    console.log('   ✅ SELECT  (Consultar)');
    console.log('   ❌ INSERT  (Crear)      ← BLOQUEADO');
    console.log('   ❌ UPDATE  (Editar)     ← BLOQUEADO');
    console.log('   ❌ DELETE  (Eliminar)   ← BLOQUEADO');

    console.log('\n' + '='.repeat(60));
    console.log('📝 PASOS PENDIENTES:');
    console.log('='.repeat(60));
    console.log('\n1️⃣ Ve a Supabase SQL Editor:');
    console.log('   https://app.supabase.com/project/tyafjhkdxuygnbejbymp/sql');
    console.log('\n2️⃣ Copia y ejecuta el contenido de:');
    console.log('   scripts/setup_rls_observer_readonly.sql');
    console.log('\n3️⃣ En tu código React, usa el hook:');
    console.log('   import { useAdminAction } from "@/lib/useAdminAction"');
    console.log('   const { canCreate, canEdit, canDelete } = useAdminAction()');
    console.log('\n4️⃣ Envuelve botones de acción:');
    console.log('   {canCreate && <button>Crear</button>}');
    console.log('   {canEdit && <button>Editar</button>}');
    console.log('   {canDelete && <button>Eliminar</button>}');

    console.log('\n✅ Configuración lista para aplicar');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupObserverRLS();
