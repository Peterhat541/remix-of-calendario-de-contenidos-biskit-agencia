
# Simplificar feedback del cliente

## Cambios

1. **Eliminar el campo "Nota"** del componente `SharePublicationCard.tsx` (líneas 173-188 aprox.)
2. **Eliminar el campo "note"** del tipo `PostProposal` en `src/types/shareCalendar.ts`
3. **Actualizar el contador** de cambios en el badge "Con propuestas" y el texto "(X cambios)" para no contar `note`
4. **Renombrar visualmente** "Comentario" a solo "Comentario" (ya está así, se mantiene)

## Detalles tecnicos

### `src/types/shareCalendar.ts`
- Eliminar `note?: string` de `PostProposal`

### `src/components/share/SharePublicationCard.tsx`
- Eliminar la seccion completa de "Nota" (icono StickyNote + Textarea)
- Eliminar `note` de la variable `hasProposals`
- Eliminar `note` del conteo de cambios
- Eliminar import de `StickyNote`
- Actualizar la interfaz `onUpdateProposal` para no incluir `'note'` como opcion

### `src/components/share/ShareMonthSection.tsx`
- Actualizar el tipo de `onUpdateProposal` para eliminar `'note'` de las opciones de field

### Otros archivos que referencien `note` en propuestas
- Verificar `ShareCalendar.tsx` y cualquier otro consumidor para eliminar referencias a `note`
