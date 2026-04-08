

# Fix: Guardado de calendario falla por tamaño excesivo de datos

## Problema raíz

Las imágenes de los posts se almacenan como **datos base64** directamente en el campo `image_url` de `calendar_posts` (promedio 1.3MB por imagen, máximo 3MB). Cuando se guarda el calendario, se construye un JSON con todas las imágenes incluidas y se actualiza el campo `content_json` de `documents`. Con ~20+ posts, este JSON alcanza **20-36MB**, provocando **timeouts** en la base de datos.

```text
calendar_posts.image_url → base64 (1-3MB cada uno)
  ↓ (se copian al guardar)
documents.content_json → JSON con todos los posts + imágenes → 20-36MB
  ↓
UPDATE documents SET content_json = {36MB de JSON}
  ↓
Statement timeout → "Error al guardar"
```

## Solución

### 1. Subir imágenes al almacenamiento (Storage)

Modificar el flujo de subida de imágenes en `CalendarioEditar.tsx` para que, en vez de guardar el base64 en `image_url`, suba el archivo al bucket `content-calendars` y guarde solo la URL pública.

- Al pegar una imagen del portapapeles o subir un archivo, subirlo a Storage
- Guardar la URL pública resultante en `image_url` (en vez del base64)
- Esto reduce cada imagen de ~1-3MB a una URL de ~100 caracteres

### 2. Migrar imágenes existentes

Crear un script/utilidad que recorra los posts existentes con `image_url` de tipo base64 (`data:image/...`), suba cada imagen a Storage y actualice la URL. Esto se puede ejecutar una sola vez.

### 3. Reducir tamaño de `content_json`

Al construir el `content_json` para documentos compartidos, las imágenes ya serán URLs pequeñas en vez de base64, reduciendo el JSON de 20-36MB a menos de 100KB.

## Archivos afectados

- `src/pages/CalendarioEditar.tsx` — modificar el manejo de imágenes para subir a Storage
- `src/pages/CalendarioDetalle.tsx` — el `updateShareDocument` se beneficia automáticamente al reducirse el tamaño del JSON
- Posiblemente `src/components/CalendarPostEditor.tsx` — si aquí se maneja la subida de imágenes

## Detalle técnico

```text
Antes:                              Después:
clipboard → base64 → image_url     clipboard → Storage → URL → image_url
file input → base64 → image_url    file input → Storage → URL → image_url
content_json: 20-36MB              content_json: <100KB
UPDATE: timeout                    UPDATE: <1 segundo
```

## Alternativa rápida (temporal)

Si se necesita una solución inmediata sin refactorizar las imágenes, se puede excluir las imágenes base64 del `content_json` al guardar el documento compartido, y cargarlas por separado desde `calendar_posts` al renderizar la vista pública. Esto es menos limpio pero resuelve el timeout de inmediato.

