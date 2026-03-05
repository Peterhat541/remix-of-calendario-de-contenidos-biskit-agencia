

# Fix: Responsive móvil en la vista compartida del cliente

## Problema
En la captura se ve que el footer fijo con los botones "Aprobar sin modificaciones" y "Enviar feedback" se corta horizontalmente en móvil. Los botones no caben en una fila y el texto de estado se solapa con ellos.

## Cambios

### 1. `ShareDocumentFooter.tsx` - Footer responsive
- Cambiar el layout del footer de `flex items-center justify-between` (horizontal) a **columna vertical en móvil** (`flex-col` en mobile, `sm:flex-row` en desktop)
- Apilar los botones verticalmente en móvil: `flex-col sm:flex-row`
- Hacer los botones `w-full` en móvil para que ocupen todo el ancho
- Reducir padding en móvil: `px-4 py-3 sm:px-6 sm:py-4`

### 2. `SharePublicationCard.tsx` - Cards responsive
- El grid de imagen + contenido ya usa `md:grid-cols-[320px_1fr]` (se apila en móvil), esto está bien
- Reducir padding en móvil: `p-4 sm:p-6` en el contenido principal
- Reducir padding en la sección de propuestas: `px-4 sm:px-6`

### 3. Espacio inferior para el footer
- Asegurar que el contenido principal tenga `pb-40 sm:pb-24` para que el footer fijo no tape el último contenido en móvil (donde el footer será más alto al apilarse)

