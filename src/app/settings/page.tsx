import type { Metadata } from "next"
import PreferencesScreen from "@/features/preferences/components/preferences-screen"

export const metadata: Metadata = { title: "Settings" }

export default function SettingsPage() {
  return <PreferencesScreen />
}
