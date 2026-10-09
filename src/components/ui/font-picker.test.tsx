import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import FontPicker from "./font-picker"
import FontProvider from "@/providers/font-provider"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"

describe("FontPicker", () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.font
  })

  afterEach(() => {
    cleanup()
  })

  it("previews each font and applies a selected font", async () => {
    render(
      <FontProvider>
        <FontPicker />
      </FontProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Font: Plus Jakarta Sans" }))

    expect(screen.getByRole("listbox", { name: "Choose font" })).toBeInTheDocument()
    expect(screen.getAllByText("PomoKit")).toHaveLength(8)

    fireEvent.click(screen.getByRole("option", { name: /Space Grotesk PomoKit/ }))

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-font", "space")
      expect(localStorage.getItem(STORAGE_KEYS.font)).toBe('"space"')
    })
  })

  it("applies and persists newly available font options", async () => {
    render(
      <FontProvider>
        <FontPicker />
      </FontProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Font: Plus Jakarta Sans" }))
    fireEvent.click(screen.getByRole("option", { name: /Nunito Sans PomoKit/ }))

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("data-font", "nunito-sans")
      expect(localStorage.getItem(STORAGE_KEYS.font)).toBe('"nunito-sans"')
    })
  })
})
