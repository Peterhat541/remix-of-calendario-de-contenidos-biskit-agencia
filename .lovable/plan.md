

# Configuración de RESEND_API_KEY

## Situación Actual
- El secreto `RESEND_API_KEY` existe en el proyecto pero no tiene un valor válido configurado
- Esto causa el error "Missing API key" cuando la función intenta enviar correos

## Pasos a Ejecutar

### 1. Solicitar el API Key
Te mostraré un campo seguro donde podrás pegar tu API key de Resend (formato: `re_xxxxxxxx...`)

### 2. Verificar el Envío
Una vez configurado, probaremos enviando un correo desde el calendario para confirmar que funciona

## Información Técnica
- **Función afectada**: `supabase/functions/send-calendar-email/index.ts`
- **Variable de entorno**: `RESEND_API_KEY`
- **Remitente configurado**: Usa la variable `FROM_EMAIL` o el valor por defecto `Like a Rocket <onboarding@resend.dev>`

## Nota sobre el Dominio
- Si usas `onboarding@resend.dev` como remitente (sandbox de Resend), solo podrás enviar correos a direcciones verificadas en tu cuenta de Resend
- Para enviar a cualquier dirección, necesitarás verificar tu propio dominio en Resend y actualizar la variable `FROM_EMAIL`

