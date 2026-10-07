"use client"

import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react"
import Button from "@/components/ui/button"

export default function NotesToolbar({
  onCommand,
}: {
  onCommand: (command: string, value?: string) => void
}) {
  return (
    <div
      role="toolbar"
      className="flex flex-wrap items-center gap-1 border-b border-line pb-3"
      aria-label="Note formatting"
    >
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Bold"
        title="Bold"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onCommand("bold")}
      >
        <Bold aria-hidden="true" size={18} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Italic"
        title="Italic"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onCommand("italic")}
      >
        <Italic aria-hidden="true" size={18} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Underline"
        title="Underline"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onCommand("underline")}
      >
        <Underline aria-hidden="true" size={18} />
      </Button>
      <span className="mx-1 h-7 w-px bg-line" aria-hidden="true" />
      <label className="sr-only" htmlFor="note-block-style">
        Block style
      </label>
      <select
        id="note-block-style"
        className="min-h-11 rounded-xl bg-surface-raised px-3 text-sm font-bold text-muted"
        defaultValue="p"
        onMouseDown={(event) => event.stopPropagation()}
        onChange={(event) => onCommand("formatBlock", event.target.value)}
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
      </select>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Bulleted list"
        title="Bulleted list"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onCommand("insertUnorderedList")}
      >
        <List aria-hidden="true" size={18} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Numbered list"
        title="Numbered list"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onCommand("insertOrderedList")}
      >
        <ListOrdered aria-hidden="true" size={18} />
      </Button>
    </div>
  )
}
