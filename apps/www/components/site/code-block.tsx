import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  filename?: string
  className?: string
}

/** Registry source in a horizontally scrollable, muted block. No highlighting engine. */
function CodeBlock({ code, filename, className }: CodeBlockProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      {filename && (
        <div className="border-b border-border bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">
          {filename}
        </div>
      )}
      <pre className="max-h-[32rem] overflow-auto bg-muted/20 p-4">
        <code className="block font-mono text-[13px] leading-relaxed text-foreground/80">
          {code}
        </code>
      </pre>
    </div>
  )
}

export { CodeBlock }
