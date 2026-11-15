import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { localAuthenticationEnabled, removeAccessToken, readAccessToken, saveAccessToken } from '@/services/auth';

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  localMode: boolean;
  activateLocalMode: () => void;
  completeCognitoLogin: (token: string, expiresIn: number) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    if (localAuthenticationEnabled) {
      setReady(true);
      return;
    }
    readAccessToken()
      .then((token) => setAuthenticated(Boolean(token)))
      .catch(() => setAuthenticated(false))
      .finally(() => setReady(true));
  }, []);

  const activateLocalMode = useCallback(() => {
    if (localAuthenticationEnabled) {
      setLocalMode(true);
      setAuthenticated(true);
    }
  }, []);
  const completeCognitoLogin = useCallback(async (token: string, expiresIn: number) => {
    await saveAccessToken(token, expiresIn);
    setLocalMode(false);
    setAuthenticated(true);
  }, []);
  const signOut = useCallback(async () => {
    await removeAccessToken();
    setLocalMode(false);
    setAuthenticated(false);
  }, []);

  const value = useMemo(() => ({ ready, authenticated, localMode, activateLocalMode, completeCognitoLogin, signOut }), [ready, authenticated, localMode, activateLocalMode, completeCognitoLogin, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}
