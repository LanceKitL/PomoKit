import { describe, expect, it } from "vitest"
import {
  autoListCommandFor,
  defaultNote,
  isNoteDocument,
  normalizeNoteLists,
  noteToPlainText,
  sanitizeNoteHtml,
} from "./notes.model"

describe("notes model", () => {
  it("provides a usable starter note", () => {
    expect(defaultNote.title).toBe("My notes")
    expect(defaultNote.contentHtml).toContain("<p>")
  })

  it("validates versioned note records", () => {
    expect(isNoteDocument(defaultNote)).toBe(true)
    expect(isNoteDocument({ ...defaultNote, version: 2 })).toBe(false)
    expect(isNoteDocument({ ...defaultNote, contentHtml: 42 })).toBe(false)
  })

  it("removes unsupported markup and attributes", () => {
    expect(
      sanitizeNoteHtml(
        '<p data-test="remove"><strong>Keep</strong><script>alert(1)</script></p>',
      ),
    ).toBe("<p><strong>Keep</strong>alert(1)</p>")
  })

  it("detects markdown-style list triggers", () => {
    expect(autoListCommandFor("-")).toBe("insertUnorderedList")
    expect(autoListCommandFor("1.")).toBe("insertOrderedList")
    expect(autoListCommandFor("- item")).toBeNull()
    expect(autoListCommandFor("12.")).toBeNull()
  })

  it("moves browser-generated lists out of paragraph wrappers", () => {
    const editor = document.createElement("div")
    const paragraph = document.createElement("p")
    const list = document.createElement("ul")
    const item = document.createElement("li")
    item.textContent = "List item"
    list.append(item)
    paragraph.append(list)
    editor.append(paragraph)

    normalizeNoteLists(editor)

    expect(editor.innerHTML).toBe("<ul><li>List item</li></ul>")
  })

  it("preserves paragraph text surrounding a browser-generated list", () => {
    const editor = document.createElement("div")
    const paragraph = document.createElement("p")
    const list = document.createElement("ul")
    const item = document.createElement("li")
    item.textContent = "List item"
    list.append(item)
    paragraph.append("Before", list, "After")
    editor.append(paragraph)

    normalizeNoteLists(editor)

    expect(editor.innerHTML).toBe(
      "<p>Before</p><ul><li>List item</li></ul><p>After</p>",
    )
  })

  it("keeps a valid top-level list inside the editable root", () => {
    const editor = document.createElement("div")
    editor.innerHTML = "<ul><li>List item</li></ul>"

    normalizeNoteLists(editor)

    expect(editor.innerHTML).toBe("<ul><li>List item</li></ul>")
  })

  it("exports note titles, paragraphs, and lists as readable plain text", () => {
    expect(
      noteToPlainText(
        "  Plan  ",
        "<p>First <strong>important</strong> step.</p><ol><li>Draft</li><li>Review</li></ol><p>Done.</p>",
      ),
    ).toBe("Plan\n\nFirst important step.\n\n1. Draft\n2. Review\n\nDone.\n")
  })

  it("uses a fallback title and supports empty note bodies", () => {
    expect(noteToPlainText("  ", "<p><br></p>")).toBe("Untitled note\n")
  })
})
