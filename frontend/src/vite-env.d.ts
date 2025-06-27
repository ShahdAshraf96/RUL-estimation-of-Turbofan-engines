/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ML_API_BASE_URL: string
  // Add other environment variables here if you use them
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
