import type { Metadata } from "next"
import NotesScreen from "@/features/notes/components/notes-screen"

export const metadata: Metadata = { title: "Notes" }

export default function NotesPage() {
  return <NotesScreen />
}
