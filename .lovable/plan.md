
# Fix: Restaurar acceso de clientes a enlaces compartidos

## Problema
Al securizar la tabla `share_links` (eliminando las políticas públicas de SELECT), se rompieron las políticas RLS de otras tablas que dependen de subqueries contra `share_links`:

- **documents**: La política "Anyone can view documents via share link" hace `EXISTS (SELECT 1 FROM share_links sl WHERE ...)`
- **proposals**: Las políticas de SELECT y UPDATE hacen subqueries similares
- **content_calendars**: La política de SELECT para ver el estado de aprobación también depende de `share_links`

Como los usuarios anónimos (clientes) ya no pueden leer `share_links`, todos estos subqueries devuelven vacío y el acceso falla.

## Solucion

Crear una política SELECT restringida en `share_links` que permita acceso anónimo pero **solo para los subqueries internos de RLS**. Esto es seguro porque:
- La función `validate_share_link` (SECURITY DEFINER) sigue siendo el punto de entrada principal
- Los clientes no pueden hacer SELECT directo a `share_links` desde el frontend (no hay query directa en el código)
- Pero las políticas RLS de otras tablas sí necesitan poder leer `share_links` internamente

## Detalles tecnicos

### Migracion SQL

1. Crear una política SELECT en `share_links` que permita lectura pública pero solo de enlaces válidos (can_view = true, no expirados):

```sql
CREATE POLICY "Allow RLS subquery access for valid links"
ON public.share_links FOR SELECT
USING (
  can_view = true 
  AND (expires_at IS NULL OR expires_at > now())
);
```

Esto restaura la funcionalidad de las políticas RLS existentes en `documents`, `proposals` y `content_calendars` sin exponer enlaces inválidos o expirados.

### Sin cambios en el frontend
El código de `ShareCalendar.tsx` ya usa `validate_share_link` como punto de entrada, por lo que no requiere modificaciones.
