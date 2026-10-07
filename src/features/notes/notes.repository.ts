import type { NoteCollection, NoteRecord } from "./notes.model"

export interface NotesRepository {
  load(): NoteCollection
  create(): NoteRecord
  save(note: NoteRecord): void
  select(id: string): void
  remove(id: string): void
  reset(): void
}
