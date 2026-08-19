import { createHighlighter, createJavaScriptRegexEngine, type Highlighter } from 'shiki'

/**
 * Build-time syntax highlighting for the docs.
 *
 * Both appearances are baked into one pass: `defaultColor: false` makes shiki
 * emit every token's light and dark color as custom properties and set no
 * inline color at all, so the `.dark` rules in globals.css choose between them.
 * The theme switch therefore needs no re-highlight, no client bundle, and no
 * second copy of the markup.
 */
/**
 * Contrast-verified against the code block's surface (`bg-muted/20`) in both
 * appearances: every token color these themes emit clears 4.5:1 there. The
 * vitesse pair does not — its comments measure 2.3:1 in light and 3.9:1 in
 * dark — and the docs pages are held to the same a11y bar as the components.
 */
const themes = { light: 'light-plus', dark: 'dark-plus' } as const

const languages = ['tsx', 'ts', 'json', 'bash'] as const

export type CodeLang = (typeof languages)[number]

let highlighterPromise: Promise<Highlighter> | undefined

/** One highlighter for the whole build — grammars are expensive to load twice. */
function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [themes.light, themes.dark],
    langs: [...languages],
    // The JS regex engine keeps the WASM binary out of the server bundle; every
    // grammar above is compatible with it.
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  })
  return highlighterPromise
}

const extensionLangs: Record<string, CodeLang> = {
  tsx: 'tsx',
  ts: 'ts',
  json: 'json',
  sh: 'bash',
}

/** Language for a registry source file, defaulting to tsx. */
export function langForFilename(filename: string | undefined): CodeLang {
  const extension = filename?.split('.').pop()?.toLowerCase()
  return (extension && extensionLangs[extension]) || 'tsx'
}

/** Highlighted `<pre class="shiki">…</pre>` markup for a snippet. */
export async function highlightCode(code: string, lang: CodeLang): Promise<string> {
  const highlighter = await getHighlighter()
  return highlighter.codeToHtml(code, { lang, themes, defaultColor: false })
}
