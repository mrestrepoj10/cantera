import { EMBED_THEME_STORAGE_KEY } from '@/components/site/embed-frame'
import { ThemeProvider } from '@/components/site/theme-provider'

/**
 * Theming for the framed previews, scoped away from the site's.
 *
 * A preview follows the appearance of the docs page framing it, which is a
 * different decision from the one a visitor made on this site — and because the
 * frame runs on this origin, next-themes would otherwise persist the host's
 * appearance over the visitor's own. Its own storage key keeps the two apart.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider storageKey={EMBED_THEME_STORAGE_KEY}>{children}</ThemeProvider>
}
