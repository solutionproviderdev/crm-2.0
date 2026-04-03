"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * ThemeProvider
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around next-themes. The mounted-gate pattern (useState/useEffect)
 * is no longer needed and actually causes the console warning:
 *
 *   "Encountered a script tag while rendering React component"
 *
 * next-themes injects a small inline <script> at hydration time to prevent
 * theme flashing — this is intentional library behaviour. React warns about it
 * in dev mode, but it is harmless and suppressed by `suppressHydrationWarning`
 * already set on <html> in the root layout.
 *
 * The old guard (`if (!mounted) return <>{children}</>`) was masking the
 * ThemeProvider on first render, which caused a redundant re-mount cycle.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}
