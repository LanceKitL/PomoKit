import React from "react"

import { fireEvent, render, screen } from "@testing-library/react"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { defaultPreferences } from "@/features/preferences/preferences.model"

import { localPreferencesRepository } from "@/features/preferences/local-preferences.repository"

import SoundProvider, { useSoundSettings } from "./sound-provider"

const { playButtonTap } = vi.hoisted(() => ({
  playButtonTap: vi.fn(),
}))

vi.mock("@/lib/sounds", () => ({ playButtonTap }))

function Harness() {
  const { soundEnabled, setSoundEnabled } = useSoundSettings()

  return (
    <>
      <p>Sounds {soundEnabled ? "on" : "off"}</p>
      <button type="button">A button</button>
      <button type="button" onClick={() => setSoundEnabled(!soundEnabled)}>
        Toggle sounds
      </button>
    </>
  )
}

describe("SoundProvider", () => {
  beforeEach(() => {
    localStorage.clear()

    localPreferencesRepository.save(defaultPreferences)

    playButtonTap.mockClear()
  })

  it("plays a tap for buttons and respects the saved sound setting", () => {
    render(
      <SoundProvider>
        <Harness />
      </SoundProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "A button" }))

    expect(playButtonTap).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: "Toggle sounds" }))

    expect(screen.getByText("Sounds off")).toBeInTheDocument()

    expect(localPreferencesRepository.load().soundEnabled).toBe(false)

    fireEvent.click(screen.getByRole("button", { name: "A button" }))

    expect(playButtonTap).toHaveBeenCalledTimes(2)
  })
})
