# Decisiones arquitectónicas y justificaciones

Este registro separa decisiones propuestas de requisitos del ejercicio. Las decisiones quedan sujetas a la validación de interfaces, SLA, jurisdicción y objetivos del negocio.

## D-01 — Dos clientes del MVP

**Decisión propuesta:** entregar una SPA web y una app móvil multiplataforma que comparten APIs y lógica de dominio.

**Justificación:**

1. Cumple la separación de canales expresada en el ejercicio.
2. Mantener reglas bancarias en backend reduce diferencias de autorización entre web y móvil.

**Alternativas:** reemplazar el cliente móvil por una PWA reduce esfuerzo inicial, según la sugerencia del profesor, pero se mantiene como alternativa y no como base del MVP.

## D-02 — React Native con Expo como propuesta móvil

**Decisión propuesta:** React Native con Expo, asumiendo una SPA basada en React y TypeScript. Expo Go será entorno de aprendizaje/prototipo; producción utilizará development builds propios.

**Justificación:**

1. Permite reutilizar conocimientos, tipos y contratos de API del stack React; no implica reutilizar automáticamente las vistas.
2. Expo permite integrar bibliotecas nativas mediante development builds, necesarios cuando una dependencia no está incluida en Expo Go.

**Alternativa evaluada:** Flutter construye aplicaciones multiplataforma desde una base de código y dispone de su propio framework de interfaz, pero introduce Dart como segundo stack si la SPA usa React/TypeScript.

**Referencias:** [Expo development builds FAQ](https://docs.expo.dev/develop/development-builds/faq/), [Flutter docs](https://docs.flutter.dev/).

## D-03 — BFF para la SPA

**Decisión propuesta:** la SPA inicia sesión a través de un BFF, que mantiene los tokens en servidor y entrega al navegador una cookie de sesión segura.

**Justificación:**

1. Reduce la exposición directa de tokens OAuth al código JavaScript del navegador.
2. Permite centralizar sesión web y controles CSRF.

**Costo/alternativa:** agrega un servicio, operación de sesión y protección CSRF. Una SPA como cliente público puede usar Authorization Code + PKCE directamente; esa alternativa requiere especial atención a almacenamiento y exposición de tokens.

## D-04 — Authorization Code + PKCE

**Decisión propuesta:** OAuth 2.0 Authorization Code con PKCE S256; usar OpenID Connect para identidad. Para móvil, abrir el navegador del sistema y usar el enlace de retorno registrado.

**Justificación:**

1. Protege el intercambio del código en clientes públicos y evita el flujo de credenciales directas.
2. Usa OIDC para identidad autenticada y OAuth scopes/claims para autorización de API.

**Referencia:** [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), [RFC 10017](https://www.rfc-editor.org/rfc/rfc10017.html).

## D-05 — MFA y códigos por correo

**Decisión propuesta:** configurar el IdP para un factor fuerte (passkey o autenticador, si está disponible); reservar correo para verificar dirección y recuperar cuenta.

**Justificación:**

1. El correo puede depender de una contraseña y no constituye un canal independiente robusto.
2. Centralizar MFA en el IdP permite aplicar política común a SPA y móvil.

**Nota:** el profesor sugirió código por email. Se reconoce como opción didáctica, pero se documenta la limitación: [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) dice que email no debe utilizarse como autenticación fuera de banda.

## D-06 — Servicios de dominio y adaptadores

**Decisión propuesta:** separar cliente, movimientos, transferencias y onboarding por dominio, con adaptadores para Core, detalle, pagos, identidad y biometría.

**Justificación:**

1. Cada dominio conserva sus validaciones y permisos sin acoplarse al formato de los proveedores externos.
2. Los adaptadores permiten sustituir integraciones sin cambiar la lógica de los clientes.

**Alternativa:** una aplicación monolítica tendría menor costo inicial, pero aumentaría el acoplamiento; microservicios demasiado pequeños elevan despliegues y monitoreo. El MVP mantiene pocos servicios por dominio, no un servicio por módulo.

## D-07 — Outbox, colas y estado de transferencia

**Decisión propuesta:** guardar el cambio de estado, clave idempotente y evento outbox en una transacción local; publicar eventos y procesar transferencias de forma asíncrona con colas, DLQ y conciliación.

**Justificación:**

1. Desacopla transferencia, auditoría y notificaciones de fallas temporales de otros sistemas.
2. Idempotencia y estados explícitos evitan duplicar operaciones ante reintentos y timeouts ambiguos.

**Alternativa:** llamadas síncronas y coordinadas son más simples al principio, pero hacen que la disponibilidad del canal dependa de todos los proveedores y complican los resultados inciertos de pagos externos.

## D-08 — Proyección persistida de clientes frecuentes

**Decisión propuesta:** una vista de lectura en DynamoDB para datos consultados con frecuencia, sin convertirla en fuente maestra.

**Justificación:**

1. Reduce llamadas repetidas al Core y al sistema de detalle.
2. Permite separar consultas de la escritura transaccional y escalar lectura por patrón de acceso.

**Control:** guardar versión y fecha de actualización; refrescar/invalidate según evento o lectura fuente. No almacenar datos sensibles que no sean necesarios.

## D-09 — AWS y alta disponibilidad

**Decisión propuesta:** servicios en ECS Fargate desplegados en dos zonas, API Gateway con VPC Link y balanceador privado, RDS PostgreSQL Multi-AZ, SQS/DLQ, CloudWatch y CloudTrail.

**Justificación:**

1. Servicios administrados reducen tareas operativas de servidores y componentes de mensajería.
2. Distribuir cómputo y base de datos entre zonas reduce puntos únicos de falla dentro de una región.

**Alternativas:** Lambda y un modelo más serverless, o Kubernetes administrado, también son posibles; se prefieren contenedores ECS para mantener control claro del runtime y evitar operar un clúster Kubernetes para este MVP.

**Nota:** una región secundaria es necesaria para afrontar una caída regional; los objetivos RTO/RPO y su costo están pendientes.
