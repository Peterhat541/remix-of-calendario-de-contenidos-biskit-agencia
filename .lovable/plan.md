
# Plan: Mejoras en el Panel del Planificador de Contenidos

## ✅ IMPLEMENTADO

### 1. ✅ Selector de Meses - Botón "Ninguno" arreglado
- Checkbox visual simplificado: `checked={selectedVisibleMonths.includes(month.key)}`
- onChange simplificado: `onChange={() => toggleMonthVisibility(month.key)}`
- Añadido aviso cuando no hay meses seleccionados
- Inicialización con todos los meses por defecto

### 2. ✅ Enlace Compartido arreglado
- `publicUrl.ts` ahora usa `window.location.origin` siempre

### 3. ✅ Responsables añadidos
- Insertados Lucía y Sandra en `team_members_calendar`

### 4. ✅ Página Editar Calendario modificada
- Eliminados botones "Vista previa del PDF" y "Generar PDF"
- Añadido botón "Enviar al cliente" con modal SendEmailModal
- Genera enlace de compartir antes de abrir el modal

---

## Resultado

- **Selector de meses**: Botón "Ninguno" deselecciona todo correctamente
- **Enlaces**: Funcionan en preview y producción
- **Editar responsables**: Muestra a Lucía y Sandra para seleccionar
- **Enviar email**: Se desbloquea al asignar responsables
- **Editar calendario**: Muestra botón "Enviar al cliente" sin opciones de PDF
