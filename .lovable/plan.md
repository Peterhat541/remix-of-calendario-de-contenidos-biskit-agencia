
# Plan: Tema Claro con Beige - Biskit Agencia

## Resumen del Cambio

Transformaremos el diseño oscuro actual a un tema **claro, cálido y moderno** usando:
- Fondo blanco puro para áreas principales
- **Beige claro** para fondos secundarios y elementos sutiles (en lugar de gris)
- Textos siempre negros/oscuros para máxima legibilidad
- Amarillo Biskit SOLO para botones CTA y acentos puntuales

---

## 1. Nueva Paleta de Colores con Beige

### Tonos de Beige a Usar

| Nombre | HSL | Hex Aprox. | Uso |
|--------|-----|------------|-----|
| Beige muy claro | `40 30% 98%` | `#FDFCFA` | Fondos sutiles |
| Beige claro | `40 25% 96%` | `#F8F6F2` | Cards, secundarios |
| Beige medio | `40 20% 92%` | `#EDE9E3` | Bordes, inputs |
| Beige oscuro | `40 15% 55%` | `#998F82` | Texto secundario |

### Variables CSS Actualizadas

| Variable | Valor Actual | Nuevo Valor | Descripción |
|----------|--------------|-------------|-------------|
| `--background` | `0 0% 5%` (negro) | `0 0% 100%` | Blanco puro |
| `--foreground` | `0 0% 95%` | `0 0% 9%` | Negro para texto |
| `--card` | `0 0% 8%` | `40 25% 98%` | Beige muy claro |
| `--card-foreground` | `0 0% 95%` | `0 0% 9%` | Negro |
| `--secondary` | `0 0% 12%` | `40 25% 96%` | Beige claro |
| `--muted` | `0 0% 15%` | `40 20% 96%` | Beige claro |
| `--muted-foreground` | `0 0% 65%` | `40 15% 40%` | Beige oscuro |
| `--border` | `0 0% 18%` | `40 20% 90%` | Beige para bordes |
| `--input` | `0 0% 18%` | `40 20% 90%` | Bordes de inputs |
| `--surface-elevated` | `0 0% 10%` | `40 25% 99%` | Casi blanco cálido |
| `--border-subtle` | `0 0% 20%` | `40 20% 92%` | Bordes sutiles beige |

### Colores que SE MANTIENEN:
- `--primary`: `54 100% 50%` (Amarillo Biskit) - Solo para CTAs
- `--primary-foreground`: `0 0% 5%` - Texto en botones
- `--accent`: `54 100% 50%` - Acentos amarillos
- `--ring`: `54 100% 50%` - Focus en inputs
- `--destructive`: `0 84% 60%` - Errores/eliminar

---

## 2. Filosofía de Diseño

### Reglas de Color:
1. **Textos**: Negro (`--foreground`) o beige oscuro (`--muted-foreground`)
2. **Amarillo**: EXCLUSIVO para CTAs, focus rings, y acentos decorativos
3. **Fondos**: Blanco puro o beige claro (nunca gris)
4. **Bordes**: Beige sutil, elegante

### Sensación Visual:
- Calidez: El beige aporta calidez sin ser invasivo
- Elegancia: Aspecto premium y sofisticado
- Modernidad: Limpio y minimalista
- Tranquilidad: No agresivo ni abrumador

---

## 3. Cambios en CSS

### Nuevas variables `:root` en `src/index.css`:

```css
:root {
  /* Tema claro con beige - Biskit Agencia */
  --background: 0 0% 100%;           /* Blanco puro */
  --foreground: 0 0% 9%;             /* Negro para texto */

  --card: 40 25% 98%;                /* Beige muy claro */
  --card-foreground: 0 0% 9%;

  --popover: 0 0% 100%;              /* Blanco */
  --popover-foreground: 0 0% 9%;

  /* Amarillo Biskit - SOLO CTAs */
  --primary: 54 100% 50%;
  --primary-foreground: 0 0% 5%;

  --secondary: 40 25% 96%;           /* Beige claro */
  --secondary-foreground: 0 0% 9%;

  --muted: 40 20% 96%;               /* Beige suave */
  --muted-foreground: 40 15% 40%;    /* Beige oscuro legible */

  --accent: 54 100% 50%;             /* Amarillo */
  --accent-foreground: 0 0% 5%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --border: 40 20% 90%;              /* Beige para bordes */
  --input: 40 20% 90%;
  --ring: 54 100% 50%;               /* Focus amarillo */

  /* Custom tokens */
  --surface-elevated: 40 25% 99%;    /* Casi blanco cálido */
  --text-label: 40 15% 35%;          /* Labels beige oscuro */
  --text-heading: 0 0% 9%;           /* Headers negros */
  --border-subtle: 40 20% 92%;       /* Bordes sutiles beige */
  --highlight: 54 100% 50%;          /* Amarillo */
}
```

### Estilos de formularios:

```css
.form-input {
  @apply w-full px-4 py-3 text-base 
         bg-white border border-input rounded-lg 
         text-foreground
         placeholder:text-muted-foreground 
         focus:outline-none focus:ring-2 focus:ring-primary/20 
         focus:border-primary/50 transition-all;
}
```

---

## 4. Comparación Visual

### Antes (Oscuro):
```text
┌─────────────────────────────────┐
│ [Fondo NEGRO]                   │
│  ┌───────────────────────────┐  │
│  │ [Card GRIS OSCURO]        │  │
│  │  Texto blanco             │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Después (Claro + Beige):
```text
┌─────────────────────────────────┐
│ [Fondo BLANCO]                  │
│  ┌───────────────────────────┐  │
│  │ [Card BEIGE CLARO]        │  │
│  │  Texto negro              │  │
│  │  [Input blanco + borde]   │  │
│  └───────────────────────────┘  │
│                                 │
│  [Botón Amarillo Biskit]        │
└─────────────────────────────────┘
```

---

## 5. Archivos a Modificar

| Archivo | Tipo de cambio |
|---------|----------------|
| `src/index.css` | Variables CSS completas + estilos base |

La mayoría de componentes **heredarán automáticamente** el nuevo tema ya que usan las variables CSS. No requieren modificaciones directas.

---

## 6. Resultado Esperado

- **Fondo**: Blanco limpio
- **Cards y secciones**: Beige claro cálido
- **Textos**: Negro/beige oscuro (siempre legibles)
- **Inputs**: Fondo blanco con borde beige
- **CTAs**: Botones amarillos Biskit (único color vibrante)
- **Bordes**: Beige sutil y elegante
- **Sensación**: Moderna, tranquila, profesional

