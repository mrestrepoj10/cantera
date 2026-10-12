# Theme Toggle (`@cantera/theme-toggle`)

A light and dark switch on next-themes whose icon and name follow the .dark class in CSS, so it renders correctly before hydration, plus the ThemeProvider to mount it under.

- Type: component
- Install: `npx shadcn@latest add @cantera/theme-toggle`
- Docs: https://canteraui.vercel.app/components/theme-toggle
- Registry item: https://canteraui.vercel.app/r/theme-toggle.json
- Registry dependencies: button
- npm dependencies: next-themes, lucide-react

Files written into the consumer project:

- `theme-toggle.tsx`
- `components/theme-provider.tsx`

## Notes

Mount ThemeProvider (components/theme-provider.tsx, the wrapper from the shadcn dark mode guide) once in the root layout around children, with attribute="class", defaultTheme="system", enableSystem, and disableTransitionOnChange, and add suppressHydrationWarning to <html>: next-themes writes the class there before hydration. Skip it if your app already has that provider. The toggle flips between light and dark from the resolved theme, so a visitor on system lands on the opposite of what they see; the choice persists in localStorage under theme. The icon and accessible name come from the dark: variant, not React state, so the server markup is already right and nothing flickers on hydration. That relies on the class-based dark variant shadcn's globals.css declares.

## ThemeToggle props

- `variant` (`'default' | 'outline' | 'secondary' | 'ghost'`, default `'ghost'`) — Button variant, forwarded to the shadcn button styles.
- `className` (`string`) — Merged over the 40px square default, so a size class here resizes the target (size-8 in an icon rail, size-11 for a primary touch target).
- `...props` (`Omit<ComponentProps<typeof Button>, 'children' | 'onClick'>`) — Every other button prop. The icon, the accessible name ("Switch to dark theme" or "Switch to light theme"), and the click handler are fixed.

## ThemeProvider props

- `...props` (`ComponentProps<typeof NextThemesProvider>`) — Forwarded to next-themes. Pass attribute="class", defaultTheme="system", enableSystem, and disableTransitionOnChange for the class-based .dark theme shadcn primitives expect.
