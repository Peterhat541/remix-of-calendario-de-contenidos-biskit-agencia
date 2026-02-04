
# Plan: Unificación a Biskit Agencia

## Resumen Ejecutivo

Unificaremos todo el proyecto bajo la marca **Biskit Agencia**, eliminando el sistema dual de agencias (Like a Rocket / Biskit) y aplicando el branding corporativo de Biskit: fondo negro con amarillo como color de acento.

---

## 1. Cambios de Branding (Colores)

### 1.1 Actualizar variables CSS (`src/index.css`)

Modificaremos las variables CSS raíz para usar los colores de Biskit:

| Variable actual | Nuevo valor | Descripción |
|-----------------|-------------|-------------|
| `--primary` | `54 100% 50%` | Amarillo Biskit como color primario |
| `--background` | `0 0% 5%` | Fondo negro/oscuro |
| `--foreground` | `0 0% 95%` | Texto claro |
| `--card` | `0 0% 8%` | Tarjetas oscuras |
| `--accent` | `54 100% 50%` | Amarillo para acentos |
| `--ring` | `54 100% 50%` | Amarillo para focus |
| `--highlight` | `54 100% 50%` | Amarillo para highlights |

Se eliminarán los comentarios de "Like a Rocket" y las variables específicas de marca dual.

### 1.2 Actualizar Tailwind Config (`tailwind.config.ts`)

- Eliminar colores específicos de "brand-pink", "brand-teal", "brand-light"
- Mantener colores biskit como principales
- Simplificar la paleta de colores

---

## 2. Eliminar Sistema Dual de Agencias

### 2.1 Actualizar tipos (`src/types/calendarCrm.ts`)

```text
ANTES:
  type Agency = 'likearocket' | 'biskit';
  AGENCIES = [{ id: 'likearocket', ... }, { id: 'biskit', ... }]

DESPUES:
  type Agency = 'biskit';
  AGENCIES = [{ id: 'biskit', name: 'Biskit Agencia', logo: '/logo-biskit.png' }]
```

### 2.2 Actualizar página Home (`src/pages/CalendarioHome.tsx`)

- Eliminar los dos botones de selección de agencia
- Un solo botón CTA: "Crear Calendario"
- Cambiar logo de Like a Rocket por logo Biskit
- Actualizar footer con branding Biskit

### 2.3 Actualizar listado de calendarios (`src/pages/CalendariosCrm.tsx`)

- Eliminar tabs de filtro por agencia (Like a Rocket / Biskit / Todos)
- Simplificar la vista sin filtros de agencia
- Los calendarios existentes se mantendrán pero se mostrarán todos juntos

### 2.4 Actualizar formulario nuevo calendario (`src/pages/CalendarioNuevo.tsx`)

- Eliminar selector de agencias
- Establecer "biskit" como agencia por defecto fija
- Actualizar header con logo Biskit

### 2.5 Actualizar páginas adicionales

- `CalendarioContenidos.tsx`: Cambiar logo a Biskit
- `CalendarioEditar.tsx`: Cambiar logo a Biskit
- `CalendarioDetalle.tsx`: Simplificar lógica de theming, usar solo Biskit

---

## 3. Actualizar Componentes de Compartir

### 3.1 `ShareDocumentCover.tsx`
- Cambiar gradiente de header a amarillo Biskit

### 3.2 `ShareDocumentFooter.tsx`
- Actualizar branding si existe referencia a Like a Rocket

### 3.3 `SendEmailModal.tsx`
- Cambiar referencia "Equipo Like a Rocket" por "Equipo Biskit Agencia"

---

## 4. Actualizar Metadatos

### 4.1 `index.html`
- Título: "Calendario de Contenidos - Biskit Agencia"
- Meta author: "Biskit Agencia"
- Open Graph tags con nueva marca

---

## 5. Archivos que NO se modifican

- `/public/logo-biskit.png` - Ya existe y es correcto
- Tablas de base de datos - Los calendarios existentes mantienen sus agencias guardadas
- Edge functions - No requieren cambios

---

## Resumen de Archivos a Modificar

| Archivo | Tipo de cambio |
|---------|----------------|
| `src/index.css` | Colores CSS |
| `tailwind.config.ts` | Paleta de colores |
| `src/types/calendarCrm.ts` | Simplificar tipos |
| `src/pages/CalendarioHome.tsx` | UI + branding |
| `src/pages/CalendariosCrm.tsx` | Eliminar filtros agencia |
| `src/pages/CalendarioNuevo.tsx` | Eliminar selector |
| `src/pages/CalendarioContenidos.tsx` | Logo |
| `src/pages/CalendarioEditar.tsx` | Logo |
| `src/pages/CalendarioDetalle.tsx` | Simplificar theming |
| `src/components/SendEmailModal.tsx` | Nombre equipo |
| `src/components/share/ShareDocumentCover.tsx` | Colores |
| `index.html` | Metadatos |

---

## Resultado Final

- Toda la aplicación tendrá el branding de Biskit Agencia
- Fondo oscuro con acentos amarillos
- Un solo flujo de creación de calendarios (sin selección de agencia)
- Los calendarios existentes seguirán funcionando

