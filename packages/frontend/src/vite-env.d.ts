/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.scad' {
  const content: string;
  export default content;
}

declare module '*.scad?raw' {
  const content: string;
  export default content;
}
