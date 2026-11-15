# BP Digital Mobile

Aplicación móvil multiplataforma con Expo, React Native y Expo Router. Comparte los endpoints de la API .NET con la SPA web.

## Desarrollo

1. Copia `.env.example` a `.env` y configura `EXPO_PUBLIC_API_URL`.
2. En el emulador Android, usa `http://10.0.2.2:5080`; en un teléfono, usa la IP local del equipo. La API debe escuchar en `0.0.0.0:5080`.
3. Ejecuta `npm install` y luego `npm run start`.
4. Usa `a` para Android o escanea el QR con un development build de Expo.

### Ejecutar en un teléfono Android con Expo Go

En este equipo, la conexión del teléfono funcionó iniciando API y Metro desde terminales **PowerShell de VS Code en Windows**. WSL2 tuvo problemas para exponer los puertos a la red local. La IP Wi-Fi puede cambiar; revisa `ipconfig` y actualiza `EXPO_PUBLIC_API_URL` en `.env` antes de iniciar Metro.

Terminal 1, API:

```powershell
cd .\mvp\api
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Authentication__EnableLocalDevelopmentIdentity = 'true'
dotnet run --urls http://0.0.0.0:5080
```

Terminal 2, app móvil:

```powershell
cd .\mvp\mobile
# Ejecutar npm ci solo en la instalación inicial o si cambió package-lock.json.
npm ci
npx expo start --lan --clear --port 8081
```

Escanea el QR que empieza con `exp://<IP-del-equipo>:8081` y confirma que Metro indique **Using Expo Go**. Si cambia a `dev-client`, presiona `s` para volver a Expo Go. La laptop y el teléfono deben estar en la misma Wi-Fi. Mantén ambas terminales abiertas; `Ctrl+C` detiene el servicio de esa terminal.

Configura `EXPO_PUBLIC_API_URL=http://<IP-del-equipo>:5080` en `mvp/mobile/.env`. Comprueba desde el navegador del teléfono que `http://<IP-del-equipo>:5080/health` responda `Healthy`. Para verificar Metro, `http://<IP-del-equipo>:8081/status` debe responder `packager-status:running`.

Si Windows Firewall bloquea el teléfono, ejecuta una vez en PowerShell como administrador, limitando el acceso a la subred local:

```powershell
New-NetFirewallRule -DisplayName 'BP API 5080' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5080 -RemoteAddress LocalSubnet -Profile Any
New-NetFirewallRule -DisplayName 'BP Expo Metro 8081' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081 -RemoteAddress LocalSubnet -Profile Any
```

No crees un `portproxy` que apunte a la misma IP Wi-Fi del equipo: en la configuración observada, WSL devolvía esa misma IP y el reenvío generaba un bucle. `localhost:8081` comprueba el preview web en la laptop, pero no confirma que el teléfono alcance Metro.

Para iniciar sesión localmente, establece `EXPO_PUBLIC_LOCAL_AUTH=true` solo en desarrollo y habilita `Authentication:EnableLocalDevelopmentIdentity` en el backend Development. El botón local se compila únicamente cuando `__DEV__` es verdadero.

## Cognito

Consulta [MFA y passkeys con Cognito](../../docs/mfa-cognito.md) para la configuración, la plantilla CloudFormation y las pruebas pendientes. `infra/cognito-mfa.yaml` define el scope `bp/banking-api`; la plantilla todavía no se ha desplegado.

Define `EXPO_PUBLIC_COGNITO_DOMAIN`, `EXPO_PUBLIC_COGNITO_CLIENT_ID` y `EXPO_PUBLIC_COGNITO_SCOPE`. Registra `bpdigital://oauth2redirect` como callback del app client y habilita Authorization Code Grant, PKCE (S256), `openid`, `email` y el scope de la API. La app guarda el access token y su expiración con `expo-secure-store`; no se incluye client secret en el móvil.

La API debe validar el access token y los claims configurados. No uses el modo local en builds de distribución.

## Operaciones

Las transferencias interbancarias quedan pendientes hasta recibir confirmación de un proveedor real. El flujo móvil no simula la liquidación. La validación de identidad de alta digital requiere la integración futura con un proveedor KYC; la biometría local del teléfono no constituye verificación de identidad bancaria.

## Notificaciones móviles

La pantalla permite comprobar permisos y mostrar una notificación local del sistema. Eso no registra el dispositivo ni envía avisos remotos. En Android, Expo Go no admite notificaciones push remotas desde Expo SDK 53; para validarlas se necesita un development build con FCM/APNs configurado. La app no debe contener credenciales de AWS: la API debe recibir el token nativo autenticado, registrarlo con Amazon SNS y conservar la asociación con el usuario. También faltan baja del dispositivo al cerrar sesión, renovación del token y manejo de endpoints inválidos.

## Alta facial

El formulario recoge consentimiento y llama a la API, que responde `503` hasta configurar un proveedor; no captura ni transmite imágenes. Amazon Rekognition Face Liveness requiere que el backend cree la sesión y consulte el resultado, y que el cliente integre su detector nativo para transmitir el video. La integración oficial de Amplify ofrece detectores para React web, Swift e iOS y Android nativo; no existe un detector React Native oficial. Para mantener Expo se necesita seleccionar y auditar un módulo nativo compatible, cambiar de Expo Go a development build, y probar permisos de cámara, región AWS, umbrales, tratamiento/retención de imágenes y una alternativa accesible. No se debe entregar credencial AWS de larga duración al móvil.

Referencias: [Expo Notifications SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/), [AWS SNS para endpoints móviles](https://docs.aws.amazon.com/sns/latest/dg/mobile-platform-endpoint.html), [Amazon Rekognition Face Liveness](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html), [API de Face Liveness](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness-programming-api.html).
