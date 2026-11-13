# Arquitectura de banca digital BP

Propuesta académica de arquitectura para una plataforma de banca por internet. Este repositorio contiene el avance de diseño y diagramas Mermaid editables; todavía no es el PDF final.

## Alcance del MVP

- Dos clientes: SPA web y aplicación móvil multiplataforma.
- Consulta de información del cliente desde Core y desde el sistema independiente de detalle.
- Consulta de movimientos, transferencias propias e interbancarias.
- Autenticación con OAuth 2.0 / OpenID Connect y MFA.
- Onboarding móvil con verificación facial.
- Auditoría de acciones y notificaciones mediante al menos dos canales.
- Despliegue propuesto en AWS, con alta disponibilidad, monitoreo y recuperación.

## Archivos

- [Diseño y diagramas](docs/arquitectura.md): contexto, contenedores, componentes, secuencias y continuidad.
- [Decisiones arquitectónicas](docs/decisiones.md): alternativas y justificaciones.
- [Costos AWS](docs/costos-aws.md): pendiente completar en AWS Pricing Calculator.
- [Fuentes Mermaid](docs/diagramas/): diagramas editables por separado.

GitHub renderiza los diagramas Mermaid incluidos en los archivos Markdown. Para seguir desde otra computadora, clona este repositorio y edita los `.md` o `.mmd`.

## Estado

Avance inicial de arquitectura. Pendientes: estimación de costos con AWS Pricing Calculator, normativa aplicable según jurisdicción de BP, validar interfaces y SLA de sistemas externos, terminar el modelo C4, revisar los diagramas y generar/verificar el PDF final.
