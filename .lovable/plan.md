

# Plan: Seguridad de Acceso, Gestión de Usuarios y Activación de Envío de Emails

## Estado Actual de la Base de Datos

| Tabla | Estado |
|-------|--------|
| `auth.users` | lucia@biskitagencia.com, sandra@minyn.es |
| `team_members_calendar` | lucia@biskitagencia.com, sandra@biskitagencia.com |
| `profiles` | Vacía |
| `user_roles` | Vacía |
| `content_calendar_responsibles` | Sin asignar al calendario actual |

## Acciones de Limpieza

### Eliminar usuario sandra@minyn.es
Se eliminará el usuario de prueba `sandra@minyn.es` de `auth.users`. Como no hay registros relacionados en `profiles` ni `user_roles`, no hay dependencias que limpiar.

## Parte 1: Seguridad de Acceso

### 1.1 Deshabilitar Registro Público
Modificar la página de autenticación para mostrar solo el formulario de login, eliminando la opción de registro público.

**Archivo**: `src/pages/Auth.tsx`

**Cambios**:
- Eliminar componente Tabs y la pestaña de registro
- Mantener solo el formulario de inicio de sesión
- Actualizar textos descriptivos

### 1.2 Crear Usuario Admin
Se necesita registrar a `sandra@biskitagencia.com` como administradora del sistema. Esto requiere:
1. Crear el usuario en `auth.users` mediante el sistema de autenticación
2. Asignar perfil y rol de admin

### 1.3 Configurar Roles
Una vez existan los usuarios en `auth.users`, se asignarán roles:

```sql
-- Sandra: Administradora
INSERT INTO profiles (id, workspace_id, name)
SELECT id, 'default', 'Sandra'
FROM auth.users WHERE email = 'sandra@biskitagencia.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users WHERE email = 'sandra@biskitagencia.com';

-- Lucía: Manager
INSERT INTO profiles (id, workspace_id, name)
SELECT id, 'default', 'Lucía'
FROM auth.users WHERE email = 'lucia@biskitagencia.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'manager'::app_role
FROM auth.users WHERE email = 'lucia@biskitagencia.com';
```

## Parte 2: Panel de Administración de Usuarios

### 2.1 Nueva Página de Gestión de Usuarios
**Archivo nuevo**: `src/pages/AdminUsuarios.tsx`

**Funcionalidades**:
- Lista de usuarios registrados con email, nombre, rol y último acceso
- Crear nuevo usuario (solo admins)
- Cambiar rol de usuario
- Desactivar/activar usuario

**Restricción de acceso**: Solo usuarios con rol `admin` pueden acceder

### 2.2 Actualizar Rutas
**Archivo**: `src/App.tsx`

Añadir ruta protegida:
```typescript
<Route path="/admin/usuarios" element={<AdminUsuarios />} />
```

### 2.3 Navegación al Panel Admin
Añadir enlace al panel de administración visible solo para admins en la navegación principal.

## Parte 3: Registro de Actividad (Logs)

### 3.1 Crear Tabla de Logs
**Migración SQL**:

```sql
CREATE TABLE user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_user ON user_activity_logs(user_id);
CREATE INDEX idx_activity_created ON user_activity_logs(created_at DESC);

ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON user_activity_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs" ON user_activity_logs
FOR INSERT WITH CHECK (true);
```

### 3.2 Hook de Logging
**Archivo nuevo**: `src/hooks/useActivityLog.ts`

```typescript
// Registrar eventos como:
// - login / logout
// - calendar_created / calendar_updated
// - email_sent
// - user_created / role_changed
```

## Parte 4: Desbloquear Botón "Enviar al Cliente"

### 4.1 Causa del Bloqueo
El botón está deshabilitado porque la condición requiere responsables asignados:

```typescript
const canSendEmail = !!contactEmail && responsibleEmails.length > 0;
```

El calendario actual no tiene ningún responsable en `content_calendar_responsibles`.

### 4.2 Solución
El flujo correcto es:
1. El usuario abre "Editar responsables" en el panel del calendario
2. Selecciona a Lucía y/o Sandra de la lista
3. Al guardar, se inserta en `content_calendar_responsibles`
4. El botón "Enviar email" se desbloquea automáticamente

Para desbloquear inmediatamente el calendario actual (id: `6061ac49-0646-43b8-83b9-77f305857e52`):

```sql
INSERT INTO content_calendar_responsibles (calendar_id, team_member_id)
VALUES (
  '6061ac49-0646-43b8-83b9-77f305857e52',
  (SELECT id FROM team_members_calendar WHERE email = 'sandra@biskitagencia.com')
);
```

---

## Resumen de Archivos

| Archivo | Acción |
|---------|--------|
| `src/pages/Auth.tsx` | Modificar: eliminar registro, solo login |
| `src/pages/AdminUsuarios.tsx` | Crear: panel de gestión de usuarios |
| `src/App.tsx` | Modificar: añadir ruta /admin/usuarios |
| `src/hooks/useActivityLog.ts` | Crear: hook para registrar actividad |
| Base de datos | Migración: tabla logs + eliminar sandra@minyn.es |
| Base de datos | Datos: asignar roles + responsables |

---

## Orden de Implementación

1. Eliminar usuario `sandra@minyn.es` de auth.users
2. Crear tabla `user_activity_logs` (migración)
3. Modificar `Auth.tsx` para solo login
4. Crear `AdminUsuarios.tsx` con gestión de usuarios
5. Actualizar `App.tsx` con nueva ruta
6. Asignar roles a Lucía (existente)
7. Guiar creación de cuenta para sandra@biskitagencia.com
8. Asignar responsable al calendario para desbloquear envío

---

## Nota sobre Creación de sandra@biskitagencia.com

Dado que el registro público se va a deshabilitar, hay dos opciones para crear la cuenta de Sandra:

**Opción A**: Crear la cuenta ANTES de deshabilitar el registro
- Sandra se registra manualmente en /auth
- Luego se le asigna rol admin

**Opción B**: Usar invitación desde el panel admin
- Primero se implementa el panel admin con función de invitar usuarios
- Sandra recibe email de invitación y establece su contraseña

Recomendación: Opción A es más rápida para empezar

