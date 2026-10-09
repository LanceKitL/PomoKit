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

export function normalizeNoteLists(editor: HTMLElement) {
  const lists = editor.querySelectorAll(
    "p > ul, p > ol, h1 > ul, h1 > ol, h2 > ul, h2 > ol, div > ul, div > ol",
  )

  for (const list of Array.from(lists)) {
    const parent = list.parentElement
    if (!parent || parent === editor) continue

    const before = document.createElement(parent.tagName.toLowerCase())
    const after = document.createElement(parent.tagName.toLowerCase())
    const fragment = document.createDocumentFragment()
    let passedList = false

    for (const child of Array.from(parent.childNodes)) {
      if (child === list) {
        passedList = true
      } else {
        const target = passedList ? after : before
        target.append(child)
      }
    }

    if (before.textContent?.trim() || before.querySelector("br, strong, em, u")) {
      fragment.append(before)
    }
    fragment.append(list)
    if (after.textContent?.trim() || after.querySelector("br, strong, em, u")) {
      fragment.append(after)
    }
    parent.replaceWith(fragment)
  }
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

export function noteToPlainText(title: string, contentHtml: string) {
  const template = document.createElement("template")
  template.innerHTML = contentHtml

  function renderChildren(node: Node): string {
    return Array.from(node.childNodes, renderNode).join("")
  }

  function renderNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ""
    if (node.nodeType !== Node.ELEMENT_NODE) return ""

    const element = node as HTMLElement
    const content = renderChildren(element)
    switch (element.tagName) {
      case "BR":
        return "\n"
      case "P":
      case "H1":
      case "H2":
        return `${content.trim()}\n\n`
      case "UL":
        return `${Array.from(
          element.children,
          (item) => `- ${renderChildren(item).trim()}`,
        ).join("\n")}\n\n`
      case "OL":
        return `${Array.from(
          element.children,
          (item, index) => `${index + 1}. ${renderChildren(item).trim()}`,
        ).join("\n")}\n\n`
      default:
        return content
    }
  }

  const cleanTitle = title.trim() || "Untitled note"
  const body = renderChildren(template.content)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return body ? `${cleanTitle}\n\n${body}\n` : `${cleanTitle}\n`
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
  if (!isNoteDocument(value)) return false
  const id = (value as Partial<NoteRecord>).id
  return typeof id === "string" && id.length > 0
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
