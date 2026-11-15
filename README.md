# Arquitectura de banca digital BP

Propuesta académica de arquitectura y MVP local para una plataforma de banca por internet. Incluye el informe final en PDF, su fuente LaTeX, diagramas C4 y modelos BPMN editables. No se han desplegado recursos AWS ni se procesan fondos reales.

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
- [Temas de ingeniería](docs/temas-de-ingenieria.md): aplicación de DevOps, seguridad, HTTP, arquitectura, cloud, datos, QA y gestión; incluye códigos de estado para depuración.
- [Validación del MVP](docs/validacion-mvp.md): resultados de las pruebas frente a los requisitos de las imágenes y brechas pendientes.
- [Auditoría técnica](docs/auditoria-tecnica-2026-11-15.md): hallazgos de API, web, móvil, OAuth/MFA, seguridad y DevOps.
- [Informe final en PDF](output/pdf/reporte.pdf): auditoría, C4, flujos BPMN, verificación y plan AWS.
- [Fuente del informe y compilación](docs/reporte/README.md): LaTeX, figuras y modelos BPMN 2.0 editables.
- [Costos AWS](docs/costos-aws.md): pendiente completar en conjunto con AWS Pricing Calculator.
- [MVP ejecutable](mvp/README.md): aplicación local con backend C# / ASP.NET Core, SPA React + TypeScript + Vite y app móvil React Native + Expo.
- [Fuentes Mermaid](docs/diagramas/): diagramas editables por separado.

GitHub renderiza los diagramas Mermaid incluidos en los archivos Markdown. Para seguir desde otra computadora, clona este repositorio y edita los `.md` o `.mmd`.

## Estado

MVP local verificado: API compilada y suite de integración aprobada; SPA y bundle Android Expo compilados. La verificación facial, MFA Cognito y notificaciones push remotas están preparados parcialmente, pero requieren proveedores y pruebas reales. Pendientes: completar costos junto con AWS Pricing Calculator, validar interfaces/SLA de sistemas externos, definir RTO/RPO y probar en dispositivos.
