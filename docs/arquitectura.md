# Arquitectura propuesta para banca digital BP

> **Estado:** avance del MVP. Los elementos exigidos por el enunciado se separan de las recomendaciones de diseño. La región `us-east-1` es una hipótesis de cálculo, no una decisión de residencia de datos.

## 1. Requisitos del MVP y recomendaciones

| Origen | Elementos |
|---|---|
| Enunciado | SPA y aplicación móvil multiplataforma; OAuth 2.0; onboarding móvil con reconocimiento facial; Core y sistema independiente de información detallada; consulta de datos básicos y movimientos; transferencias propias e interbancarias; dos o más mecanismos de notificación; auditoría; persistencia para clientes frecuentes; API Gateway; alta disponibilidad, recuperación, seguridad y monitoreo. |
| Recomendación de diseño | AWS; React Native con Expo (a validar frente a Flutter); BFF para SPA; API HTTP; ECS Fargate; PostgreSQL Multi-AZ; DynamoDB como proyección de lectura; EventBridge/SQS; patrón outbox; servicio de auditoría y archivo protegido; DR con copias en región secundaria. |

La SPA y la app móvil son dos clientes del MVP y comparten los servicios backend. La PWA se documenta como alternativa sugerida por el profesor, no como reemplazo automático de la app móvil en el diseño base.

## 2. Diagrama de contexto

```mermaid
flowchart LR
    PERSONA[Cliente bancario]
    BP[Canales de banca digital BP<br/>SPA + app móvil]
    CORE[Core bancario<br/>datos básicos, productos y movimientos]
    DETALLE[Sistema independiente<br/>de información detallada]
    IDP[Proveedor de identidad<br/>OAuth 2.0 / OIDC]
    FACIAL[Proveedor de verificación facial<br/>onboarding móvil]
    PAGO[Red o proveedor<br/>interbancario]
    EMAIL[Proveedor de correo]
    OTRO[Segundo proveedor<br/>push o SMS]

    PERSONA -->|consulta, inicia sesión y transfiere| BP
    BP -->|autenticación y MFA| IDP
    BP -->|verificación de identidad durante onboarding| FACIAL
    BP -->|datos básicos, productos y movimientos| CORE
    BP -->|detalle ampliado del cliente| DETALLE
    BP -->|orden y estado de pago interbancario| PAGO
    BP -->|avisos de actividad| EMAIL
    BP -->|segundo canal de avisos| OTRO
```

El Core y el sistema independiente son fuentes distintas. Los proveedores de identidad, biometría, pagos y notificaciones son externos. Auditoría, colas, cache y API Gateway son internos y se detallan en las vistas siguientes.

## 3. Diagrama de contenedores AWS

```mermaid
flowchart LR
    subgraph CLIENTES[Canales del MVP]
        SPA[SPA web]
        APP[App móvil multiplataforma]
    end
    subgraph EDGE[Entrada y frontend AWS]
        CF[CloudFront]
        S3WEB[S3 para archivos estáticos]
        WAF[AWS WAF]
        API[API Gateway HTTP]
        LINK[VPC Link]
        ALB[Balanceador interno]
    end
    subgraph AWS[AWS · VPC privada en dos zonas]
        BFF[BFF web]
        CUSTOMER[Servicio de cliente]
        MOVES[Servicio de movimientos]
        TRANSFER[Servicio de transferencias]
        ONBOARD[Servicio de onboarding]
        NOTIFY[Orquestador de notificaciones]
        AUDIT[Servicio de auditoría]
        RDS[RDS PostgreSQL Multi-AZ<br/>estado de operación y outbox]
        READ[DynamoDB<br/>proyección persistida de consulta frecuente]
        BUS[EventBridge]
        QUEUES[SQS + DLQ<br/>transferencias, auditoría, notificaciones]
        AUDITDB[DynamoDB de auditoría]
        ARCHIVE[S3 Object Lock<br/>archivo de auditoría]
        OBS[CloudWatch + CloudTrail]
        KEYS[KMS + Secrets Manager]
    end
    subgraph EXT[Sistemas externos]
        IDP[IdP OAuth 2.0 / OIDC]
        CORE[Core bancario]
        DETAIL[Sistema de detalle]
        PAYMENT[Red de pagos]
        FACE[Verificación facial]
        MAIL[Correo]
        PUSH[Push o SMS]
    end

    SPA --> CF --> S3WEB
    SPA --> WAF
    APP --> WAF
    WAF --> API --> LINK --> ALB
    ALB --> BFF
    ALB --> CUSTOMER
    ALB --> MOVES
    ALB --> TRANSFER
    ALB --> ONBOARD
    BFF --> CUSTOMER
    BFF --> MOVES
    BFF --> TRANSFER
    CUSTOMER --> CORE
    CUSTOMER --> DETAIL
    CUSTOMER <--> READ
    MOVES --> CORE
    TRANSFER --> CORE
    TRANSFER --> PAYMENT
    TRANSFER --> RDS
    ONBOARD --> FACE
    ONBOARD --> IDP
    RDS --> BUS --> QUEUES
    QUEUES --> NOTIFY
    QUEUES --> AUDIT
    AUDIT --> AUDITDB --> ARCHIVE
    NOTIFY --> MAIL
    NOTIFY --> PUSH
    AWS --> OBS
    RDS --> KEYS
```

API Gateway usa VPC Link para acceder a destinos privados, como un balanceador interno o servicios registrados. El balanceador distribuye tráfico entre tareas ECS Fargate en zonas distintas. El IdP autentica a los usuarios; el Gateway y los servicios autorizan operaciones con base en tokens y permisos.

## 4. Diagrama de componentes de transferencias e integración

```mermaid
flowchart TB
    CLIENT[SPA o app móvil]
    GATEWAY[API Gateway<br/>validación JWT, cuotas y rutas]
    subgraph DOMAIN[Servicio de transferencias]
        AUTHZ[Autorización de operación<br/>titularidad y scopes]
        RULES[Reglas y límites]
        IDEMPOTENCY[Control de clave idempotente]
        ORCH[Orquestador de estados<br/>PENDING, COMPLETED, REJECTED, RECONCILIATION]
        ADAPTER[Adaptadores Core y pagos]
        REPO[Repositorio de operación]
        OUTBOX[Outbox transaccional]
    end
    DB[(PostgreSQL)]
    RELAY[Relay outbox]
    BUS[EventBridge]
    QPAY[SQS de ejecución + DLQ]
    WORKER[Worker de transferencias]
    CORE[Core bancario]
    RAIL[Red interbancaria]
    QA[SQS auditoría]
    QN[SQS notificaciones]

    CLIENT --> GATEWAY --> AUTHZ --> RULES --> IDEMPOTENCY --> ORCH
    ORCH --> ADAPTER
    ADAPTER --> CORE
    ADAPTER --> RAIL
    ORCH --> REPO --> DB
    ORCH --> OUTBOX --> DB
    DB --> RELAY --> BUS
    BUS --> QPAY --> WORKER
    WORKER --> ADAPTER
    WORKER --> REPO
    BUS --> QA
    BUS --> QN
```

La operación, la clave idempotente y el evento outbox se guardan en una transacción local. El worker ejecuta la integración y actualiza el estado. Una respuesta ambigua del proveedor deja la operación pendiente de conciliación; no se reintenta a ciegas.

## 5. Secuencia de autenticación y MFA

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant C as SPA o app móvil
    participant B as BFF web
    participant I as IdP
    participant G as API Gateway
    participant S as Servicio
    alt SPA
        U->>C: Inicia sesión
        C->>B: Solicitar login
        B-->>C: Redirigir al IdP
        C->>I: Authorization Code + PKCE S256, state y nonce
        I->>U: Primer factor y desafío MFA según política
        U->>I: Completa autenticación
        I-->>B: Código de autorización
        B->>I: Intercambiar código por tokens
        I-->>B: Tokens
        B-->>C: Cookie Secure, HttpOnly, SameSite
        C->>B: Solicitud con cookie
        B->>G: Solicitud con access token
    else App móvil
        U->>C: Inicia sesión
        C->>I: Navegador del sistema + Authorization Code con PKCE S256
        I->>U: Primer factor y desafío MFA según política
        U->>I: Completa autenticación
        I-->>C: Código por enlace de retorno registrado
        C->>I: Intercambio del código con code_verifier
        I-->>C: Tokens
        C->>G: Solicitud con access token
    end
    G->>G: Validar firma, issuer, audience, expiración y scopes
    G->>S: Enrutar solicitud autorizada
    S-->>C: Respuesta
```

Se recomienda passkey o aplicación autenticadora si el producto de identidad lo permite. El código por correo puede usarse para verificar dirección o recuperación, pero no se presenta como MFA robusto: NIST señala que el correo no debe utilizarse como autenticador fuera de banda.

## 6. Secuencia de onboarding facial

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant APP as App móvil
    participant API as API Gateway
    participant ON as Servicio onboarding
    participant BIO as Proveedor facial
    participant CORE as Core
    participant IDP as IdP
    participant AUD as Auditoría
    U->>APP: Inicia registro
    APP->>API: Solicitar proceso con idempotency key
    API->>ON: Crear proceso
    ON->>BIO: Solicitar sesión de verificación
    BIO-->>APP: Flujo seguro de captura
    U->>APP: Completa verificación
    APP->>BIO: Participa en flujo del proveedor
    BIO-->>ON: Callback firmado con resultado
    ON->>AUD: Registrar resultado
    alt Aprobado
        ON->>CORE: Crear o vincular cliente
        CORE-->>ON: Identificador de cliente
        ON->>IDP: Crear o activar identidad
        IDP-->>ON: Identidad habilitada
        ON->>AUD: Registrar activación
        ON-->>APP: Configurar autenticador y terminar alta
    else Revisión o rechazo
        ON-->>APP: Informar estado y próximos pasos
        ON->>AUD: Registrar revisión o rechazo
    end
```

Validar firma y estado del callback y usar identificadores idempotentes previene callbacks falsos y altas duplicadas. El MVP no necesita almacenar plantillas biométricas.

## 7. Secuencia de transferencia, auditoría y notificación

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant C as Cliente web o móvil
    participant API as API Gateway
    participant T as Servicio de transferencias
    participant CORE as Core
    participant DB as PostgreSQL
    participant RELAY as Relay outbox
    participant BUS as EventBridge
    participant Q as SQS ejecución
    participant W as Worker
    participant NET as Red de pagos
    participant AUD as SQS auditoría
    participant N as Servicio de notificación
    U->>C: Confirma transferencia
    C->>API: POST + Idempotency-Key
    API->>T: Solicitud autenticada
    T->>CORE: Validar cuenta, datos y límites
    CORE-->>T: Resultado
    T->>DB: Guardar PENDING + idempotencia + outbox
    DB-->>T: Commit
    T-->>C: 202 Accepted + identificador
    RELAY->>DB: Leer outbox pendiente
    RELAY->>BUS: Publicar TransferRequested
    BUS->>Q: Enrutar ejecución
    Q->>W: Entregar mensaje
    W->>NET: Ejecutar pago
    alt Confirmado
        NET-->>W: Referencia de pago
        W->>DB: Guardar COMPLETED
        W->>BUS: Publicar TransferCompleted
        BUS->>AUD: Registrar evento
        BUS->>N: Solicitar notificación
    else Rechazado
        NET-->>W: Rechazo definitivo
        W->>DB: Guardar REJECTED
        W->>BUS: Publicar TransferRejected
        BUS->>AUD: Registrar evento
        BUS->>N: Solicitar notificación
    else Sin respuesta concluyente
        W->>DB: Guardar PENDING_RECONCILIATION
        W->>BUS: Publicar solicitud de conciliación
        Note over W,NET: Consultar estado antes de cualquier reintento
    end
```

## 8. Alta disponibilidad y DR

```mermaid
flowchart LR
    USER[SPA y app móvil]
    subgraph PRIMARY[Región primaria — hipótesis us-east-1]
        WAF[AWS WAF]
        API[API Gateway]
        VPC[VPC Link]
        ALB[Balanceador privado]
        subgraph AZ1[Zona A]
            ECS1[ECS Fargate]
            DB1[RDS primario]
        end
        subgraph AZ2[Zona B]
            ECS2[ECS Fargate]
            DB2[RDS standby síncrono]
        end
        BACKUP[AWS Backup]
        QUEUE[SQS + DLQ]
    end
    subgraph SECONDARY[Región de recuperación — por definir]
        COPY[Copias de RDS y S3]
        IMAGE[Imágenes y definición IaC]
        PILOT[Entorno piloto<br/>activar y escalar en contingencia]
    end
    USER --> WAF --> API --> VPC --> ALB
    ALB --> ECS1
    ALB --> ECS2
    ECS1 --> DB1
    ECS2 --> DB1
    DB1 -->|replicación síncrona| DB2
    ECS1 --> QUEUE
    ECS2 --> QUEUE
    DB1 --> BACKUP --> COPY
    IMAGE --> PILOT
    COPY --> PILOT
```

Multi-AZ cubre una falla de zona, no una caída regional. El DR regional requiere copias o réplica en una región distinta, pruebas de restauración y un procedimiento de activación. Definir RTO/RPO es un pendiente de negocio, no una propiedad que se deba asumir.

## 9. Monitoreo y operación

| Señal | Servicios | Acción sugerida |
|---|---|---|
| Latencia p95/p99, tasa 4xx/5xx | API Gateway, BFF, servicios | Alarmas por ruta; revisar dependencias lentas |
| Tareas saludables, CPU, memoria | ECS Fargate | Reponer tarea y escalar según demanda |
| Conexiones, espacio, failover | RDS | Alarmar; reintentar reconexiones de forma segura |
| Edad y cantidad de mensajes, DLQ | SQS | Escalar consumidor o investigar eventos fallidos |
| Transferencias en estado incierto | Servicio de transferencias | Conciliar con proveedor antes de reintentar |
| Autenticaciones fallidas, cambios de cuenta | IdP, CloudTrail, WAF | Revisar eventos y conservar auditoría |

CloudWatch concentra métricas, logs y alarmas; CloudTrail registra acciones de cuenta. La autocuración aplica a tareas y procesamiento repetible; no se debe usar un reintento ciego para pagos con estado incierto.

## 10. Pendientes de validación

- Región primaria/secundaria y jurisdicción de residencia de datos.
- SLA, interfaces, límites y comportamiento de timeout del Core y proveedores.
- Política MFA compatible con el IdP existente.
- Retención, acceso, integridad y clasificación de eventos de auditoría.
- RTO/RPO, calendario de respaldos y procedimiento probado de recuperación.
- Tallas y volúmenes de AWS para terminar el cálculo de costos.
- Normativa financiera y privacidad que se incluirá tras confirmar jurisdicción.

## Fuentes técnicas

- [OAuth 2.0 Security Best Current Practice — RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)
- [OAuth 2.0 for Browser-Based Applications — RFC 10017](https://www.rfc-editor.org/rfc/rfc10017.html)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [API Gateway private integrations](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-private.html)
- [RDS Multi-AZ](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html)
- [AWS Well-Architected: plan disaster recovery](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel-13.html)
- [AWS Backup restore testing](https://docs.aws.amazon.com/aws-backup/latest/devguide/restore-testing.html)
