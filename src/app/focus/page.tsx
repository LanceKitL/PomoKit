import type { Metadata } from "next"
import FocusWorkspace from "@/features/timer/components/focus-workspace"

export const metadata: Metadata = { title: "Focus" }

export default function FocusPage() {
  return <FocusWorkspace />
}
