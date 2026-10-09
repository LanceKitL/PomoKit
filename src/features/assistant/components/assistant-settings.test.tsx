import React from "react"

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { STORAGE_KEYS } from "@/lib/storage/storage-keys"

import { assistantSessionRepository } from "../assistant-session.repository"

import AssistantSettings from "./assistant-settings"

vi.mock("@/components/layout/app-header", () => ({
  default: () => null,
}))

vi.mock("@/components/ui/button", async () => {
  const React = await import("react")
  return {
    default: ({
      children,
      variant: _variant,
      size: _size,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: string
      size?: string
    }) => React.createElement("button", props, children),
  }
})

vi.mock("@/components/ui/card", async () => {
  const React = await import("react")
  return {
    default: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) =>
      React.createElement("section", props, children),
  }
})

vi.mock("@/components/ui/field", async () => {
  const React = await import("react")
  return {
    FieldLabel: ({
      children,
      htmlFor,
    }: {
      children: React.ReactNode
      htmlFor: string
    }) => React.createElement("label", { htmlFor }, children),
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
      React.createElement("input", props),
    Select: ({
      children,
      ...props
    }: React.SelectHTMLAttributes<HTMLSelectElement> & {
      children: React.ReactNode
    }) => React.createElement("select", props, children),
  }
})

describe("AssistantSettings", () => {
  beforeEach(() => {
    window.sessionStorage.clear()

    vi.stubGlobal(
      "fetch",

      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, provider: "openrouter" }), {
          status: 200,
        }),
      ),
    )
  })

  afterEach(() => {
    cleanup()

    vi.unstubAllGlobals()

    vi.restoreAllMocks()

    window.sessionStorage.clear()
  })

  it("verifies without saving and requires verification again after key edits", async () => {
    render(<AssistantSettings />)

    const apiKey = screen.getByLabelText("API key")

    const verifyButton = screen.getByRole("button", { name: "Verify" })

    const saveButton = screen.getByRole("button", { name: "Save" })

    fireEvent.change(apiKey, { target: { value: "sk-or-test-token-12345" } })

    expect(saveButton).toBeDisabled()

    fireEvent.click(verifyButton)

    expect(await screen.findByRole("progressbar")).toBeInTheDocument()
    const verificationDialog = await screen.findByRole("dialog")
    await waitFor(() => {
      expect(verificationDialog).toHaveTextContent("Verification complete")
      expect(verificationDialog).toHaveTextContent("OpenRouter key verified.")
    })

    expect(window.sessionStorage.getItem(STORAGE_KEYS.assistant)).toBeNull()
    expect(saveButton).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    fireEvent.click(saveButton)
    expect(await screen.findByRole("progressbar")).toBeInTheDocument()
    const saveDialog = await screen.findByRole("dialog")
    await waitFor(() => {
      expect(saveDialog).toHaveTextContent("Key saved")
    })

    await waitFor(() => {
      const saved = JSON.parse(
        window.sessionStorage.getItem(STORAGE_KEYS.assistant) ?? "null",
      )

      expect(saved).toEqual({
        version: 1,

        provider: "openrouter",

        apiKey: "sk-or-test-token-12345",
      })
    })

    fireEvent.change(apiKey, {
      target: { value: "sk-or-another-test-token-12345" },
    })

    expect(saveButton).toBeDisabled()
  })

  it("shows the provider error in the verification dialog", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: false,
          code: "INVALID_KEY",
          message: "That token was not accepted. Check it and try again.",
        }),
        { status: 401 },
      ),
    )
    render(<AssistantSettings />)

    fireEvent.change(screen.getByLabelText("API key"), {
      target: { value: "sk-or-invalid-token-12345" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Verify" }))

    const dialog = await screen.findByRole("dialog")
    await waitFor(() => {
      expect(dialog).toHaveTextContent("Verification failed")
      expect(dialog).toHaveTextContent(
        "That token was not accepted. Check it and try again.",
      )
    })
    expect(dialog.querySelector('[role="progressbar"]')).toBeNull()
    expect(window.sessionStorage.getItem(STORAGE_KEYS.assistant)).toBeNull()
  })

  it("shows a save error if session storage cannot persist the key", async () => {
    vi.spyOn(assistantSessionRepository, "save").mockImplementation(() => {
      throw new Error("Storage is unavailable.")
    })
    render(<AssistantSettings />)

    fireEvent.change(screen.getByLabelText("API key"), {
      target: { value: "sk-or-test-token-12345" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Verify" }))

    const verifyDialog = await screen.findByRole("dialog")
    await waitFor(() => {
      expect(verifyDialog).toHaveTextContent("Verification complete")
    })
    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    const saveDialog = await screen.findByRole("dialog")
    await waitFor(() => {
      expect(saveDialog).toHaveTextContent("Could not save key")
      expect(saveDialog).toHaveTextContent(
        "The key was verified, but this browser could not save it for the session.",
      )
    })
  })
})
