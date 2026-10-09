"use client"

import { MotionConfig } from "motion/react"
import type { ReactNode } from "react"
import FontProvider from "./font-provider"
import SoundProvider from "./sound-provider"
import ThemeProvider from "./theme-provider"

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <FontProvider>
          <SoundProvider>{children}</SoundProvider>
        </FontProvider>
      </ThemeProvider>
    </MotionConfig>
  )
}
