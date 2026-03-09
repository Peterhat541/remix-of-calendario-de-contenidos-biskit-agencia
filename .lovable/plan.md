

# Fix: Enlace compartido no se puede generar — Políticas RLS restrictivas

## Problema
Las políticas RLS de las tablas `share_links` y `documents` para usuarios autenticados están marcadas como **RESTRICTIVE** (`Permissive: No`). En PostgreSQL, las políticas restrictivas solo funcionan como filtro adicional sobre políticas permisivas existentes. Como no hay ninguna política permisiva para usuarios autenticados en estas tablas, todas las operaciones (INSERT, UPDATE, DELETE, SELECT) fallan silenciosamente.

## Solución
Reemplazar las políticas restrictivas por políticas **permisivas** en ambas tablas para usuarios autenticados.

## Detalles tecnicos

### Migración SQL

```sql
-- Fix share_links: drop restrictive, create permissive
DROP POLICY IF EXISTS "Authenticated users can manage share_links" ON public.share_links;
CREATE POLICY "Authenticated users can manage share_links"
ON public.share_links FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix documents: drop restrictive, create permissive
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON public.documents;
CREATE POLICY "Authenticated users can manage documents"
ON public.documents FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### Sin cambios en el frontend
El código de generación de enlace en `CalendarioDetalle.tsx` es correcto. El fallo viene exclusivamente de las políticas RLS.

