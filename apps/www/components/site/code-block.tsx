import { type CodeLang, highlightCode, langForFilename } from '@/components/site/highlight'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  filename?: string
  /** Defaults to the language implied by `filename`, then to tsx. */
  lang?: CodeLang
  className?: string
}

/**
 * Registry source, syntax-highlighted at build time. Server-only: shiki runs
 * during the render, so nothing about highlighting reaches the client bundle.
 */
async function CodeBlock({ code, filename, lang, className }: CodeBlockProps) {
  const html = await highlightCode(code, lang ?? langForFilename(filename))

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      {filename && (
        <div className="border-border border-b bg-muted/40 px-4 py-2 font-mono text-muted-foreground text-xs">
          {filename}
        </div>
      )}
      {/* shiki gives the <pre> tabindex="0" so an overflowing block is
          keyboard-scrollable; it therefore needs a focus indicator too. */}
      <div
        className={cn(
          'bg-muted/20 font-mono text-code',
          '[&_pre]:max-h-[32rem] [&_pre]:overflow-auto [&_pre]:p-4',
          '[&_pre]:focus-ring [&_pre]:rounded-lg',
        )}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output, generated at build time from files in this repo.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export { CodeBlock }
