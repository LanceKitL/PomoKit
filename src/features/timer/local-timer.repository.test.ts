import { beforeEach, describe, expect, it } from "vitest"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import { defaultPreferences } from "@/features/preferences/preferences.model"
import { createTimer } from "./timer.model"
import { localTimerRepository } from "./local-timer.repository"

describe("local timer repository", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("restores a pending check-in", () => {
    const timer = { ...createTimer(defaultPreferences), checkInPending: true }
    localStorage.setItem(STORAGE_KEYS.timer, JSON.stringify(timer))

    expect(localTimerRepository.load()?.checkInPending).toBe(true)
  })

  it("migrates saved timers without a check-in flag", () => {
    const timer = createTimer(defaultPreferences)
    const { checkInPending, ...legacyTimer } = timer
    expect(checkInPending).toBe(false)
    localStorage.setItem(STORAGE_KEYS.timer, JSON.stringify(legacyTimer))

    expect(localTimerRepository.load()?.checkInPending).toBe(false)
  })
})
