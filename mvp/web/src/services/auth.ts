type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string };

const issuer = import.meta.env.VITE_COGNITO_AUTHORITY as string | undefined;
const domain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;
const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI as string | undefined;
const requiredScope = import.meta.env.VITE_COGNITO_SCOPE || 'bp/banking-api';
const localAuth = import.meta.env.DEV && (import.meta.env.VITE_LOCAL_AUTH === 'true' || !import.meta.env.VITE_COGNITO_CLIENT_ID);
const tokenStorageKey = 'bp_access_token';
const expiryStorageKey = 'bp_access_token_expiry';
let callbackInProgress: Promise<boolean> | null = null;

export const authConfigured = Boolean(issuer && domain && clientId && redirectUri);
export const localAuthenticationEnabled = localAuth && !authConfigured;

function randomValue(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function createChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function getAccessToken() {
  const token = sessionStorage.getItem(tokenStorageKey);
  const expiresAt = Number(sessionStorage.getItem(expiryStorageKey));
  if (!token || !expiresAt || Date.now() >= expiresAt) {
    clearAccessToken();
    return null;
  }
  return token;
}

export function clearAccessToken() {
  sessionStorage.removeItem(tokenStorageKey);
  sessionStorage.removeItem(expiryStorageKey);
}

export function endSession() {
  clearAccessToken();
  if (authConfigured && domain && clientId && redirectUri) {
    const logoutUrl = new URL('/logout', domain);
    logoutUrl.search = new URLSearchParams({ client_id: clientId, logout_uri: redirectUri }).toString();
    window.location.assign(logoutUrl.toString());
    return;
  }
  window.location.reload();
}

export async function beginLogin() {
  if (!authConfigured || !domain || !clientId || !redirectUri) throw new Error('La configuración de inicio de sesión no está completa.');
  const state = randomValue();
  const verifier = randomValue(48);
  sessionStorage.setItem('bp_oauth_state', state);
  sessionStorage.setItem('bp_oauth_verifier', verifier);

  const authorizeUrl = new URL('/oauth2/authorize', domain);
  authorizeUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: `openid email ${requiredScope}`,
    acr_values: 'urn:cognito:loa:4',
    state,
    code_challenge: await createChallenge(verifier),
    code_challenge_method: 'S256',
  }).toString();
  window.location.assign(authorizeUrl.toString());
}

async function exchangeAuthorizationCode() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error_description') ?? params.get('error');
  if (error) throw new Error('No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
  const code = params.get('code');
  if (!code) return false;
  if (!domain || !clientId || !redirectUri) throw new Error('La configuración de inicio de sesión no está completa.');

  const state = params.get('state');
  const expectedState = sessionStorage.getItem('bp_oauth_state');
  const verifier = sessionStorage.getItem('bp_oauth_verifier');
  sessionStorage.removeItem('bp_oauth_state');
  sessionStorage.removeItem('bp_oauth_verifier');
  if (!state || !expectedState || state !== expectedState || !verifier) throw new Error('La respuesta de inicio de sesión no pudo validarse. Vuelve a intentarlo.');

  const response = await fetch(new URL('/oauth2/token', domain), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  const token = await response.json() as TokenResponse;
  if (!response.ok || !token.access_token) throw new Error(token.error_description ?? 'No se pudo iniciar sesión.');
  sessionStorage.setItem(tokenStorageKey, token.access_token);
  sessionStorage.setItem(expiryStorageKey, String(Date.now() + Math.max(0, (token.expires_in ?? 0) - 30) * 1000));
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  return true;
}

export function completeLogin() {
  if (!callbackInProgress) {
    callbackInProgress = exchangeAuthorizationCode().finally(() => { callbackInProgress = null; });
  }
  return callbackInProgress;
}
