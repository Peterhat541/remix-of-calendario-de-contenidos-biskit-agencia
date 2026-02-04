
# Plan: Corregir Textos Amarillos Ilegibles

## Problema Identificado

Varios elementos de la interfaz usan la clase `text-primary` que aplica el color amarillo al texto, haciéndolo ilegible sobre fondos claros.

### Regla de Diseño Establecida:
- Los textos siempre deben ser negros (`text-foreground`)
- El amarillo Biskit solo se usa para fondos de botones CTA y acentos decorativos
- En elementos seleccionables con fondo amarillo, el texto debe ser negro

---

## Elementos Afectados

| Archivo | Elemento | Problema |
|---------|----------|----------|
| `CalendarioDetalle.tsx` | Selector de meses visibles | `text-primary` en estado seleccionado |
| `CalendarioDetalle.tsx` | Badge "Actual" | `text-primary` en badge |
| `CalendarioDetalle.tsx` | Enlaces (PDF, Share link) | `text-primary` para links |
| `CalendarioNuevo.tsx` | Badge "Biskit Agencia" | `text-primary` en badge |
| `SharePublicationCard.tsx` | Badge "Con propuestas" | `text-primary` en badge |
| `CalendarioHome.tsx` | Iconos de features | `text-primary` para iconos |
| `button.tsx` | Variante "link" | `text-primary` para enlaces |
| `calendar.tsx` | Día seleccionado/hoy | `text-accent-foreground` (ya correcto) |

---

## Solución Propuesta

### 1. Selector de Meses (`CalendarioDetalle.tsx`)

**Antes:**
```text
selectedVisibleMonths.includes(month.key) 
  ? 'bg-primary/10 border-primary/30 text-primary'
  : 'bg-muted border-border text-muted-foreground'
```

**Después:**
```text
selectedVisibleMonths.includes(month.key) 
  ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
  : 'bg-muted border-border text-muted-foreground'
```

El fondo amarillo claro (`bg-primary/10`) se mantiene para indicar selección, pero el texto será negro.

### 2. Badges con `text-primary`

Cambiar todos los badges que usan `text-primary` a `text-foreground`:

- Badge "Actual": `text-primary` → `text-foreground`
- Badge "Biskit Agencia": `text-primary` → `text-foreground`  
- Badge "Con propuestas": `text-primary` → `text-foreground`

### 3. Enlaces y Links

Para enlaces que necesitan destacar pero ser legibles, cambiar:
- `text-primary` → `text-foreground underline` o `text-foreground hover:text-primary`

Alternativamente, crear una clase específica para links que use el negro con subrayado amarillo en hover.

### 4. Iconos Decorativos

Los iconos en `CalendarioHome.tsx` pueden mantener `text-primary` ya que son elementos decorativos pequeños, pero opcionalmente podrían cambiarse a `text-foreground` para consistencia total.

### 5. Botón Variante "Link" (`button.tsx`)

**Antes:**
```text
link: "text-primary underline-offset-4 hover:underline"
```

**Después:**
```text
link: "text-foreground underline-offset-4 hover:underline hover:text-primary/80"
```

### 6. Componente Calendar (`calendar.tsx`)

Revisar `day_today` que usa `text-accent-foreground` - actualmente es negro (`0 0% 5%`) lo cual es correcto. No requiere cambios.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/CalendarioDetalle.tsx` | Selector meses, Badge "Actual", enlaces |
| `src/pages/CalendarioNuevo.tsx` | Badge "Biskit Agencia" |
| `src/components/share/SharePublicationCard.tsx` | Badge "Con propuestas" |
| `src/components/ui/button.tsx` | Variante "link" |
| `src/pages/CalendarioHome.tsx` | Iconos (opcional) |

---

## Resultado Visual Esperado

### Selector de Meses:
```text
┌──────────────────────────────────────────┐
│  [Enero]  [Febrero ✓]  [Marzo ✓]  [Abril]│
│   gris     AMARILLO     AMARILLO   gris  │
│   claro   texto NEGRO  texto NEGRO claro │
└──────────────────────────────────────────┘
```

### Badges:
```text
┌─────────────────────────────────┐
│  [Biskit Agencia]  [Actual]     │
│   fondo amarillo   fondo amarillo│
│   texto NEGRO      texto NEGRO   │
└─────────────────────────────────┘
```

---

## Beneficios

- Todos los textos serán legibles (negro sobre fondos claros)
- El amarillo Biskit seguirá presente como color de acento en fondos y bordes
- Coherencia con las reglas de diseño establecidas
- Mejora significativa de la experiencia de usuario
