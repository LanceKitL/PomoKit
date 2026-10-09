import type { Metadata } from "next"

import AssistantSettings from "@/features/assistant/components/assistant-settings"

export const metadata: Metadata = { title: "Assistant connection" }

export default function AssistantSettingsPage() {
  return <AssistantSettings />
}
