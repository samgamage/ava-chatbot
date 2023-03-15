interface ImportMetaEnv {
  readonly VITE_CLIENT_ID: string;
  readonly VITE_AUTH_DOMAIN: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
