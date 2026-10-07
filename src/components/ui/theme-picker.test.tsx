import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import ThemePicker from "./theme-picker"

const mockSetTheme = vi.fn()

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
  }),
}))

describe("ThemePicker component", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders trigger button with theme swatches and opens listbox on click", () => {
    render(<ThemePicker />)
    const trigger = screen.getByRole("button", { name: /Theme:/i })
    expect(trigger).toBeInTheDocument()

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("does not close the dropdown menu when scrolling inside the dropdown list", () => {
    render(<ThemePicker />)
    const trigger = screen.getByRole("button", { name: /Theme:/i })
    fireEvent.click(trigger)

    const listbox = screen.getByRole("listbox")
    expect(listbox).toBeInTheDocument()

    // Dispatch scroll event on the dropdown listbox
    fireEvent.scroll(listbox)

    // Listbox should remain open
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("closes the dropdown menu when scrolling on an element outside the theme picker", async () => {
    render(
      <div>
        <div data-testid="outside-container">Outside scrollable content</div>
        <ThemePicker />
      </div>,
    )
    const trigger = screen.getByRole("button", { name: /Theme:/i })
    fireEvent.click(trigger)

    expect(screen.getByRole("listbox")).toBeInTheDocument()

    const outside = screen.getByTestId("outside-container")
    // Dispatch scroll event on outside container
    fireEvent.scroll(outside)

    // Listbox should close
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("updates active option on mouse enter so active and hover states do not overlap", () => {
    render(<ThemePicker />)
    const trigger = screen.getByRole("button", { name: /Theme:/i })
    fireEvent.click(trigger)

    const options = screen.getAllByRole("option")
    expect(options[0]).toHaveAttribute("tabindex", "0")
    expect(options[1]).toHaveAttribute("tabindex", "-1")

    fireEvent.mouseEnter(options[1])
    expect(options[0]).toHaveAttribute("tabindex", "-1")
    expect(options[1]).toHaveAttribute("tabindex", "0")
  })

  it("selects a theme when an option is clicked", async () => {
    render(<ThemePicker />)
    const trigger = screen.getByRole("button", { name: /Theme:/i })
    fireEvent.click(trigger)

    const options = screen.getAllByRole("option")
    expect(options.length).toBeGreaterThan(0)

    fireEvent.click(options[1])
    expect(mockSetTheme).toHaveBeenCalledWith(
      options[1].getAttribute("id")?.replace(/^.*?-/, ""),
    )
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })
})
