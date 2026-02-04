
# Implementar URLs Amigables para Calendarios Compartidos

## Situación Actual
- La ruta `/share/:token` ya es pública y accesible sin login
- El token actual es un UUID largo: `fcb1757d-1482-4fa2-9fc6-3a5be7182f5c`
- URL actual: `biskitagencia.com/share/fcb1757d-1482-4fa2-9fc6-3a5be7182f5c`

## Solución Propuesta
Añadir un campo `slug` opcional a la tabla `share_links` que permita crear URLs amigables manteniendo compatibilidad con los tokens UUID existentes.

**URL amigable resultante:**
```
biskitagencia.com/c/nombrecliente
```

## Cambios a Implementar

### 1. Base de Datos
- Añadir columna `slug` (varchar, único, nullable) a la tabla `share_links`
- El slug sería opcional: si existe se usa la URL corta, si no se mantiene el token UUID

### 2. Frontend - Nueva Ruta
- Añadir ruta `/c/:slug` en `App.tsx` apuntando a `ShareCalendar`

### 3. Página ShareCalendar
- Modificar para aceptar tanto `token` como `slug` como parámetro
- Buscar primero por slug, luego por token

### 4. Panel de Administración (CalendarioDetalle)
- Añadir campo editable para personalizar el slug al generar/actualizar el enlace
- Auto-generar slug sugerido basado en el nombre del cliente (ej: "Bar La Pepa" → "bar-la-pepa")
- Mostrar ambas URLs: la corta con slug y la larga con token

## Ejemplo de Uso
Al compartir el calendario de "Bar La Pepa":
- **URL corta:** `biskitagencia.com/c/bar-la-pepa`
- **URL larga (backup):** `biskitagencia.com/share/fcb1757d-...`

Ambas funcionan, el cliente recibe la corta en el email.

---

## Detalles Técnicos

### Migración SQL
```sql
ALTER TABLE share_links 
ADD COLUMN slug TEXT UNIQUE;
```

### Lógica de Resolución
```text
Ruta /c/:slug  →  Buscar en share_links WHERE slug = :slug
Ruta /share/:token  →  Buscar en share_links WHERE token = :token
```

### Generación de Slug
- Convertir nombre a minúsculas
- Reemplazar espacios por guiones
- Eliminar caracteres especiales
- Verificar unicidad antes de guardar

