
# Plan: Mejoras en el Panel del Planificador de Contenidos

## Problemas Identificados

### 1. Selector de Meses - Botón "Ninguno" no funciona
**Causa**: La lógica trata `selectedVisibleMonths.length === 0` como "todos seleccionados"
**Ubicación**: `CalendarioDetalle.tsx` líneas 1744-1778

### 2. Enlace Compartido muestra "caducado"
**Causa**: El archivo `publicUrl.ts` tiene hardcodeado el dominio antiguo `likearocket-calendario.lovable.app`
**Ubicación**: `src/utils/publicUrl.ts` línea 2

### 3. Botón "Enviar email al cliente" bloqueado
**Causa**: La condición `canSendEmail` requiere:
- Email del contacto (OK si existe)
- Al menos un responsable asignado (`responsibleEmails.length > 0`)

Como la tabla `team_members_calendar` está vacía, no hay responsables para seleccionar.
**Ubicación**: `CalendarioDetalle.tsx` línea 165

### 4. Botón "Editar responsables" - No hay personas dadas de alta
**Causa**: La tabla `team_members_calendar` está vacía
**Solución**: Insertar a Lucía y Sandra como miembros del equipo

### 5. Página "Editar Calendario" - Botones PDF y falta botón "Enviar al cliente"
**Ubicación**: `CalendarioEditar.tsx` líneas 466-497
**Cambios solicitados**:
- Eliminar botón "Vista previa del PDF"
- Eliminar botón "Generar PDF"  
- Añadir botón "Enviar al cliente" que abra el modal de envío

---

## Soluciones Propuestas

### 1. Fix Selector de Meses (CalendarioDetalle.tsx)

**Cambio en checkbox visual**:
```typescript
// ANTES:
checked={selectedVisibleMonths.includes(month.key) || selectedVisibleMonths.length === 0}

// DESPUÉS:
checked={selectedVisibleMonths.includes(month.key)}
```

**Cambio en onChange**:
```typescript
// ANTES (lógica compleja):
onChange={() => {
  if (selectedVisibleMonths.length === 0) {
    setSelectedVisibleMonths([month.key]);
  } else {
    toggleMonthVisibility(month.key);
  }
}}

// DESPUÉS (simplificado):
onChange={() => toggleMonthVisibility(month.key)}
```

**Cambio en texto informativo**:
```typescript
// Añadir caso para ninguno seleccionado:
{selectedVisibleMonths.length === 0 && (
  <p className="text-destructive text-xs">
    ⚠️ Selecciona al menos un mes para compartir
  </p>
)}
```

**Inicializar con todos los meses seleccionados por defecto**

### 2. Fix URL del Enlace Compartido (publicUrl.ts)

Cambiar la lógica para usar siempre el origen actual (más robusto):

```typescript
// ANTES:
const PRODUCTION_URL = "https://likearocket-calendario.lovable.app";

export function getPublicBaseUrl(): string {
  const host = window.location.host;
  if (host.endsWith(".lovableproject.com")) {
    return PRODUCTION_URL;
  }
  return window.location.origin;
}

// DESPUÉS:
export function getPublicBaseUrl(): string {
  // Usar siempre el origen actual - funciona en preview y producción
  return window.location.origin;
}
```

### 3. Añadir Responsables (Lucía y Sandra)

Insertar en la tabla `team_members_calendar`:

```sql
INSERT INTO team_members_calendar (email, is_active) VALUES
  ('lucia@biskitagencia.com', true),
  ('sandra@biskitagencia.com', true);
```

Esto permitirá:
- Que aparezcan en el diálogo "Editar responsables"
- Que se puedan asignar al calendario
- Que el botón "Enviar email" se desbloquee al asignarlos

### 4. Modificar Página Editar Calendario (CalendarioEditar.tsx)

**Eliminar** los botones:
- "Vista previa del PDF" (líneas 468-475)
- "Generar PDF" (líneas 476-497)

**Añadir** botón "Enviar al cliente":
- Similar al botón de `CalendarioDetalle.tsx`
- Abre el modal `SendEmailModal` con `sendCalendarOnly={true}`
- Genera/actualiza el enlace de compartir antes de abrir el modal

**Imports necesarios**: Añadir `Mail`, `SendEmailModal`

**Estados nuevos**:
```typescript
const [emailModalOpen, setEmailModalOpen] = useState(false);
const [shareLink, setShareLink] = useState<string | null>(null);
const [isGeneratingLink, setIsGeneratingLink] = useState(false);
```

**Función para generar enlace**:
```typescript
const generateShareLinkForEmail = async () => {
  // Similar a CalendarioDetalle pero simplificado
  // 1. Crear/actualizar documento
  // 2. Crear share_link
  // 3. Devolver URL
};
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/CalendarioDetalle.tsx` | Fix selector de meses, inicializar con todos |
| `src/utils/publicUrl.ts` | Usar `window.location.origin` siempre |
| `src/pages/CalendarioEditar.tsx` | Eliminar PDF buttons, añadir "Enviar al cliente" |
| Base de datos | Insertar Lucía y Sandra en `team_members_calendar` |

---

## Orden de Implementación

1. **Datos**: Insertar responsables en la base de datos
2. **publicUrl.ts**: Fix del dominio (3 líneas)
3. **CalendarioDetalle.tsx**: Fix selector de meses (~10 líneas)
4. **CalendarioEditar.tsx**: Eliminar PDF + Añadir Enviar al cliente (~50 líneas)

---

## Resultado Esperado

- **Selector de meses**: Botón "Ninguno" deselecciona todo correctamente
- **Enlaces**: Funcionan en preview y producción
- **Editar responsables**: Muestra a Lucía y Sandra para seleccionar
- **Enviar email**: Se desbloquea al asignar responsables
- **Editar calendario**: Muestra botón "Enviar al cliente" sin opciones de PDF
