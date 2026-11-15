# Temas de ingeniería aplicados al MVP

La app es un MVP bancario. Los temas de ingeniería se aplican donde mejoran sus flujos de cuenta y transferencia. No todos deben convertirse en pantallas o tecnologías instaladas: añadir componentes sin necesidad aumentaría el costo, la superficie de ataque y el trabajo operativo.

| Área | Aplicación actual | Pendiente o decisión para otra etapa |
|---|---|---|
| DevOps | Workflow de CI compila la API y genera el frontend; logs JSON, identificador de petición, endpoint `/health` y límites de solicitudes. | CD a AWS, alarmas, tableros y QA automatizado de extremo a extremo al definir cuenta, entorno y pipeline de despliegue. |
| Ciberseguridad | Validación JWT/Cognito en producción, sujeto `sub` para aislar datos, rol de operaciones para auditoría, validación de entradas, consultas SQL parametrizadas, CSP, encabezados y rate limit. | Pruebas de penetración, gestión formal de sesiones/MFA y revisión de permisos cuando se conecte el IdP real. |
| Desarrollo web | React/TypeScript consume REST; errores con Problem Details, status HTTP y referencia de petición. La app distingue una solicitud `202` de una repetición `200`. | WebSocket solo para actualizaciones en vivo que el producto requiera. CMS y WebAssembly no resuelven necesidades del flujo bancario actual. |
| Arquitectura | Controladores HTTP delegan en servicios de aplicación; persistencia y manejo HTTP están separados. Se aplican validaciones y responsabilidades claras sin imponer un framework DDD completo. | Extraer dominios o adaptadores cuando haya sistemas reales y contratos estables. |
| Microservicios | Un backend modular y un worker local procesan la cola outbox; transferencias usan clave idempotente y estados. | SQS/DLQ, reintentos con backoff, conciliación y circuit breaker alrededor de proveedores reales. Service mesh, CQRS y Event Sourcing no se justifican para el tamaño actual. |
| Cloud | Configuración de autenticación preparada para Cognito; health check y proceso apto para contenedor. | AWS no está conectado. Definir ECS, red, secretos, IAM, balanceo, observabilidad y recuperación con el cálculo de costos antes de desplegar. |
| Datos | SQLite local, comandos parametrizados, claves foráneas, transacción y outbox. | Sustituir SQLite por PostgreSQL administrado en AWS con migraciones versionadas. NoSQL/Redshift quedan para requisitos concretos de lectura o analítica. |
| Testing y QA | CI compila .NET y genera el frontend; `mvp/scripts/test-api.ps1` pasa 25 escenarios HTTP y funcionales en base temporal. | Aun faltan pruebas unitarias, auth Cognito real, aislamiento multiusuario y resiliencia de proveedores. |
| Gestión | La entrega se puede dividir en incrementos con criterios de aceptación: acceso seguro, consulta de cuentas, transferencia propia, integración interbancaria y operación en AWS. | Mantener backlog, responsable, definición de terminado, métricas y deuda técnica en el gestor del equipo. Scrum y Product Owner son prácticas de trabajo, no módulos de runtime. |

## Contrato HTTP para depuración

Los errores REST usan `application/problem+json` con `status`, `title`, `detail`, `code`, `instance` y `traceId`. El header `X-Request-Id` repite la referencia para buscar el registro JSON correspondiente. No se devuelven excepciones, SQL, tokens ni trazas al navegador.

| Código | Uso en esta API |
|---|---|
| `200 OK` | Consulta correcta o repetición reconocida por la misma clave de idempotencia. |
| `202 Accepted` | Transferencia aceptada para procesamiento; no afirma que el proveedor haya liquidado el pago. |
| `400 Bad Request` | JSON/campos inválidos, importe fuera de rango o datos de transferencia incorrectos. Incluye `errors` cuando falla la validación del modelo. |
| `401 Unauthorized` | Falta un token válido o expiró. El cliente limpia su token y pide iniciar sesión de nuevo. |
| `403 Forbidden` | Usuario autenticado sin permiso; por ejemplo, auditoría sin rol `Operations`. |
| `404 Not Found` | Recurso inexistente o ruta `/api` desconocida; nunca se devuelve el HTML de React como respuesta de API. |
| `409 Conflict` | Conflicto de persistencia o transición incompatible. |
| `429 Too Many Requests` | Se excedió el límite de cinco solicitudes de transferencia por minuto. |
| `500 Internal Server Error` | Error inesperado; el cliente ve un mensaje seguro y `traceId`, mientras el log de servidor conserva la excepción. |

`201 Created`, `204 No Content` y `503 Service Unavailable` no son respuestas normales de los endpoints actuales. Se incorporarán cuando un contrato de API los requiera; no se deben emitir solo para cubrir una lista de códigos.

## Criterio para integrar AWS

Conservar los controladores y el contrato HTTP. Implementar adaptadores de identidad, datos, cola, secretos y proveedores; configurar IAM de mínimo privilegio; mover credenciales a Secrets Manager; reemplazar almacenamiento local por PostgreSQL/RDS; publicar outbox en SQS y confirmar el estado final solo con respuesta autoritativa o conciliación del proveedor. Desplegar mediante CI/CD con pruebas, escaneo de dependencias, migraciones y plan de rollback.
