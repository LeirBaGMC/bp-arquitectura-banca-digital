# Autenticación multifactor

## Diseño para la aplicación

La app móvil y la SPA inician sesión con OAuth 2.0 Authorization Code y PKCE. Ambas piden el nivel de autenticación `urn:cognito:loa:3` en Cognito. La API acepta solo access tokens que tengan ese nivel o el nivel superior `urn:cognito:loa:4`, además de validar emisor, cliente, propósito del token, usuario y el scope `bp/banking-api`. Así, un token sin evidencia del nivel exigido no autoriza operaciones.

Se admiten dos rutas de acceso: contraseña más TOTP, o passkey con verificación de usuario. En la segunda ruta, el autenticador del teléfono puede pedir huella, rostro o PIN y Cognito acepta la passkey verificada como MFA. La passkey no se agrega como segundo paso después de introducir contraseña; funciona como factor de inicio de sesión que satisface MFA. Los códigos TOTP no pasan por la app ni por la API. La biometría de KYC para el alta es un proceso separado.

## Estado actual

- El inicio de sesión en móvil y SPA usa Authorization Code + PKCE.
- La API valida JWT de Cognito y exige `bp/banking-api` y `acr` de nivel 3 o 4 cuando se deshabilita la identidad local de desarrollo.
- `infra/cognito-mfa.yaml` deja declarados el user pool, TOTP requerida, passkeys con verificación de usuario, dominio Cognito y clientes públicos separados para móvil y SPA. Cognito requiere el nivel Essentials o superior para contar una passkey verificada como MFA.
- La API falla de forma cerrada si no recibe el claim ACR. AWS está desplegando gradualmente ACR/AMR; hay que confirmar que esté disponible en la región y en el user pool antes de habilitar Cognito para la app.
- La plantilla bloquea la creación pública de usuarios. El flujo de alta debe verificar al cliente y crear/provisionar la cuenta por un proceso confiable antes de habilitar acceso.
- AWS no se ha desplegado ni conectado. El acceso local de desarrollo omite Cognito y MFA, así que no representa una sesión autenticada real.
- No hay passkeys ni verificación biométrica KYC implementadas.

## Desplegar cuando se conecte AWS

1. Elige una región, una cuenta y un prefijo de dominio Cognito globalmente disponible. Esta plantilla solicita Cognito Essentials para habilitar passkeys MFA; revisa el precio con AWS Pricing Calculator antes del despliegue.
2. Valida y revisa la plantilla en un cambio de CloudFormation. La plantilla activa protección contra eliminación para el user pool y solo permite crear usuarios administrativamente. Confirma además que ACR/AMR esté disponible en la región; la API rechaza tokens que no lleven un claim ACR suficiente.
3. Despliega `infra/cognito-mfa.yaml`. Para la SPA desplegada, pasa `SpaCallbackUrl` con su URL HTTPS exacta. El valor por defecto `http://localhost:5173/` es solo para desarrollo local.
4. Espera a que el dominio esté disponible y revisa los outputs de CloudFormation.
5. En `mvp/mobile/.env`, configura `EXPO_PUBLIC_COGNITO_DOMAIN`, `EXPO_PUBLIC_COGNITO_CLIENT_ID` (output `MobileClientId`) y `EXPO_PUBLIC_COGNITO_SCOPE=bp/banking-api`.
6. En la SPA, configura `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID` (output `SpaClientId`), `VITE_COGNITO_AUTHORITY` (output `UserPoolIssuer`), `VITE_COGNITO_REDIRECT_URI` y `VITE_COGNITO_SCOPE=bp/banking-api` antes de compilar.
7. En el entorno de la API, configura `Authentication__Authority` con `UserPoolIssuer`, `Authentication__Domain` con `HostedUiDomain`, `Authentication__RequiredScope=bp/banking-api` y una lista explícita de IDs permitidos: `Authentication__ClientIds__0=<MobileClientId>` y `Authentication__ClientIds__1=<SpaClientId>`. El backend compara `client_id` del access token con esa lista; no uses un único app client compartido entre móvil y SPA.
8. Mantén `Authentication__EnableLocalDevelopmentIdentity=false` fuera de desarrollo. Nunca incluyas secretos en la app, en `.env` versionados ni en argumentos de build.
9. Crea usuarios de prueba mediante un proceso administrativo autorizado, completa enrolamiento TOTP y realiza las pruebas de extremo a extremo antes de habilitar clientes reales.

Los app clients móviles y SPA son públicos y no tienen client secret. El uso de Authorization Code + PKCE es el control apropiado para estos clientes instalados/en navegador; un secreto embebido no sería confidencial.

## Pruebas requeridas al conectar AWS

- Primer acceso: verifica el comportamiento real de enrolamiento, verificación del correo y tokens temporales de Cognito. No uses un token inicial para habilitar operaciones sensibles antes de completar el factor requerido.
- Inicio posterior: contraseña correcta y TOTP correcto permite volver a la app; código incorrecto, desafío cancelado o usuario sin MFA no crea sesión.
- Passkey: alta después de autenticar al usuario, inicio de sesión con verificación de usuario y emisión de token; confirma que la biometría o el PIN del autenticador desbloquea la passkey y que el fallback no desactiva la MFA.
- API: token con `acr` 3/4 y scope permitido responde; token ausente, expirado, ID token usado como access token, issuer/client ID incorrectos, scope ausente o `acr` inferior/ausente reciben `401`.
- OAuth: callback exacto, verificador PKCE y `state`; probar cancelación y reutilización de códigos.
- Alta: usuarios no se pueden registrar directamente; provisionamiento y verificación de identidad se integran con el flujo de onboarding antes de abrir el acceso.
- Passkeys: el RP ID usa el dominio Cognito fijado en la plantilla. Cognito permite registrarlas tras el primer acceso; validar enrolamiento, acceso, recuperación y cambio de dispositivo en Android e iOS. El MVP no ofrece administración de passkeys desde una pantalla propia.
- Distribución: comprobar que modo local no se active en builds y que no queden endpoints/URLs de desarrollo.

## Referencias oficiales

- [AWS CloudFormation: Cognito UserPool y MFA](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cognito-userpool.html)
- [AWS CloudFormation: app client OAuth](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cognito-userpoolclient.html)
- [AWS CloudFormation: resource server y scopes](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cognito-userpoolresourceserver.html)
- [AWS: MFA en Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html)
- [AWS: Managed Login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html)
- [AWS: autenticación y passkeys](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html)
- [AWS: niveles ACR y métodos AMR](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-step-up-authentication.html)
- [Expo: autenticación y biometría](https://docs.expo.dev/develop/authentication/)
