export type NoteDocument = {
  version: 1
  title: string
  contentHtml: string
  updatedAt: string
}

export type NoteRecord = NoteDocument & {
  id: string
}

export type NoteCollection = {
  version: 2
  activeNoteId: string
  notes: NoteRecord[]
}

export const defaultNote: NoteDocument = {
  version: 1,
  title: "My notes",
  contentHtml:
    "<p>Capture an idea, plan a session, or write a thought down.</p>",
  updatedAt: "",
}

export function createNoteRecord(note: NoteDocument = defaultNote): NoteRecord {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return { ...note, id }
}

export type AutoListCommand = "insertUnorderedList" | "insertOrderedList"

export function autoListCommandFor(textBeforeCaret: string) {
  if (textBeforeCaret === "-") return "insertUnorderedList" as const
  if (textBeforeCaret === "1.") return "insertOrderedList" as const
  return null
}

const allowedTags = new Set([
  "P",
  "H1",
  "H2",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "BR",
])

export function sanitizeNoteHtml(html: string) {
  if (typeof window === "undefined") return ""
  const template = document.createElement("template")
  template.innerHTML = html

  function clean(node: Node) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) continue
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove()
        continue
      }
      const element = child as HTMLElement
      if (!allowedTags.has(element.tagName)) {
        element.replaceWith(...Array.from(element.childNodes))
        continue
      }
      for (const attribute of Array.from(element.attributes)) {
        element.removeAttribute(attribute.name)
      }
      clean(element)
    }
  }

  clean(template.content)
  return template.innerHTML
}

export function isNoteDocument(value: unknown): value is NoteDocument {
  if (!value || typeof value !== "object") return false
  const note = value as Partial<NoteDocument>
  return (
    note.version === 1 &&
    typeof note.title === "string" &&
    typeof note.contentHtml === "string" &&
    typeof note.updatedAt === "string"
  )
}

export function isNoteRecord(value: unknown): value is NoteRecord {
  return (
    isNoteDocument(value) &&
    typeof (value as Partial<NoteRecord>).id === "string" &&
    (value as Partial<NoteRecord>).id.length > 0
  )
}

export function isNoteCollection(value: unknown): value is NoteCollection {
  if (!value || typeof value !== "object") return false
  const collection = value as Partial<NoteCollection>
  return (
    collection.version === 2 &&
    typeof collection.activeNoteId === "string" &&
    Array.isArray(collection.notes) &&
    collection.notes.length > 0 &&
    collection.notes.every(isNoteRecord) &&
    collection.notes.some((note) => note.id === collection.activeNoteId)
  )
}
