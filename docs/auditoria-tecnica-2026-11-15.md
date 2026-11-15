# Auditoría técnica del proyecto

**Fecha:** 15 de noviembre de 2026  
**Alcance:** documentación, API ASP.NET Core, SPA React, app Expo, autenticación/MFA, persistencia, transferencias, Docker, CI y plantilla Cognito.

## Resumen

El proyecto funciona como MVP local y mantiene una separación razonable entre controladores, servicios de aplicación e infraestructura. No está listo para producción ni para mover dinero real. Durante esta revisión se migró el backend de .NET 8 fuera de soporte a .NET 10 LTS y se compiló. La plantilla Cognito usa Managed Login versión 2 para permitir passkeys; falta validar CloudFormation y el flujo en una cuenta de pruebas. También faltan el aprovisionamiento que relacione Cognito `sub` con clientes/cuentas y el ciclo de liquidación/liberación de transferencias interbancarias.

## Hallazgos priorizados

### Cerrado en esta revisión - Runtime .NET fuera de soporte

`mvp/api/api.csproj`, el Dockerfile, CI y el script de integración ahora apuntan a `net10.0`/ .NET 10. Se actualizaron los paquetes directos a `10.0.12`. `dotnet restore`, `dotnet build` y la suite API local terminaron correctamente. Esta migración no equivale a certificar el contenedor: falta construir y escanear la imagen antes del despliegue.

### P1 — Validar MFA Cognito antes de habilitar usuarios

La plantilla tenía `ManagedLoginVersion: 1`. AWS documenta que la passkey no está disponible en el Hosted UI clásico; el flujo OAuth actual de web y móvil usa esos endpoints. Corregí la plantilla a `ManagedLoginVersion: 2`. Aún falta validar la plantilla y el flujo real de passkey, TOTP, recuperación y callbacks en una cuenta de pruebas. Para passkeys nativas, verificar también el vínculo de la app móvil con el RP ID.

### P1 — Identidad de Cognito sin aprovisionamiento de cliente y cuentas

La API toma `sub` del token como `customerId`, mientras que SQLite solo siembra `CUS-1001`. No existe todavía un proceso confiable que cree o asocie cliente y productos con el `sub` verificado. Al habilitar Cognito, una identidad válida no tendrá datos y las consultas devolverán recursos vacíos/404. Definir y construir el aprovisionamiento desde Core/onboarding; no sustituirlo por un identificador enviado por el cliente.

### P1 — Transferencia interbancaria reserva fondos sin completar el ciclo

La API resta el saldo al registrar la solicitud y la guarda como `PENDING`. El worker local procesa únicamente transferencias propias; las interbancarias quedan pendientes sin vencimiento, conciliación ni compensación que devuelva el saldo ante rechazo. Esto está documentado y no mueve dinero real en el MVP, pero bloquea cualquier uso financiero real. Con proveedor, implementar estados finales, confirmación firmada, conciliación y liberación idempotente de la reserva.

### P1 — Pruebas de autenticación y autorización insuficientes

La validación de JWT exige `token_use=access`, `sub`, clientes permitidos, scope y ACR 3/4; la auditoría está protegida con rol `Operations`. Sin embargo, la suite corre con identidad local fija y no prueba tokens Cognito: rechazo de ID token, issuer/cliente incorrectos, scope ausente, ACR inferior/ausente, expiración, aislamiento entre dos clientes ni acceso autorizado al endpoint de auditoría. Añadir pruebas unitarias/de integración con JWT firmados de prueba y pruebas E2E Cognito al conectar AWS. No relajar el requisito ACR para hacer pasar la configuración.

### P2 — Worker y rate limit son locales y no distribuidos

El worker consulta SQLite en memoria de proceso cada segundo; no tiene reclamación/lease, política durable de reintentos ni DLQ. El limitador de transferencias también es por proceso. Son decisiones aceptables para el MVP local, no para varias réplicas. En AWS, usar cola duradera, idempotencia del consumidor, reintentos con backoff, DLQ y limitación compartida/en el edge.

### P2 - Sesión móvil sin renovación

La app guarda access token y expiración en SecureStore, pero no guarda/usa refresh token ni implementa renovación. En esta revisión el arranque captura errores de SecureStore y el cliente elimina el access token al recibir `401`; la renovación, el cierre de sesión del proveedor y la redirección global siguen pendientes. Mantener PKCE y no almacenar secretos de cliente en la app.

### P1 - Alta facial móvil bloqueada por proveedor nativo

Se incorporó una pantalla de alta desde Ajustes y un contrato de API que exige consentimiento y limita el cuerpo. El endpoint responde `503 FACE_VERIFICATION_NOT_CONFIGURED` hasta integrar el proveedor. No captura ni guarda rostro. Rekognition Face Liveness comprueba presencia; no identifica a la persona. Para verificar identidad se requiere además comparar contra una fuente documental confiable y disponer de revisión alternativa/manual. AWS documenta SDKs de React, iOS y Android, pero no un detector oficial para React Native. Para Expo se debe seleccionar una integración nativa mantenida y auditarla, crear development builds y probar dispositivos; Expo Go no basta. El desarrollo actual cubre consentimiento, UX y contrato, no la liveness real.

### P2 - Notificaciones remotas pendientes

La app consulta el buzón de avisos de la API y ahora permite solicitar permiso del sistema y mostrar un aviso local de comprobación con `expo-notifications`. Esto prueba el permiso/UI del dispositivo, no la entrega remota. Falta registrar tokens FCM/APNs de forma autenticada, asociarlos al cliente en backend y publicarlos con un proveedor cloud (por ejemplo SNS); los secretos de AWS deben quedar en roles del servidor. Las pruebas remotas requieren development build y credenciales de plataforma.

### P2 — Auditoría actual no cumple persistencia/inmutabilidad de producción

El MVP registra eventos de transferencia y una sesión inicial en SQLite local. El registro se puede modificar junto con esa base y no incluye todavía eventos de autenticación, privilegios, administración ni entrega a un repositorio separado e inmutable. El rol `Operations` protege la consulta, pero la prueba solo verifica el `403` sin rol. Para producción, definir eventos mínimos, retención, acceso separado, protección de integridad, exportación y pruebas autorizadas.

### P2 — CI no valida el cliente móvil ni controles de cadena de suministro

El workflow compila API y web y ejecuta el script de integración API. No compila/typecheckea móvil, no corre pruebas unitarias, análisis de dependencias, escaneo de secretos, SAST, análisis de imagen o validación de CloudFormation. Añadir estos pasos por etapas, empezando por typecheck/build móvil, `dotnet test` cuando haya suite y escaneos de dependencias/IaC.

### P2 — Plantilla Cognito e infraestructura no han sido validadas por herramientas AWS

No se pudo ejecutar `cfn-lint` ni `aws cloudformation validate-template` en este entorno. La plantilla se revisó estáticamente; eso no confirma que el servicio acepte la combinación exacta de propiedades en la región objetivo. Validarla con herramientas/CloudFormation en una cuenta de pruebas, después de revisar costo, dominio, región, RP ID y callbacks. No desplegarla desde esta auditoría.

### P3 — Documentación y repositorio tenían inconsistencias/archivos locales

`docs/validacion-mvp.md` decía que no había cliente móvil funcional, aunque ya existe `mvp/mobile/`; corregí esa fila para reflejar el código y el typecheck, sin afirmar que haya pruebas E2E. No había `.gitignore` en la raíz; añadí uno para ocultar `.vs`, bases locales, dependencias, artefactos y `.env` sin ignorar `.env.example`. Los `.env` existentes no aparecen como archivos versionados según `git ls-files`.

## Controles que sí funcionan en el MVP

- Consultas SQL parametrizadas; no encontré concatenación de valores del usuario en SQL.
- Validación de monto, precisión, cuentas, beneficiario, banco, descripción y clave idempotente en cliente y servidor.
- Autorización de datos por el `sub` del principal; la consulta de auditoría requiere rol.
- Evita duplicar la operación en un reintento secuencial con la misma clave; el script verifica respuesta `200` y el mismo ID.
- React representa texto mediante renderizado normal; no encontré uso de `dangerouslySetInnerHTML`/`innerHTML` en el código revisado. Los payloads tipo XSS del API reciben `400`.
- Errores HTTP estructurados con Problem Details, código y correlación; headers defensivos en API.
- Docker local: usuario no root, raíz de solo lectura, capacidades retiradas, `no-new-privileges`, límites de recursos y puerto publicado en loopback. Compose habilita identidad local y Development deliberadamente; es solo para uso local.

No se identificó una inyección SQL reproducible en el código revisado. Las comprobaciones de SQLi/XSS son casos básicos; no equivalen a pentest ni a análisis estático completo.

## Verificaciones ejecutadas

| Verificación | Resultado |
|---|---|
| `dotnet restore` + `dotnet build mvp/api/api.csproj --no-restore` | Correcto, 0 advertencias y 0 errores |
| `mvp/scripts/test-api.ps1` | 25 comprobaciones aprobadas |
| `dotnet restore` + `dotnet build mvp/api/api.csproj --no-restore` (.NET 10) | Correcto, 0 advertencias y 0 errores |
| `mvp/scripts/test-api.ps1` | 27 comprobaciones aprobadas, incluyendo consentimiento/503 de alta facial |
| `npm run build` en `mvp/web` | Correcto tras el ajuste de autenticación local |
| `npm audit --audit-level=high` en web | 0 vulnerabilidades reportadas al 15 de noviembre de 2026 |
| Typecheck y export Android de móvil | Correctos en una copia temporal corta usando el lockfile actual; bundle Android Expo generado. Reinstalar en la ruta original del repo devuelve `EPERM` en Windows |
| `npm audit --audit-level=high` en móvil | 0 vulnerabilidades reportadas en la copia temporal |
| `dotnet list package --vulnerable --include-transitive --no-restore` | Ningún paquete vulnerable reportado por NuGet |
| Validación CloudFormation con AWS | No ejecutada: no hay AWS CLI/cfn-lint disponible |

Las 27 comprobaciones API cubren health, SPA, lecturas, 403/404/400/429/503, validación de entradas, transferencias propias, repetición idempotente, worker, saldos, movimientos, notificación, consentimiento de alta facial y transferencia interbancaria que permanece pendiente. No cubren Cognito real ni concurrencia.

## Orden recomendado de trabajo

1. Ejecutar typecheck y export nativo Expo en CI; luego probar la app con Cognito en un development build iOS/Android.
2. Validar la plantilla Cognito y probar passkey/TOTP/ACR, recuperación, issuer, callbacks y autorización con tokens reales.
3. Integrar proveedor facial nativo con consentimiento, prueba de liveness, cotejo documental, alternativa accesible, retención mínima y revisión humana.
4. Configurar registro de tokens de notificaciones y proveedor remoto; probar permiso, entrega, baja del dispositivo y reintentos.
5. Definir aprovisionamiento de Cognito `sub`, ciclo interbancario, conciliación y compensación antes de conectar fondos reales.
6. Completar renovación/logout, aislamiento multiusuario y pruebas de concurrencia.
7. Completar la estimación en AWS Pricing Calculator en conjunto; no desplegar hasta revisar los valores y validar IaC.

## Fuentes oficiales

- [Política oficial de soporte .NET](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)
- [Amazon Cognito: Managed Login y Hosted UI clásico](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html)
- [Amazon Cognito: passkeys y flujos de autenticación](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html)
- [Amazon Cognito: MFA en user pools](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html)
- [Amazon Cognito: claims ACR/AMR](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-step-up-authentication.html)
