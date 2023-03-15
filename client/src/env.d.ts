interface ImportMetaEnv {
  readonly VITE_CLIENT_ID: string;
  readonly VITE_AUTH_URL: string;
  readonly VITE_AUTH_REALM: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
