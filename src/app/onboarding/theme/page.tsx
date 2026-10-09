import type { Metadata } from "next"
import ThemeScreen from "@/features/onboarding/components/theme-screen"

export const metadata: Metadata = { title: "Choose your workspace colors" }

export default function ThemePage() {
  return <ThemeScreen />
}
