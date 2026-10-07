import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/storage/local-storage"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import {
  createNoteRecord,
  defaultNote,
  isNoteCollection,
  isNoteDocument,
  sanitizeNoteHtml,
  type NoteCollection,
  type NoteRecord,
} from "./notes.model"
import type { NotesRepository } from "./notes.repository"

function normalizeNote(note: NoteRecord): NoteRecord {
  return { ...note, contentHtml: sanitizeNoteHtml(note.contentHtml) }
}

function createCollection(notes: NoteRecord[]): NoteCollection {
  const normalized = notes.map(normalizeNote)
  return {
    version: 2,
    activeNoteId: normalized[0].id,
    notes: normalized,
  }
}

function readCollection(): NoteCollection {
  const stored = readStorage<unknown>(STORAGE_KEYS.notes, null)
  if (isNoteCollection(stored)) {
    const notes = stored.notes.map(normalizeNote)
    const activeNoteId = notes.some((note) => note.id === stored.activeNoteId)
      ? stored.activeNoteId
      : notes[0].id
    return { version: 2, activeNoteId, notes }
  }
  if (isNoteDocument(stored)) {
    const migrated = createNoteRecord({
      ...stored,
      contentHtml: sanitizeNoteHtml(stored.contentHtml),
    })
    const collection = createCollection([migrated])
    writeStorage(STORAGE_KEYS.notes, collection)
    return collection
  }
  const collection = createCollection([createNoteRecord(defaultNote)])
  writeStorage(STORAGE_KEYS.notes, collection)
  return collection
}

export const localNotesRepository: NotesRepository = {
  load() {
    return readCollection()
  },
  create() {
    const collection = readCollection()
    const note = createNoteRecord({
      ...defaultNote,
      title: "Untitled note",
      contentHtml: "<p></p>",
      updatedAt: new Date().toISOString(),
    })
    writeStorage(STORAGE_KEYS.notes, {
      ...collection,
      activeNoteId: note.id,
      notes: [...collection.notes, note],
    })
    return note
  },
  save(note) {
    const collection = readCollection()
    if (!collection.notes.some((current) => current.id === note.id)) return
    writeStorage(STORAGE_KEYS.notes, {
      ...collection,
      notes: collection.notes.map((current) =>
        current.id === note.id ? normalizeNote(note) : current,
      ),
    })
  },
  select(id) {
    const collection = readCollection()
    if (!collection.notes.some((note) => note.id === id)) return
    writeStorage(STORAGE_KEYS.notes, { ...collection, activeNoteId: id })
  },
  remove(id) {
    const collection = readCollection()
    if (collection.notes.length === 1) return
    const notes = collection.notes.filter((note) => note.id !== id)
    if (notes.length === collection.notes.length) return
    const activeNoteId =
      collection.activeNoteId === id ? notes[0].id : collection.activeNoteId
    writeStorage(STORAGE_KEYS.notes, { version: 2, activeNoteId, notes })
  },
  reset() {
    removeStorage(STORAGE_KEYS.notes)
  },
}
