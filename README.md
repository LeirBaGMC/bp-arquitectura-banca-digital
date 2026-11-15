# Arquitectura de banca digital BP

Propuesta académica de arquitectura y MVP local para una plataforma de banca por internet. El repositorio contiene una API, una SPA web y una aplicación móvil de demostración. No procesa fondos reales ni representa una instalación lista para producción.

## Estructura

- backend/: API ASP.NET Core sobre .NET 10 con persistencia SQLite local.
- frontend/: SPA en React, TypeScript y Vite.
- mobile/: aplicación multiplataforma React Native con Expo.
- compose.yaml y los Dockerfiles: ejecución local del API, la web y, de forma opcional, el servidor de desarrollo Expo.

## Requisitos

- Docker Desktop con Docker Compose v2.
- Para ejecutar móvil fuera de Docker: Node.js y npm.

## Ejecutar web y API con Docker

Desde la raíz del repositorio:

~~~powershell
docker compose up --build
~~~

La web estará en http://localhost:5173. Vite envía las solicitudes de /api y /health al backend dentro de la red de Docker. El backend no publica un puerto al host. La base SQLite se conserva en el volumen Docker banking_data al detener los contenedores.

Para detener los servicios:

~~~powershell
docker compose down
~~~

## Ejecutar también Expo en Docker

Para un emulador Android, el perfil mobile usa por defecto 10.0.2.2 para llegar al equipo anfitrión:

~~~powershell
docker compose --profile mobile up --build
~~~

Este perfil inicia Metro en el puerto 8081; la app del emulador se ejecuta en el equipo anfitrión. La configuración predeterminada está preparada para Android Emulator.

Para iOS Simulator, configura estas variables antes de iniciar:

~~~powershell
$env:EXPO_PUBLIC_API_URL = 'http://localhost:5173'
$env:EXPO_PACKAGER_PROXY_URL = 'http://localhost:8081'
docker compose --profile mobile up --build
~~~

Para usar un teléfono físico en la misma red, configura la IP LAN de tu computadora. Sustituye 192.168.1.20 por la IP correcta:

~~~powershell
$env:WEB_BIND_ADDRESS = '0.0.0.0'
$env:EXPO_BIND_ADDRESS = '0.0.0.0'
$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.20:5173'
$env:EXPO_PACKAGER_PROXY_URL = 'http://192.168.1.20:8081'
$env:EXPO_WEB_ORIGIN = 'http://192.168.1.20:8081'
docker compose --profile mobile up --build
~~~

Al detener el stack, el volumen conserva la base de demostración. Para eliminarla también:

~~~powershell
docker compose down --volumes
~~~

## Ejecutar la aplicación móvil sin Docker

Copia el archivo de ejemplo, establece EXPO_PUBLIC_API_URL en http://localhost:5173 para Android Emulator y activa EXPO_PUBLIC_LOCAL_AUTH=true para la demostración local:

~~~powershell
Copy-Item .\mobile\.env.example .\mobile\.env
$env:EXPO_PUBLIC_API_URL = 'http://localhost:5173'
$env:EXPO_PUBLIC_LOCAL_AUTH = 'true'
Push-Location .\mobile
npm ci
npx expo start
Pop-Location
~~~

Para un teléfono físico, usa http://<IP-LAN-de-tu-computadora>:5173 y configura WEB_BIND_ADDRESS=0.0.0.0 antes de iniciar Docker. Si pruebas Expo Web desde ese teléfono, configura también EXPO_WEB_ORIGIN con http://<IP-LAN-de-tu-computadora>:8081.

## Alcance funcional actual

La API usa datos de demostración y SQLite. Las conexiones con Core bancario, proveedores interbancarios, Cognito, verificación facial, notificaciones remotas y AWS requieren configuración e implementación adicionales.

## Seguridad y alcance

Esta composición está limitada a desarrollo local. La API corre en Development porque este MVP solo habilita SQLite y la identidad fija de demostración en ese entorno. La identidad local no solicita credenciales. No uses este modo con datos reales ni publiques los puertos en Internet.

Los puertos se enlazan a 127.0.0.1 por defecto. Para probar con un teléfono físico, el ejemplo los enlaza a la LAN; limita el acceso al dispositivo y a una red confiable, y restablece las variables al terminar.

Los contenedores API y frontend usan usuarios sin privilegios, capacidades reducidas, la raíz de archivos en solo lectura y límites de memoria/procesos. SQLite se escribe únicamente en un volumen nombrado. El build context excluye secretos locales, dependencias, artefactos y documentos. Expo requiere escritura temporal para generar el bundle y corre como usuario node, sin montar el código del host.

Para un despliegue real aún se debe reemplazar la identidad de demostración, SQLite, la configuración de desarrollo y las integraciones pendientes por los servicios administrados y la autenticación configurada para ese entorno.
