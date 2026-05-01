# Configuración de Rol Observador (Solo Lectura)

## Objetivo
Los usuarios con rol **OBSERVADOR** solo pueden **consultar/leer** datos. No pueden:
- ❌ Crear (INSERT)
- ❌ Editar (UPDATE)
- ❌ Eliminar (DELETE)

Los usuarios con rol **ADMIN** tienen acceso total a todas las operaciones.

---

## Paso 1: Aplicar Políticas RLS en Supabase

1. Ve a: https://app.supabase.com/project/tyafjhkdxuygnbejbymp/sql
2. Copia y ejecuta el contenido del archivo: `scripts/setup_rls_observer_readonly.sql`

Este script:
- ✅ Habilita RLS en todas las tablas
- ✅ Elimina políticas antiguas
- ✅ Crea políticas para ADMIN (acceso total)
- ✅ Crea políticas para OBSERVADOR (solo SELECT)

**Resultado esperado:**
```
✅ Políticas RLS configuradas correctamente
- Admin: acceso total (SELECT, INSERT, UPDATE, DELETE)
- Observador: solo lectura (SELECT)
```

---

## Paso 2: Proteger UI - Ocultar Botones para Observadores

Usa el hook `useAdminAction()` en tus componentes:

```tsx
'use client';

import { useAdminAction } from '@/lib/useAdminAction';

export function ClientsList() {
  const { canCreate, canEdit, canDelete } = useAdminAction();

  return (
    <div>
      {canCreate && (
        <button onClick={handleCreate} className="btn-primary">
          ➕ Crear Cliente
        </button>
      )}

      {/* Listar clientes */}
      {clients.map(client => (
        <div key={client.id}>
          <h3>{client.name}</h3>
          
          {canEdit && (
            <button onClick={() => handleEdit(client.id)}>
              ✏️ Editar
            </button>
          )}
          
          {canDelete && (
            <button onClick={() => handleDelete(client.id)}>
              🗑️ Eliminar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Paso 3: Validar en Backend APIs

En tus endpoints API, valida que solo ADMIN pueda modificar datos:

```typescript
// src/app/api/clients/route.ts
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 1. Obtener usuario autenticado
  const userId = req.headers.get('x-user-id');

  // 2. Verificar que es ADMIN
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { error: '❌ Solo administradores pueden crear clientes' },
      { status: 403 }
    );
  }

  // 3. Proceder con la creación
  // ... tu lógica aquí
}
```

---

## Paso 4: Probar la Configuración

### Como ADMIN:
1. ✅ Puedes **ver** clientes
2. ✅ Puedes **crear** nuevos clientes
3. ✅ Puedes **editar** clientes
4. ✅ Puedes **eliminar** clientes

### Como OBSERVADOR:
1. ✅ Puedes **ver** clientes
2. ❌ NO ves botón "Crear"
3. ❌ NO ves botón "Editar"
4. ❌ NO ves botón "Eliminar"
5. ❌ Si intenta hacer POST/PUT/DELETE directamente → Error 403 (RLS + API)

---

## Verificar RLS Activa

```sql
-- En Supabase SQL Editor
SELECT schemaname, tablename, policyname, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Archivos Creados

- ✅ `scripts/setup_rls_observer_readonly.sql` — Configuración RLS
- ✅ `src/lib/useAdminAction.ts` — Hook para proteger UI
- ✅ Este archivo de documentación

---

## Próximos Pasos

1. Ejecuta el SQL en Supabase Console
2. Actualiza tus componentes para usar `useAdminAction()`
3. Prueba con un usuario OBSERVADOR
4. Verifica que RLS bloquea intentos de modificación
