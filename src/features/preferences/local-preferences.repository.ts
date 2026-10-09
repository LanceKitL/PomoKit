import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/storage/local-storage"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import { defaultPreferences, type Preferences } from "./preferences.model"
import type { PreferencesRepository } from "./preferences.repository"

function validDuration(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 120
  )
}

export const localPreferencesRepository: PreferencesRepository = {
  load() {
    const value = readStorage<Preferences | null>(
      STORAGE_KEYS.preferences,
      null,
    )
    if (
      value?.version !== 1 ||
      !validDuration(value.focusMinutes) ||
      !validDuration(value.shortBreakMinutes) ||
      !validDuration(value.longBreakMinutes) ||
      !validDuration(value.sessionsBeforeLongBreak) ||
      (value.soundEnabled !== undefined &&
        typeof value.soundEnabled !== "boolean")
    ) {
      return defaultPreferences
    }
    return {
      ...value,
      soundEnabled: value.soundEnabled ?? defaultPreferences.soundEnabled,
    }
  },
  save(preferences) {
    writeStorage(STORAGE_KEYS.preferences, preferences)
  },
  reset() {
    removeStorage(STORAGE_KEYS.preferences)
  },
}
