interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_COGNITO_AUTHORITY?: string;
  readonly VITE_COGNITO_DOMAIN?: string;
  readonly VITE_COGNITO_CLIENT_ID?: string;
  readonly VITE_COGNITO_REDIRECT_URI?: string;
  readonly VITE_COGNITO_SCOPE?: string;
  readonly VITE_LOCAL_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
