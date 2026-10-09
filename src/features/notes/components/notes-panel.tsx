"use client"

import { Download, Plus, Trash2 } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useId, useRef, useState } from "react"
import Button from "@/components/ui/button"
import Card from "@/components/ui/card"
import { Input } from "@/components/ui/field"
import { localNotesRepository } from "../local-notes.repository"
import {
  autoListCommandFor,
  normalizeNoteLists,
  noteToPlainText,
  sanitizeNoteHtml,
  type NoteCollection,
  type NoteRecord,
} from "../notes.model"
import NotesToolbar from "./notes-toolbar"

export default function NotesPanel() {
  const editorRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<NoteRecord | null>(null)
  const dirtyRef = useRef(false)
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
    noteRef.current = next
    setNote(next)
    if (editorRef.current) editorRef.current.innerHTML = next.contentHtml
    setReady(true)
  }, [])

  useEffect(() => {
    function flushPendingNote() {
      const current = noteRef.current
      if (!dirtyRef.current || !current) return

      const saved = { ...current, updatedAt: new Date().toISOString() }
      localNotesRepository.save(saved)
      noteRef.current = saved
      dirtyRef.current = false
    }

    window.addEventListener("pagehide", flushPendingNote)
    window.addEventListener("beforeunload", flushPendingNote)
    return () => {
      window.removeEventListener("pagehide", flushPendingNote)
      window.removeEventListener("beforeunload", flushPendingNote)
    }
  }, [])

  useEffect(() => {
    if (!ready || !dirty || !note) return
    const noteId = note.id
    const timeout = window.setTimeout(() => {
      const current = noteRef.current
      if (!dirtyRef.current || !current || current.id !== noteId) return
      const saved = {
        ...current,
        updatedAt: new Date().toISOString(),
      }
      localNotesRepository.save(saved)
      noteRef.current = saved
      dirtyRef.current = false
      setNote(saved)
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
    const current = noteRef.current
    if (!current) return
    const next = { ...current, title }
    noteRef.current = next
    setNote(next)
    dirtyRef.current = true
    setDirty(true)
  }

  function syncEditor() {
    const contentHtml = sanitizeNoteHtml(editorRef.current?.innerHTML ?? "")
    const current = noteRef.current
    if (!current) return
    const next = { ...current, contentHtml }
    noteRef.current = next
    setNote(next)
    dirtyRef.current = true
    setDirty(true)
  }

  function persistCurrent() {
    const current = noteRef.current
    if (!current) return
    const saved = { ...current, updatedAt: new Date().toISOString() }
    localNotesRepository.save(saved)
    noteRef.current = saved
    dirtyRef.current = false
    setNote(saved)
    setDirty(false)
  }

  function downloadCurrentNote() {
    syncEditor()
    const current = noteRef.current
    if (!current) return
    persistCurrent()

    const title = current.title.trim() || "Untitled note"
    const filename =
      title
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
        .replace(/[. ]+$/g, "")
        .slice(0, 100) || "note"
    const blob = new Blob(
      [noteToPlainText(current.title, current.contentHtml)],
      { type: "text/plain;charset=utf-8" },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${filename}.txt`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function selectNote(next: NoteRecord) {
    if (!note || next.id === note.id) return
    persistCurrent()
    localNotesRepository.select(next.id)
    const nextCollection = localNotesRepository.load()
    setCollection(nextCollection)
    noteRef.current = next
    setNote(next)
    dirtyRef.current = false
    setDirty(false)
    if (editorRef.current) editorRef.current.innerHTML = next.contentHtml
  }

  function createNote() {
    persistCurrent()
    const next = localNotesRepository.create()
    const nextCollection = localNotesRepository.load()
    setCollection(nextCollection)
    noteRef.current = next
    setNote(next)
    dirtyRef.current = false
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
    noteRef.current = next
    setNote(next)
    dirtyRef.current = false
    setDirty(false)
    setPendingDeleteId(null)
    if (editorRef.current) editorRef.current.innerHTML = next.contentHtml
  }

  function runCommand(command: string, value?: string) {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(command, false, value)
    if (command === "insertUnorderedList" || command === "insertOrderedList") {
      normalizeNoteLists(editor)
    }
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
                <NoteTitleButton
                  title={item.title || "Untitled note"}
                  selected={item.id === note?.id}
                  onClick={() => selectNote(item)}
                />
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
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={note?.title ?? ""}
              onChange={(event) => updateTitle(event.target.value)}
              aria-label="Note title"
              placeholder="Untitled note"
              maxLength={120}
              className="w-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-3xl font-extrabold shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={downloadCurrentNote}
              disabled={!ready || !note}
            >
              <Download aria-hidden="true" size={17} />
              Download .txt
            </Button>
          </div>
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

function NoteTitleButton({
  title,
  selected,
  onClick,
}: {
  title: string
  selected: boolean
  onClick: () => void
}) {
  const tooltipId = useId()
  const prefersReducedMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const showTooltip = isHovered || isFocused

  return (
    <div
      className="relative min-w-0 flex-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={title}
        aria-describedby={showTooltip ? tooltipId : undefined}
        className={`interactive min-h-11 w-full min-w-0 truncate rounded-xl px-3 text-left text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          selected
            ? "bg-peach text-on-accent"
            : "text-muted hover:bg-surface-raised hover:text-ink"
        }`}
      >
        {title}
      </button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : -4,
              scale: prefersReducedMotion ? 1 : 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : -3,
              scale: prefersReducedMotion ? 1 : 0.98,
            }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.16,
              ease: "easeOut",
            }}
            className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold leading-5 text-ink shadow-lg"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
