import { beforeEach, describe, expect, it } from "vitest"

import { STORAGE_KEYS } from "@/lib/storage/storage-keys"

import { defaultPreferences } from "./preferences.model"

import { localPreferencesRepository } from "./local-preferences.repository"

describe("local preferences repository", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("defaults sound effects to enabled", () => {
    expect(localPreferencesRepository.load().soundEnabled).toBe(true)
  })

  it("preserves existing timer preferences when adding sound effects", () => {
    const legacyPreferences = {
      version: 1,

      focusMinutes: 40,

      shortBreakMinutes: 7,

      longBreakMinutes: 20,

      sessionsBeforeLongBreak: 3,
    }

    localStorage.setItem(
      STORAGE_KEYS.preferences,

      JSON.stringify(legacyPreferences),
    )

    expect(localPreferencesRepository.load()).toEqual({
      ...legacyPreferences,

      soundEnabled: true,
    })
  })

  it("loads a saved sound preference", () => {
    localPreferencesRepository.save({
      ...defaultPreferences,

      soundEnabled: false,
    })

    expect(localPreferencesRepository.load().soundEnabled).toBe(false)
  })
})
