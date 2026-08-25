import { cacheLife } from 'next/cache'
import { createHighlighter, createJavaScriptRegexEngine, type Highlighter } from 'shiki'

// `defaultColor: false` bakes both appearances into one pass as custom
// properties, so a theme switch needs no re-highlight and no client bundle.
// These themes are contrast-verified against `bg-muted/20` (4.5:1 in both
// appearances); the vitesse pair fails that bar.
const themes = { light: 'light-plus', dark: 'dark-plus' } as const

const languages = ['tsx', 'ts', 'json', 'css', 'bash'] as const

export type CodeLang = (typeof languages)[number]

let highlighterPromise: Promise<Highlighter> | undefined

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [themes.light, themes.dark],
    langs: [...languages],
    // The JS regex engine keeps the WASM binary out of the server bundle.
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  })
  return highlighterPromise
}

interface LangByExtension {
  [extension: string]: CodeLang
}

const extensionLangs: LangByExtension = {
  tsx: 'tsx',
  ts: 'ts',
  json: 'json',
  css: 'css',
  sh: 'bash',
}

export function langForFilename(filename: string | undefined): CodeLang {
  const extension = filename?.split('.').pop()?.toLowerCase()
  return (extension && extensionLangs[extension]) || 'tsx'
}

export async function highlightCode(code: string, lang: CodeLang): Promise<string> {
  'use cache'
  cacheLife('max')
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, { lang, themes, defaultColor: false })
}
