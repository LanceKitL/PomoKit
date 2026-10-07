import { beforeEach, describe, expect, it } from "vitest"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import { defaultNote } from "./notes.model"
import { localNotesRepository } from "./local-notes.repository"

describe("local notes repository", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("migrates a legacy note into a collection", () => {
    localStorage.setItem(
      STORAGE_KEYS.notes,
      JSON.stringify({ ...defaultNote, contentHtml: "<p>Keep me</p>" }),
    )

    const collection = localNotesRepository.load()

    expect(collection.version).toBe(2)
    expect(collection.notes).toHaveLength(1)
    expect(collection.notes[0].contentHtml).toBe("<p>Keep me</p>")
    expect(collection.activeNoteId).toBe(collection.notes[0].id)
  })

  it("creates, selects, saves, and removes notes", () => {
    const first = localNotesRepository.load().notes[0]
    const second = localNotesRepository.create()

    expect(localNotesRepository.load().activeNoteId).toBe(second.id)
    localNotesRepository.save({ ...second, title: "Planning" })
    localNotesRepository.select(first.id)
    localNotesRepository.remove(second.id)

    const collection = localNotesRepository.load()
    expect(collection.notes).toHaveLength(1)
    expect(collection.notes[0].id).toBe(first.id)
    expect(collection.activeNoteId).toBe(first.id)
  })

  it("does not remove the final note", () => {
    const note = localNotesRepository.load().notes[0]

    localNotesRepository.remove(note.id)

    expect(localNotesRepository.load().notes).toHaveLength(1)
  })
})
