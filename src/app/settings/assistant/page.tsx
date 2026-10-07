import type { Metadata } from "next"
import AssistantSettings from "@/features/assistant/components/assistant-settings"

export const metadata: Metadata = { title: "Assistant settings" }

export default function AssistantSettingsPage() {
  return <AssistantSettings />
}
