import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Iniciando diagnóstico...');

    // 1. Verificar rol del usuario
    console.log('1️⃣ Verificando rol de henrydanielperaza@gmail.com...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, name')
      .eq('email', 'henrydanielperaza@gmail.com')
      .single();

    console.log('User data:', userData, userError);

    // 2. Actualizar rol a admin si es viewer
    if (userData && userData.role !== 'admin') {
      console.log('⚠️ Rol es:', userData.role, '→ Actualizando a admin...');
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userData.id);

      if (updateError) {
        console.error('❌ Error actualizando rol:', updateError);
        return NextResponse.json(
          { error: 'Error updating role', details: updateError },
          { status: 500 }
        );
      }
      console.log('✅ Rol actualizado a admin');
    }

    // 3. Verificar políticas RLS en la tabla profiles
    console.log('2️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    // 4. Listar todos los usuarios en profiles
    console.log('3️⃣ Listando usuarios en profiles...');
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, name')
      .order('name', { ascending: true });

    console.log('All users:', allUsers?.length || 0, usersError);

    // 5. Retornar diagnóstico
    return NextResponse.json({
      status: 'success',
      diagnostic: {
        myUser: {
          found: !!userData,
          email: userData?.email,
          role: userData?.role,
          name: userData?.name,
          id: userData?.id,
        },
        allUsers: {
          count: allUsers?.length || 0,
          users: allUsers || [],
        },
        actions: {
          roleUpdated: userData && userData.role !== 'admin',
        },
      },
      message: userData?.role === 'admin'
        ? '✅ Ya eres admin'
        : '✅ Se actualizó tu rol a admin. Haz logout/login para ver los cambios.',
    });
  } catch (error: any) {
    console.error('💥 Error en diagnóstico:', error);
    return NextResponse.json(
      { error: 'Diagnostic failed', details: error.message },
      { status: 500 }
    );
  }
}
