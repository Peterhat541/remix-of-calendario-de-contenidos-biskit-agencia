
# Fix: sigue fallando “Actualizar documento”

## Diagnóstico
Do I know what the issue is? Sí.

El error no está en la actualización de `documents` en sí. El flujo falla justo después, cuando `updateShareDocument` intenta guardar el historial en `content_calendar_edits` con `action: 'document_updated'`. La base de datos sigue teniendo un `CHECK` constraint antiguo (`content_calendar_edits_action_check`) que no permite ese valor.

Además, ese constraint también está desalineado con otros valores que ya usa el proyecto:
- `approved_no_changes`
- `approval_notification_sent`
- `approval_notification_error`
- `feedback_reviewed_approved`
- `document_updated`
- `calendar_edited`

Por eso sigue saliendo el toast genérico “Error al actualizar el documento”: el `catch` engloba tanto la actualización del documento como el registro del historial.

## Plan

### 1. Corregir la base de datos
Crear una migración para reemplazar `content_calendar_edits_action_check` y permitir todos los valores realmente usados por la app y el backend:
- `created`
- `updated`
- `calendar_edited`
- `pdf_generated`
- `status_changed`
- `note_added`
- `feedback_received`
- `feedback_reviewed`
- `feedback_reviewed_approved`
- `approved_no_changes`
- `approval_notification_sent`
- `approval_notification_error`
- `email_sent`
- `calendar_sent`
- `email_error`
- `document_updated`

### 2. Endurecer `updateShareDocument`
En `src/pages/CalendarioDetalle.tsx`:
- separar el error del `UPDATE` real del error del log de historial
- si el documento se actualiza bien, no marcar toda la acción como fallida solo porque falle `content_calendar_edits`
- mostrar un error más preciso en consola/toast cuando falle el histórico

Aplicar esto en los dos caminos:
- actualizar documento existente
- crear nuevo documento + nuevo enlace cuando cambian los meses visibles

### 3. Alinear tipos del frontend
Actualizar `src/types/calendarCrm.ts` para que `CalendarEditAction` coincida con los valores válidos de base de datos y no vuelva a haber desfases entre frontend y backend.

### 4. Verificación
Comprobar después del fix:
- actualizar documento sin cambiar meses visibles
- actualizar documento cambiando meses visibles
- generación de nuevo enlace al cambiar periodo
- registro correcto del historial sin romper el flujo
- aprobación desde enlace público sin errores de historial

## Archivos afectados
- `supabase/migrations/...` nueva migración para `content_calendar_edits_action_check`
- `src/pages/CalendarioDetalle.tsx`
- `src/types/calendarCrm.ts`

## Detalle técnico
```text
updateShareDocument()
  -> UPDATE public.documents
  -> INSERT INTO public.content_calendar_edits (action='document_updated')
  -> falla el CHECK constraint
  -> entra en catch
  -> aparece "Error al actualizar el documento"
```

Es decir: el documento puede llegar a actualizarse, pero el histórico rompe la operación y hace que el botón parezca fallar.
