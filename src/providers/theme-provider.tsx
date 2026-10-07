"use client"

/**
 * Themes get consolidated, so a stored value can stop resolving. Carry a
 * legacy un-namespaced value over, then drop anything that no longer maps to a
 * palette so the app falls back to the default instead of rendering a
 * half-applied theme.
 */
// Storage can be unavailable in private modes; the default theme is fine.

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useEffect } from "react"
import type { ReactNode } from "react"
import { defaultThemeName, isThemeName, themeNames } from "@/lib/themes"

const STORAGE_KEY = "pomokit:v1:theme"
const LEGACY_STORAGE_KEY = "theme"

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultThemeName}
      enableSystem={false}
      storageKey={STORAGE_KEY}
      themes={themeNames}
    >
      <ReconcileStoredTheme />
      {children}
    </NextThemesProvider>
  )
}
function ReconcileStoredTheme() {
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
        if (isThemeName(legacy)) {
          window.localStorage.setItem(STORAGE_KEY, legacy)
        }
        window.localStorage.removeItem(LEGACY_STORAGE_KEY)
      }
      if (stored && !isThemeName(stored)) {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}
  }, [])

  return null
}
