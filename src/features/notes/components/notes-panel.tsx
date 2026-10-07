"use client"

import { Plus, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/button"
import Card from "@/components/ui/card"
import { Input } from "@/components/ui/field"
import { localNotesRepository } from "../local-notes.repository"
import {
  autoListCommandFor,
  sanitizeNoteHtml,
  type NoteCollection,
  type NoteRecord,
} from "../notes.model"
import NotesToolbar from "./notes-toolbar"

export default function NotesPanel() {
  const editorRef = useRef<HTMLDivElement>(null)
  const [collection, setCollection] = useState<NoteCollection | null>(null)
  const [note, setNote] = useState<NoteRecord | null>(null)
  const [ready, setReady] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localNotesRepository.load()
    const next =
      stored.notes.find((item) => item.id === stored.activeNoteId) ??
      stored.notes[0]
    setCollection(stored)
    setNote(next)
    if (editorRef.current) editorRef.current.innerHTML = next.contentHtml
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || !dirty || !note) return
    const noteId = note.id
    const timeout = window.setTimeout(() => {
      const current = localNotesRepository
        .load()
        .notes.find((item) => item.id === noteId)
      if (!current) return
      localNotesRepository.save({
        ...note,
        updatedAt: new Date().toISOString(),
      })
      setCollection(localNotesRepository.load())
      setDirty(false)
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [dirty, note, ready])

  useEffect(() => {
    if (!pendingDeleteId) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPendingDeleteId(null)
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [pendingDeleteId])

  function updateTitle(title: string) {
    setNote((current) => (current ? { ...current, title } : current))
    setDirty(true)
  }

  function syncEditor() {
    const contentHtml = sanitizeNoteHtml(editorRef.current?.innerHTML ?? "")
    setNote((current) => (current ? { ...current, contentHtml } : current))
    setDirty(true)
  }

  function persistCurrent() {
    if (!note) return
    localNotesRepository.save({ ...note, updatedAt: new Date().toISOString() })
  }

  function selectNote(next: NoteRecord) {
    if (!note || next.id === note.id) return
    persistCurrent()
    localNotesRepository.select(next.id)
    const nextCollection = localNotesRepository.load()
    setCollection(nextCollection)
    setNote(next)
    setDirty(false)
    if (editorRef.current) editorRef.current.innerHTML = next.contentHtml
  }

  function createNote() {
    persistCurrent()
    const next = localNotesRepository.create()
    const nextCollection = localNotesRepository.load()
    setCollection(nextCollection)
    setNote(next)
    setDirty(false)
    if (editorRef.current) editorRef.current.innerHTML = next.contentHtml
  }

  function removeNote(id: string) {
    if (!collection || collection.notes.length === 1) return
    persistCurrent()
    localNotesRepository.remove(id)
    const nextCollection = localNotesRepository.load()
    const next =
      nextCollection.notes.find(
        (item) => item.id === nextCollection.activeNoteId,
      ) ?? nextCollection.notes[0]
    setCollection(nextCollection)
    setNote(next)
    setDirty(false)
    setPendingDeleteId(null)
    if (editorRef.current) editorRef.current.innerHTML = next.contentHtml
  }

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncEditor()
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    const text = event.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
    syncEditor()
  }

  function convertTypedList() {
    const selection = window.getSelection()
    const anchor = selection?.anchorNode
    const editor = editorRef.current
    const element = anchor?.parentElement
    const block = element?.closest<HTMLElement>("p, h1, h2, div")
    if (
      !selection?.isCollapsed ||
      !anchor ||
      anchor.nodeType !== Node.TEXT_NODE ||
      !editor ||
      (block && block !== editor && block.closest("li"))
    )
      return false

    const beforeCaret = document.createRange()
    beforeCaret.setStart(block && block !== editor ? block : editor, 0)
    beforeCaret.setEnd(anchor, selection.anchorOffset)
    const textBeforeCaret = beforeCaret.toString()
    const currentLine = textBeforeCaret.split(/\r?\n/).pop() ?? ""
    const marker =
      currentLine === "1. " ? "1. " : currentLine === "- " ? "- " : ""
    const command = marker ? autoListCommandFor(marker.slice(0, -1)) : null
    if (
      !command ||
      !anchor.textContent ||
      selection.anchorOffset < marker.length
    )
      return false

    const markerRange = document.createRange()
    markerRange.setStart(anchor, selection.anchorOffset - marker.length)
    markerRange.setEnd(anchor, selection.anchorOffset)
    markerRange.deleteContents()
    selection.collapse(anchor, selection.anchorOffset - marker.length)
    document.execCommand(command)
    syncEditor()
    return true
  }

  function handleEditorInput() {
    if (!convertTypedList()) syncEditor()
  }

  function handleKeyboardShortcut(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return
    const command = {
      b: "bold",
      i: "italic",
      u: "underline",
    }[event.key.toLowerCase()]
    if (!command) return
    event.preventDefault()
    runCommand(command)
  }

  return (
    <Card className="p-5 sm:p-8">
      <div className="grid gap-7 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside
          aria-label="Notes"
          className="border-b border-line pb-5 lg:border-b-0 lg:border-r lg:pr-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">
              Your notes
            </h2>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Create note"
              title="Create note"
              onClick={createNote}
            >
              <Plus aria-hidden="true" size={18} />
            </Button>
          </div>
          <div className="mt-3 grid gap-1">
            {collection?.notes.map((item) => (
              <div key={item.id} className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectNote(item)}
                  className={`min-h-11 min-w-0 flex-1 truncate rounded-xl px-3 text-left text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    item.id === note?.id
                      ? "bg-peach text-on-accent"
                      : "text-muted hover:bg-surface-raised hover:text-ink"
                  }`}
                >
                  {item.title || "Untitled note"}
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${item.title || "untitled note"}`}
                  title="Delete note"
                  disabled={collection.notes.length === 1}
                  onClick={() => setPendingDeleteId(item.id)}
                >
                  <Trash2 aria-hidden="true" size={16} />
                </Button>
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0">
          <Input
            value={note?.title ?? ""}
            onChange={(event) => updateTitle(event.target.value)}
            aria-label="Note title"
            placeholder="Untitled note"
            maxLength={120}
            className="border-0 bg-transparent px-0 text-3xl font-extrabold shadow-none focus-visible:ring-0"
          />
          <div className="mt-6">
            <NotesToolbar onCommand={runCommand} />
            <div
              ref={editorRef}
              role="textbox"
              aria-label="Note content"
              aria-multiline="true"
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onPaste={handlePaste}
              onKeyDown={handleKeyboardShortcut}
              className="note-editor min-h-104 py-6 text-base leading-8 text-ink focus-visible:outline-none"
            />
          </div>
        </div>
      </div>
      <p className="text-sm font-bold text-muted" aria-live="polite">
        {!ready ? "Loading note..." : dirty ? "Saving..." : "Saved locally"}
      </p>
      {pendingDeleteId && collection && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingDeleteId(null)
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-6 paper-shadow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
            aria-describedby="delete-note-description"
          >
            <h2 id="delete-note-title" className="text-xl font-extrabold">
              Delete note?
            </h2>
            <p
              id="delete-note-description"
              className="mt-2 leading-7 text-muted"
            >
              "
              {collection.notes.find((item) => item.id === pendingDeleteId)
                ?.title || "Untitled note"}
              " will be permanently removed from this device.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => removeNote(pendingDeleteId)}
              >
                Delete note
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
