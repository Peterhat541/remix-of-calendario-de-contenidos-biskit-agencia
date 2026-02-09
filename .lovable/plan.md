
# Plan: Corregir problemas de base de datos, acceso y eliminar referencias a "Like a Rocket"

## 1. Problema de guardado de calendarios

**Diagnostico**: El patron UPSERT implementado anteriormente funciona correctamente para posts existentes. Sin embargo, hay un problema critico: cuando se crea un post nuevo (sin ID, porque empieza con "post-"), el objeto se envia sin campo `id`, pero el UPSERT con `onConflict: 'id'` necesita que todos los registros tengan el campo `id` o ninguno. Mezclar registros con y sin `id` puede causar conflictos.

**Solucion**: Separar el guardado en dos operaciones:
- Posts existentes (con UUID real): usar `.upsert()` con `onConflict: 'id'`
- Posts nuevos (sin ID o con ID temporal): usar `.insert()` generando un UUID real con `crypto.randomUUID()`

**Archivo**: `src/pages/CalendarioEditar.tsx`

---

## 2. Acceso completo para Sandra y Lucia

**Diagnostico**: Sandra (admin) y Lucia (manager) ya tienen roles correctos en la base de datos. Las tablas principales (`content_calendars`, `calendar_posts`, `documents`, etc.) usan politicas RLS que permiten acceso a usuarios autenticados. No hay restriccion de acceso para ellas.

**Estado**: OK, no requiere cambios.

---

## 3. Eliminar TODAS las referencias a "Like a Rocket" / "likearocket"

Se han encontrado referencias en **8 ubicaciones** que necesitan limpieza:

### 3.1 Edge Functions (4 archivos)

**`supabase/functions/send-calendar-email/index.ts`**
- Linea 6: FROM_EMAIL fallback dice "Like a Rocket" -> cambiar a "Biskit Agencia"
- Lineas 30-73: Funcion `getAgencyBranding` tiene ramas para "likearocket" y "both agencies" -> simplificar para usar solo branding Biskit
- Eliminar SVG de Like a Rocket y las ramas condicionales innecesarias

**`supabase/functions/publish-calendar-update/index.ts`**
- Linea 6: FROM_EMAIL fallback "Like a Rocket" -> "Biskit Agencia"
- Linea 276: "Equipo Like a Rocket" -> "Equipo Biskit Agencia"

**`supabase/functions/approve-calendar/index.ts`**
- Linea 156: FROM_EMAIL fallback "Like a Rocket" -> "Biskit Agencia"
- Linea 165: URL hardcodeada `likearocket-calendario.lovable.app` -> `clientesbiskit.lovable.app`
- Linea 350: Footer "Like a Rocket" -> "Biskit Agencia"

**`supabase/functions/send-feedback-notification/index.ts`**
- Linea 409: Footer "Like a Rocket" -> "Biskit Agencia"

### 3.2 Frontend (4 archivos)

**`src/hooks/useCalendarCrm.ts`**
- Lineas 48 y 396: Fallback `['likearocket']` -> `['biskit']`

**`src/pages/CalendariosCrm.tsx`**
- Lineas 400, 421, 522, 586: Referencias a 'likearocket' en badges y fallbacks -> todo a 'biskit'/'BSK'

**`src/pages/CalendarioDetalle.tsx`**
- Lineas 1405-1406: Logo y alt fallback para "Like a Rocket" -> usar siempre Biskit
- Lineas 1570-1573: Badge fallback "Like a Rocket" -> "Biskit Agencia"

**`src/pages/CalendarioNuevo.tsx`**
- Linea 122: Filtro de agencies incluye 'likearocket' -> eliminar

**`src/utils/calendarPdfGenerator.ts`**
- Linea 90: Logo `/logo-likearocket.png` -> `/logo-biskit.png`
- Linea 164: "Generado con Like a Rocket" -> "Generado con Biskit Agencia"

### 3.3 Migracion de datos (base de datos)

- Cambiar el DEFAULT de la columna `agencies` en `content_calendars` de `ARRAY['likearocket']` a `ARRAY['biskit']`
- Actualizar cualquier registro existente que todavia tenga 'likearocket' en el array de agencies (aunque la consulta muestra que todos ya son 'biskit')

---

## Resumen de archivos a modificar

| Archivo | Cambios |
|---|---|
| `src/pages/CalendarioEditar.tsx` | Separar insert/upsert para posts nuevos vs existentes |
| `src/hooks/useCalendarCrm.ts` | Cambiar fallback agencies a 'biskit' |
| `src/pages/CalendariosCrm.tsx` | Eliminar referencias 'likearocket' en badges |
| `src/pages/CalendarioDetalle.tsx` | Eliminar logo/texto fallback Like a Rocket |
| `src/pages/CalendarioNuevo.tsx` | Eliminar 'likearocket' del filtro de agencies |
| `src/utils/calendarPdfGenerator.ts` | Logo y footer a Biskit Agencia |
| `supabase/functions/send-calendar-email/index.ts` | Simplificar branding a solo Biskit |
| `supabase/functions/publish-calendar-update/index.ts` | FROM_EMAIL y texto del email |
| `supabase/functions/approve-calendar/index.ts` | FROM_EMAIL, URL hardcodeada, footer |
| `supabase/functions/send-feedback-notification/index.ts` | Footer del email |
| Migracion SQL | DEFAULT de agencies column |

## Secuencia de implementacion

1. Migracion SQL para cambiar el default de la columna agencies
2. Corregir guardado en CalendarioEditar.tsx
3. Limpiar referencias Like a Rocket en frontend (4 archivos)
4. Limpiar edge functions (4 archivos) y desplegarlas
