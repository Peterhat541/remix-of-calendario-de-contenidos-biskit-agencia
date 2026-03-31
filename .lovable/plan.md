
# Fix: Botón "Actualizar documento" falla silenciosamente

## Problema
La función `updateShareDocument` en `CalendarioDetalle.tsx` no comprueba los errores de las llamadas a Supabase en el flujo principal (líneas 700-707). Si la actualización del documento falla, el error se traga silenciosamente, y en algunos casos puede mostrar "éxito" cuando realmente falló.

Además, hay un problema potencial de lógica: cuando `visibleMonthsToSave` es `null` (todos los meses seleccionados) y `existingVisibleMonths` también es `null`, la comparación `JSON.stringify(null) !== JSON.stringify(null)` devuelve `false`, lo cual es correcto. Pero si `existingVisibleMonths` quedó como un array vacío o un valor inconsistente tras operaciones anteriores, la comparación podría dar un falso positivo de "cambio", forzando la creación de un nuevo documento/link que puede fallar.

## Solución

### 1. `CalendarioDetalle.tsx` - Añadir manejo de errores explícito

En la función `updateShareDocument`:
- Capturar `{ error }` en la llamada `.update()` de documents (línea 700) y lanzar si hay error
- Capturar `{ error }` en la llamada `.insert()` de content_calendar_edits (línea 710) (menos crítico, solo log)
- Hacer lo mismo en el flujo `visibleMonthsChanged === true` para consistencia

### 2. Normalizar la comparación de `visibleMonths`

Asegurar que ambos valores se normalicen antes de comparar:
- Si `existingVisibleMonths` es `[]` (array vacío), tratarlo como `null`
- Si `selectedVisibleMonths` incluye todos los meses, tratarlo como `null`

## Detalle técnico

```typescript
// Línea ~700 - Añadir check de error
const { error: updateError } = await supabase
  .from('documents')
  .update({ 
    content_json: updatedContentJson, 
    updated_at: newUpdatedAt,
    visible_months: visibleMonthsToSave
  })
  .eq('id', doc.id);

if (updateError) throw updateError;
```

```typescript
// Normalizar visibleMonths antes de comparar
const normalizedExisting = existingVisibleMonths?.length ? existingVisibleMonths : null;
const visibleMonthsChanged = JSON.stringify(normalizedExisting) !== JSON.stringify(visibleMonthsToSave);
```

Estos cambios son solo en `src/pages/CalendarioDetalle.tsx`, sin cambios en backend.
