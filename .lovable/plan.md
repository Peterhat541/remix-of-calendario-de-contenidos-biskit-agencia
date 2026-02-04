
# Configurar FROM_EMAIL para Biskit Agencia

## Problema Detectado
El secreto `FROM_EMAIL` tiene el valor `PLACEHOLDER_VALUE_TO_BE_REPLACED`, lo cual causa el error de validación de Resend:
```
Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.
```

## Solución
Actualizar el secreto `FROM_EMAIL` con un valor válido usando tu dominio verificado.

## Valor Propuesto
```
Biskit Agencia <noreply@biskitagencia.com>
```

## Pasos
1. Actualizar el secreto `FROM_EMAIL` con el valor correcto
2. Probar el envío de correo desde el calendario

## Resultado Esperado
Los correos se enviarán correctamente desde `noreply@biskitagencia.com` y llegarán a los clientes.

## Nota
Si prefieres otra dirección (ej: `info@biskitagencia.com`, `calendarios@biskitagencia.com`), indícamelo antes de aprobar.
