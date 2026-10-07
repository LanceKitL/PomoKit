import type { Preferences } from "./preferences.model"

export interface PreferencesRepository {
  load(): Preferences
  save(preferences: Preferences): void
  reset(): void
}
