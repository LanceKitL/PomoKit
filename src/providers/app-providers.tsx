"use client"

import { MotionConfig } from "motion/react"
import type { ReactNode } from "react"
import ThemeProvider from "./theme-provider"

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>{children}</ThemeProvider>
    </MotionConfig>
  )
}
