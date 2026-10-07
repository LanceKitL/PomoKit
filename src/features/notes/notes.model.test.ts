import { describe, expect, it } from "vitest"
import {
  autoListCommandFor,
  defaultNote,
  isNoteDocument,
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
})
