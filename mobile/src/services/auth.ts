const tokenKey = 'bp_access_token';
const expiryKey = 'bp_access_token_expiry';
export const localAuthenticationEnabled = __DEV__ && process.env.EXPO_PUBLIC_LOCAL_AUTH === 'true';

export async function readAccessToken() {
  if (localAuthenticationEnabled) return null;
  const SecureStore = await import('expo-secure-store');
  const [token, expiry] = await Promise.all([SecureStore.getItemAsync(tokenKey), SecureStore.getItemAsync(expiryKey)]);
  if (!token || !expiry || Date.now() >= Number(expiry)) {
    await removeAccessToken();
    return null;
  }
  return token;
}

export async function saveAccessToken(token: string, expiresIn: number) {
  if (localAuthenticationEnabled) return;
  const SecureStore = await import('expo-secure-store');
  const options = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
  await Promise.all([
    SecureStore.setItemAsync(tokenKey, token, options),
    SecureStore.setItemAsync(expiryKey, String(Date.now() + Math.max(0, expiresIn - 30) * 1000), options),
  ]);
}

export async function removeAccessToken() {
  if (localAuthenticationEnabled) return;
  const SecureStore = await import('expo-secure-store');
  await Promise.all([SecureStore.deleteItemAsync(tokenKey), SecureStore.deleteItemAsync(expiryKey)]);
}
