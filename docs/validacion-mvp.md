# Validación del MVP frente al enunciado

Esta lista separa el comportamiento comprobado en la aplicación local de los componentes que solo están diseñados para la arquitectura propuesta. Las 27 comprobaciones del script pasaron el 15 de noviembre de 2026. Los escenarios automáticos usan una base SQLite temporal y una identidad local de desarrollo; no prueban una cuenta AWS ni una conexión bancaria real.

## Ejecución

Desde la raíz del repositorio, en PowerShell:

```powershell
dotnet build .\mvp\api\api.csproj
npm --prefix .\mvp\web run build
.\mvp\scripts\test-api.ps1
```

El script levanta la API en un puerto libre, crea una base temporal, ejecuta los escenarios y detiene el servicio. No reutiliza ni modifica `mvp/api/Data/bp-demo.db`.

## Resultados funcionales del MVP

| Requisito del ejercicio | Resultado comprobado o estado actual |
|---|---|
| Consultar cliente, productos/cuentas y movimientos | API responde `200`; la SPA se compila y la ruta `/` sirve HTML. Los datos provienen de SQLite local, no del Core ni del sistema detallado. |
| Transferencias entre cuentas propias | `202` al aceptar, `200` al reintentar la misma clave, worker pasa a `COMPLETED`, actualiza ambos saldos, crea movimientos y notificación. |
| Transferencias interbancarias | Se aceptan con `202` y permanecen `PENDING`; falta conectar y verificar el proveedor antes de completar o rechazar el pago. |
| Notificaciones | Consulta `200`; la prueba valida que el worker genere una notificación para la transferencia propia completada. Los proveedores de correo/SMS/push no están conectados. |
| Auditoría y permisos | Consulta sin rol recibe `403` en formato Problem Details. El escenario no verifica el registro de auditoría con un usuario `Operations`. |
| Validación y errores HTTP | `400` para datos/montos inválidos, `403`, `404`, `429`; errores incluyen `code`, `traceId` y `X-Request-Id`. `202` y el duplicado `200` se distinguen. |
| Idempotencia | Una repetición devuelve el mismo identificador y no crea una segunda transferencia. |
| SQL injection y entrada XSS | Entradas de prueba son rechazadas con `400`; consultas usan parámetros. Esto es una comprobación básica, no un análisis de penetración. |

## Requisitos que aún no están demostrados por el MVP

| Requisito de las imágenes | Brecha para poder declararlo completo |
|---|---|
| Aplicación móvil multiplataforma | Existe un cliente React Native con Expo en `mvp/mobile/`. El typecheck, `npm audit --audit-level=high` y el bundle Android Expo exportaron correctamente en una copia temporal corta del proyecto; npm devolvió `EPERM` al reinstalar dependencias dentro de la ruta larga original. Faltan pruebas E2E, build nativo e instalación en dispositivos iOS/Android con Cognito real. |
| OAuth 2.0/OIDC real | Hay validación JWT preparada para Cognito y autenticación local de desarrollo. Falta configurar el IdP y probar `401`, PKCE, MFA, permisos y aislamiento entre clientes con tokens reales. |
| Datos de Core y sistema independiente | Las pantallas consultan datos locales sembrados en SQLite. Faltan contratos, adaptadores y pruebas contra ambas fuentes. |
| Reconocimiento facial de onboarding | La app tiene pantalla desde Ajustes, consentimiento y endpoint autenticado. El endpoint devuelve `503` con código claro; faltan el SDK nativo de liveness, cotejo documental, proveedor y revisión humana. La verificación real sigue deshabilitada. |
| Notificaciones del celular | La app permite pedir permiso y genera un aviso local de prueba. Push remoto, tokens FCM/APNs, SNS y segundo canal real siguen sin conectar. |
| AWS, API Gateway, HA, DR, auto-healing y monitoreo | La API corre localmente. Faltan infraestructura desplegada, alarmas, pruebas de recuperación y validación de latencia/costos. |
| Pruebas unitarias y de integración de producción | El script es una prueba de integración local de API. Faltan suite unitaria, tokens reales, aislamiento multiusuario, conciliación, pruebas móviles/web automatizadas y pruebas de resiliencia de proveedores. |
| Diagramas C4 y PDF de entrega | Se validan como entregables documentales por separado; la prueba del MVP no valida su profundidad, justificaciones ni costos. |

No conviene marcar las brechas como aprobadas solo porque exista el diagrama o el código de preparación. Para cerrar cada una se necesita una integración verificable y pruebas sobre el entorno correspondiente.
