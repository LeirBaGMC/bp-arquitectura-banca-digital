# Arquitectura de banca digital BP

Propuesta académica de arquitectura y MVP local para una plataforma de banca por internet. Este repositorio contiene el código de la API, la aplicación web y la aplicación móvil. No se han desplegado recursos de AWS ni se procesan fondos reales.

## Estructura

- backend/: API ASP.NET Core sobre .NET 10 y persistencia local SQLite.
- frontend/: SPA en React, TypeScript y Vite.
- mobile/: aplicación multiplataforma en React Native con Expo.

## Requisitos

- .NET 10 SDK
- Node.js y npm

## Ejecución local

### API

Desde la raíz del repositorio, ejecuta:

    dotnet restore .\backend\api.csproj
    dotnet run --project .\backend\api.csproj --urls http://0.0.0.0:5080

### Aplicación web

En otra terminal:

    npm --prefix .\frontend ci
    npm --prefix .\frontend run dev

Abre http://127.0.0.1:5173. Vite reenvía las solicitudes /api a la API en el puerto 5080.

### Aplicación móvil

Crea el archivo local de variables y, si usas un teléfono físico, cambia la URL por la dirección LAN de tu computadora:

    Copy-Item .\mobile\.env.example .\mobile\.env
    Push-Location .\mobile
    npm ci
    npx expo start
    Pop-Location

El archivo de ejemplo usa 10.0.2.2, la dirección del equipo anfitrión desde el emulador Android. Para un dispositivo físico configura EXPO_PUBLIC_API_URL con http://<IP-LAN-de-tu-computadora>:5080.

## Alcance actual

La API usa datos de demostración y SQLite local. Las integraciones con Core bancario, proveedores interbancarios, Cognito, verificación facial, notificaciones remotas y servicios de AWS requieren configuración e implementación adicionales.