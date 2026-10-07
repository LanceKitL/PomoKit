"use client"

import { FileText } from "lucide-react"
import AppHeader from "@/components/layout/app-header"
import NotesPanel from "./notes-panel"

export default function NotesScreen() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-canvas px-4 py-5 sm:px-7 sm:py-6 lg:px-10"
    >
      <div className="mx-auto max-w-5xl">
        <AppHeader />
        <header className="mb-8 mt-8 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-peach text-on-accent">
            <FileText aria-hidden="true" size={23} />
          </span>
          <div>
            <p className="text-sm font-bold text-primary-strong">Workspace</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Notes
            </h1>
          </div>
        </header>
        <NotesPanel />
      </div>
    </main>
  )
}
