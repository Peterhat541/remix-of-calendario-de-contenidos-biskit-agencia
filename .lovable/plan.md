
# Plan: Corregir el borrado accidental de posts nuevos al guardar

## Problema encontrado

Hay un bug critico en la logica de guardado (`CalendarioEditar.tsx`): cuando se guardan posts **nuevos** (sin ID existente), se les asigna un UUID nuevo y se insertan correctamente. Pero inmediatamente despues, la logica de "limpieza" consulta TODOS los posts del calendario y borra los que no estan en la lista de IDs conocidos. Como los nuevos UUIDs no se incluyeron en esa lista, **los posts recien insertados se borran al instante**.

Esto afecta a cualquier usuario que anada posts nuevos. Si Sandra solo edita posts existentes, no ve el problema; Lucia, al crear posts nuevos, los pierde cada vez que guarda.

## Solucion

Un unico cambio en `src/pages/CalendarioEditar.tsx`, lineas 300-303:

**Antes:**
```text
const currentPostIds = postsToSave
  .filter(p => p.id)
  .map(p => p.id!);
```

**Despues:**
```text
const currentPostIds = [
  ...existingPostsToUpsert.map(p => p.id!),
  ...newPostsToInsert.map(p => p.id),
];
```

Esto incluye tanto los IDs de posts existentes como los UUIDs recien generados para posts nuevos, evitando que se borren accidentalmente.

## Detalles tecnicos

- **Archivo**: `src/pages/CalendarioEditar.tsx`
- **Lineas afectadas**: 300-303
- **Riesgo**: Bajo, cambio puntual y aislado
- **Impacto**: Ambos usuarios (Sandra y Lucia) podran guardar posts nuevos sin que se borren
