# MVP de banca digital BP
Aplicacion MVP local para validar los flujos principales de banca digital. Usa ASP.NET Core, SQLite y una SPA React + TypeScript. Los datos son de prueba; no hay conexiones a AWS, Core bancario, proveedores de pago, identidad ni biometria.

La app móvil multiplataforma está en `mobile/`, usa React Native con Expo y consume las mismas rutas de la API. Consulta `mobile/README.md` para ejecutarla, definir la URL local de backend y configurar Cognito.

## Arquitectura

Es un **monolito modular organizado por capas**, inspirado en Clean Architecture para el alcance de este MVP:

```text
mvp/
├── api/
│   ├── Controllers/                 # HTTP, rutas y códigos de respuesta
│   ├── Application/                 # Casos de uso y coordinación de reglas
│   ├── Infrastructure/Persistence/  # SQLite y datos demo
│   ├── Infrastructure/Workers/      # Procesamiento asíncrono local
│   └── Program.cs                   # Composición de dependencias y middleware
└── web/
    ├── src/app/                     # Aplicación, tema y estilos
    ├── src/components/              # atoms, molecules, organisms y templates
    ├── src/pages/                   # Pantallas de la SPA
    ├── src/services/                # Cliente HTTP de la API
    ├── src/types/                   # Contratos TypeScript
    └── src/utils/                   # Formatos y utilidades
```

Los Controllers reciben las solicitudes HTTP y delegan en el servicio de aplicación. El frontend es una SPA React con TypeScript, Vite, Material UI y Atomic Design. Vite usa un proxy local durante el desarrollo y compila la SPA a `api/wwwroot` para servirla junto al backend en el modo integrado.

### Organización del frontend

```text
web/src/
  app/                    # Composición principal, tema MUI y estilos globales
  components/
    atoms/                # Controles pequeños reutilizables
    molecules/            # Grupos de controles con una función concreta
    organisms/            # Secciones completas: menú, resumen, transferencias
    templates/            # Estructura común de las pantallas
  pages/                  # Pantallas asociadas a cada sección funcional
  services/               # Comunicación HTTP con el backend
  types/                  # Contratos y modelos TypeScript
  utils/                  # Formato de dinero y fechas
```

Las páginas ensamblan organismos y el template; los organismos consumen servicios y tipos, pero las capas inferiores no dependen de las páginas. El tema MUI centraliza colores, tipografía y estilos comunes. Los estilos de componentes se expresan con `sx` para mantenerlos cerca del componente y facilitar variantes responsivas.

## Requisitos

- .NET SDK 10 LTS
- Node.js 20.19 o posterior y npm
- Docker Engine con el complemento Docker Compose

## Pruebas

Desde la raíz del repositorio, compila ambos proyectos y ejecuta la prueba de humo de la API:

```powershell
dotnet build .\mvp\api\api.csproj
npm --prefix .\mvp\web run build
.\mvp\scripts\test-api.ps1
```

La prueba usa una base SQLite temporal y la identidad local de desarrollo. No se conecta a AWS ni a proveedores bancarios.

## Ejecutar con Docker

Desde `mvp/`, crea el archivo local de configuración y construye la imagen:

```bash
cp .env.example .env
docker compose up --build
```

Abre `http://localhost:5080`. Para detener el contenedor usa `Ctrl+C`; para iniciarlo en segundo plano, agrega `-d` al comando. `docker compose down` detiene y elimina el contenedor, pero conserva la base SQLite en el volumen `banking_data`. La imagen compila React y ASP.NET Core en etapas separadas; el contenedor final sirve la SPA y la API desde el puerto 8080.

El contenedor se ejecuta como usuario no privilegiado, con sistema de archivos raíz de solo lectura, capacidades Linux eliminadas, `no-new-privileges`, límites de recursos y una ruta de datos persistente. El puerto se publica solo en `127.0.0.1`. Puedes cambiarlo en `.env` con `APP_PORT`; ese archivo está excluido de Git y Docker. No pongas claves ni contraseñas en `.env`.

Para borrar también la base de datos de demostración, ejecuta `docker compose down --volumes`. Esa acción elimina permanentemente el volumen local.

### AWS y secretos

Este MVP no consume servicios AWS ni requiere credenciales AWS. Para configuración local no sensible se puede usar `.env`. Cuando se integre AWS, en producción asigna un rol IAM al servicio (por ejemplo, el task role de ECS) y usa el proveedor estándar de credenciales del SDK. Guarda secretos reales en AWS Secrets Manager o Systems Manager Parameter Store y concédeles acceso mediante IAM; no los incluyas en `.env`, el código, Git, argumentos de build ni la imagen Docker. Para desarrollo local usa un perfil AWS o credenciales temporales fuera del repositorio.

## Abrir el backend en Visual Studio

Abre `mvp/BP_Digital_MVP.sln` con **Archivo → Abrir → Proyecto o solución**. La solución carga el proyecto `api/api.csproj` como proyecto C# para habilitar navegación de símbolos, IntelliSense y depuración.

## Desarrollo local

Abre dos terminales desde la carpeta del proyecto.

Terminal 1 — API y SQLite:

```powershell
cd mvp/api
dotnet restore
$env:Authentication__EnableLocalDevelopmentIdentity='true'
dotnet run --urls http://127.0.0.1:5080
```

Terminal 2 — React:

```powershell
cd mvp/web
npm install
npm run dev
```

Abre `http://127.0.0.1:5173`. Vite reenvía `/api` a ASP.NET Core en el puerto 5080. SQLite se crea automáticamente en `mvp/api/Data/bp-demo.db`.

## Compilar para servir integrado

```powershell
cd mvp/web
$env:VITE_LOCAL_AUTH='true'
npm run build
Remove-Item Env:VITE_LOCAL_AUTH
cd ../api
$env:Authentication__EnableLocalDevelopmentIdentity='true'
dotnet run --urls http://127.0.0.1:5080
```

Después abre `http://127.0.0.1:5080`.

## Funcionalidad

- Consulta de cliente, cuentas, movimientos y notificaciones desde SQLite local.
- Transferencias propias reservan saldo, usan idempotencia y se procesan con un worker local.
- Transferencias interbancarias quedan pendientes hasta una confirmación del proveedor.
- El worker registra los movimientos y la notificación de una transferencia propia completada.
- La auditoría se protege con el rol `Operations`; el usuario local de desarrollo no tiene ese rol.

## Rutas de la API

- `GET /api/customer`
- `GET /api/accounts`
- `GET /api/movements`
- `GET /api/transfers`
- `GET /api/notifications`
- `GET /api/audit`
- `POST /api/transfers`

En desarrollo, la API acepta una identidad local fija. En producción se exige un token JWT válido del proveedor configurado.
