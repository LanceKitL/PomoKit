import { beforeEach, describe, expect, it } from "vitest"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import { defaultFontName } from "./font.model"
import { localFontRepository } from "./local-font.repository"

describe("local font repository", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns the default font when no font is saved", () => {
    expect(localFontRepository.load()).toBe(defaultFontName)
  })

  it("saves and restores a selected font", () => {
    localFontRepository.save("space")

    expect(localStorage.getItem(STORAGE_KEYS.font)).toBe('"space"')
    expect(localFontRepository.load()).toBe("space")
  })

  it("falls back to the default for an unknown saved font", () => {
    localStorage.setItem(STORAGE_KEYS.font, JSON.stringify("unknown-font"))

    expect(localFontRepository.load()).toBe(defaultFontName)
  })
})
