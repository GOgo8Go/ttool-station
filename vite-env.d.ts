/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COPYRIGHT?: string
  readonly VITE_ICP_INFO?: string
  readonly VITE_POLICE_INFO?: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}