export interface RegistryFile {
  path: string
  type: string
  target?: string
}

export interface RegistryMeta {
  kind?: string
  iframeHeight?: string
}

export interface RegistryItem {
  name: string
  type: string
  title: string
  description: string
  author?: string
  categories?: string[]
  meta?: RegistryMeta
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  cssVars?: Record<string, Record<string, string>>
  envVars?: Record<string, string>
  docs?: string
}
