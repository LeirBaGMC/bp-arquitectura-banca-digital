# Arquitectura de banca digital BP

Propuesta académica de arquitectura y MVP local para una plataforma de banca por internet. El repositorio contiene el código ejecutable y el PDF de entrega. No se han desplegado recursos AWS ni se procesan fondos reales.

## Estructura del repositorio

| Ruta | Contenido |
|---|---|
| `mvp/api/` | API ASP.NET Core .NET 10 y persistencia local SQLite. |
| `mvp/web/` | SPA React, TypeScript y Vite. |
| `mvp/mobile/` | Aplicación multiplataforma React Native con Expo. |
| `infra/cognito-mfa.yaml` | Plantilla CloudFormation para configurar Cognito; aún no desplegada. |
| `output/pdf/reporte.pdf` | Informe de entrega con arquitectura C4, flujos BPMN, seguridad, costos y brechas. |
| `.github/workflows/ci.yml` | Compilación y verificaciones automáticas para API, web y móvil. |

## Alcance y estado

- La API y la SPA usan datos locales; Core bancario y sistema de detalle no están conectados.
- Las transferencias propias tienen procesamiento local e idempotencia. Las interbancarias quedan pendientes de un proveedor real.
- La autenticación local sirve para desarrollo. Cognito, MFA y aislamiento multiusuario requieren configuración y pruebas reales.
- El onboarding tiene consentimiento y contrato de API; no está conectado el SDK de verificación facial.
- Las notificaciones locales funcionan como demostración; push remoto y segundo canal están pendientes.
- AWS, alta disponibilidad, recuperación ante desastres y monitoreo están documentados como arquitectura objetivo, no desplegados.
- El costo AWS es provisional y debe validarse con AWS Pricing Calculator.

## Compilación y pruebas

Desde la raíz del repositorio, ejecuta:

```powershell
dotnet restore .\mvp\api\api.csproj
dotnet build .\mvp\api\api.csproj --no-restore
npm --prefix .\mvp\web ci
npm --prefix .\mvp\web run build
Push-Location .\mvp\mobile
npm ci
npm run typecheck
npx expo export --platform android
Pop-Location
pwsh -File .\mvp\scripts\test-api.ps1
```

La prueba funcional de la API utiliza una base SQLite temporal y una identidad local de desarrollo. Las pruebas locales no sustituyen la validación con Cognito, proveedores bancarios, dispositivos físicos ni recursos AWS.

Consulta [la guía del MVP](mvp/README.md) para el desarrollo local y las rutas disponibles.
