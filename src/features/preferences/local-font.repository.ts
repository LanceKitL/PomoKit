import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/storage/local-storage"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import { defaultFontName, isFontName } from "./font.model"
import type { FontRepository } from "./font.repository"

export const localFontRepository: FontRepository = {
  load() {
    const font = readStorage<unknown>(STORAGE_KEYS.font, null)
    return isFontName(font) ? font : defaultFontName
  },
  save(font) {
    writeStorage(STORAGE_KEYS.font, font)
  },
  reset() {
    removeStorage(STORAGE_KEYS.font)
  },
}
