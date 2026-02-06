
# Plan: Corregir los 4 errores criticos

## Error 1: No se guardan los calendarios

**Causa**: El guardado usa un patron destructivo: primero BORRA todos los posts y luego intenta insertarlos de nuevo. Si la insercion falla (timeout, error de red), los posts se pierden para siempre.

**Solucion**: Cambiar a un patron seguro de UPSERT en `src/pages/CalendarioEditar.tsx`:
- Primero insertar/actualizar todos los posts (upsert)
- Solo despues borrar los posts que ya no existen en la interfaz
- Incluir los campos que faltan: `post_format`, `objective`, `theme_context`, `ai_generated`, `ai_copy_prompt`, `ai_image_prompt`
- Mejorar el manejo de errores: si falla el upsert, no borrar nada

**Detalle tecnico**:
```text
ANTES (peligroso):
  1. DELETE todos los posts
  2. INSERT posts nuevos (si falla, todo perdido)

DESPUES (seguro):
  1. Recoger IDs de posts en la interfaz
  2. UPSERT cada post (insert si es nuevo, update si existe)
  3. DELETE solo los posts que el usuario elimino
  4. Si falla, los datos originales siguen intactos
```

Se necesita una migracion para crear una funcion de upsert o usar el metodo `.upsert()` del SDK con `onConflict: 'id'`. Los posts nuevos generados en el frontend usan IDs temporales (tipo `post-xxxxx`), asi que se insertaran como nuevos y los existentes (con UUID real) se actualizaran.

---

## Error 2: Anadir un mes nuevo borra todo el contenido

**Causa**: Cuando se extiende el rango de fechas en `CalendarioDetalle.tsx` (funcion `handleExtendDates`), solo se actualiza `month_end` en la base de datos. Luego, al abrir el editor (`CalendarioEditar.tsx`), la funcion `loadCalendarData` regenera la estructura de meses con `generateMonthsArray`. Los posts existentes se asignan correctamente a sus meses, pero el problema esta en que los posts nuevos vacios del mes anadido NO tienen contenido, y la funcion `generateMonthsArray` devuelve meses con `posts: []`. Los posts existentes se cargan bien PERO el patron destructivo de guardado (Error 1) hace que si el usuario guarda sin rellenar el mes nuevo, se pierden posts que no pasan el filtro.

**Solucion**: Al corregir el Error 1 con upsert, este problema se resuelve automaticamente. Los posts existentes nunca se borran a menos que el usuario los elimine explicitamente.

---

## Error 3: El feedback del cliente no llega a los responsables

**Causa**: Dos problemas en `supabase/functions/send-feedback-notification/index.ts`:

1. **CORS incompletos** (linea 9-10): Faltan cabeceras que el cliente Supabase envia (`x-supabase-client-platform`, etc.), lo que puede causar que la peticion preflight falle.

2. **URL interna incorrecta** (linea 210): La URL esta hardcodeada como `https://likearocket-calendario.lovable.app` cuando la URL real de produccion es `https://clientesbiskit.lovable.app`. Los emails con enlaces internos apuntan al sitio equivocado.

3. **FROM_EMAIL**: El remitente configurado en la funcion (linea 185) usa `Like a Rocket` como fallback pero segun la configuracion del proyecto debe ser `Biskit Agencia <noreply@biskitagencia.com>`.

**Solucion**: 
- Actualizar las cabeceras CORS para incluir todas las necesarias
- Recibir `publicBaseUrl` como parametro del body (igual que hace `publish-calendar-update`) en lugar de hardcodear la URL
- Actualizar el fallback de FROM_EMAIL
- Actualizar la llamada en `ShareCalendar.tsx` para enviar `publicBaseUrl`

---

## Error 4: La pagina no carga al iniciar sesion

**Causa**: Los logs muestran `Invalid Refresh Token: Refresh Token Not Found`. Esto ocurre cuando el token de refresco almacenado en localStorage ya no es valido (sesion expirada o invalidada). El `AuthProvider` entra en un estado donde `loading` permanece `true` indefinidamente porque:

1. `getSession()` devuelve una sesion con token expirado
2. `onAuthStateChange` intenta refrescar el token y falla
3. El estado `loading` nunca se pone a `false` en el caso de error de refresco

Ademas, los logs de consola muestran: `Function components cannot be given refs` para `RouteGuard`. Esto es un warning de React que no deberia causar el bloqueo, pero indica que hay un intento de pasar una ref a un componente funcional.

**Solucion** en `src/hooks/useAuth.tsx`:
- Manejar el error de refresco de token: si `onAuthStateChange` recibe un evento `TOKEN_REFRESHED` con error o `SIGNED_OUT`, poner `loading = false`
- Anadir un timeout de seguridad: si despues de 5 segundos `loading` sigue en `true`, forzarlo a `false`
- Limpiar localStorage si el token es invalido para evitar el loop

---

## Archivos a modificar

1. `src/pages/CalendarioEditar.tsx` - Cambiar DELETE+INSERT por UPSERT (errores 1 y 2)
2. `supabase/functions/send-feedback-notification/index.ts` - CORS, URL, FROM_EMAIL (error 3)
3. `src/pages/ShareCalendar.tsx` - Enviar publicBaseUrl al llamar feedback (error 3)
4. `src/hooks/useAuth.tsx` - Timeout de seguridad y manejo de token invalido (error 4)
