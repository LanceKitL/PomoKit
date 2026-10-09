"use client"

import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  Trash2,
} from "lucide-react"

import Link from "next/link"

import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import AppHeader from "@/components/layout/app-header"

import Button from "@/components/ui/button"

import Card from "@/components/ui/card"

import { FieldLabel, Input, Select } from "@/components/ui/field"

import type {
  AssistantProvider,
  AssistantTestResponse,
} from "@/features/assistant/assistant.types"

import { assistantSessionRepository } from "../assistant-session.repository"

type ConnectionState = "idle" | "verifying" | "saving" | "verified" | "saved" | "error"

type ActionDialogState = {
  action: "verify" | "save"
  phase: "working" | "complete" | "error"
  message: string
}

const providerLabels: Record<AssistantProvider, string> = {
  openrouter: "OpenRouter",

  nvidia_nim: "NVIDIA NIM",
}

export default function AssistantSettings() {
  const [provider, setProvider] = useState<AssistantProvider>("openrouter")

  const [apiKey, setApiKey] = useState("")

  const [revealed, setRevealed] = useState(false)

  const [state, setState] = useState<ConnectionState>("idle")

  const [message, setMessage] = useState("")

  const [actionDialog, setActionDialog] = useState<ActionDialogState | null>(
    null,
  )

  const [portalReady, setPortalReady] = useState(false)

  const actionDialogRef = useRef<HTMLDivElement>(null)

  const actionDialogStateRef = useRef<ActionDialogState | null>(null)

  const [verifiedCredentials, setVerifiedCredentials] = useState<{
    provider: AssistantProvider

    apiKey: string
  } | null>(null)

  const [savedCredentials, setSavedCredentials] = useState<{
    provider: AssistantProvider

    apiKey: string
  } | null>(null)

  useEffect(() => {
    setPortalReady(true)

    const session = assistantSessionRepository.load()

    if (!session) return

    setProvider(session.provider)

    setApiKey(session.apiKey)

    setSavedCredentials({
      provider: session.provider,

      apiKey: session.apiKey,
    })

    setState("saved")

    setMessage(
      `${providerLabels[session.provider]} key saved for this session.`,
    )
  }, [])

  actionDialogStateRef.current = actionDialog

  useEffect(() => {
    if (!actionDialog) return

    const dialog = actionDialogRef.current
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    dialog?.focus()

    function handleKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        if (actionDialogStateRef.current?.phase !== "working") {
          setActionDialog(null)
        }
        return
      }

      if (event.key !== "Tab") return

      const focusable = Array.from(
        dialog?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ??
          [],
      )
      if (!focusable.length) {
        event.preventDefault()
        dialog?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeys)
    return () => {
      document.removeEventListener("keydown", handleKeys)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [Boolean(actionDialog)])

  const credentialsVerified =
    verifiedCredentials?.provider === provider &&
    verifiedCredentials.apiKey === apiKey.trim()

  async function verifyConnection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const keyToVerify = apiKey.trim()

    if (keyToVerify.length < 10) {
      setState("error")

      setMessage("Enter a valid provider API key before verifying.")

      setActionDialog({
        action: "verify",
        phase: "error",
        message: "Enter a valid provider API key before verifying.",
      })

      return
    }

    setState("verifying")

    setMessage("")

    setVerifiedCredentials(null)
    setActionDialog({
      action: "verify",
      phase: "working",
      message: "Running a short test prompt on the selected model…",
    })
    const progressStartedAt = Date.now()
    const ensureProgressVisible = () =>
      new Promise<void>((resolve) => {
        window.setTimeout(
          resolve,
          Math.max(0, 250 - (Date.now() - progressStartedAt)),
        )
      })

    try {
      const response = await fetch("/api/assistant/test", {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ provider, apiKey: keyToVerify }),
      })

      const result = (await response.json()) as AssistantTestResponse
      await ensureProgressVisible()

      if (!result.ok) {
        setState("error")

        setMessage(result.message)

        setActionDialog({
          action: "verify",
          phase: "error",
          message: result.message,
        })

        return
      }

      if (result.provider !== provider) {
        setState("error")

        setMessage("The provider response did not match your selection.")

        setActionDialog({
          action: "verify",
          phase: "error",
          message: "The provider response did not match your selection.",
        })

        return
      }

      setVerifiedCredentials({ provider, apiKey: keyToVerify })

      setState("verified")

      setMessage(`${providerLabels[provider]} key verified.`)
      setActionDialog({
        action: "verify",
        phase: "complete",
        message: `${providerLabels[provider]} key verified.`,
      })
    } catch {
      await ensureProgressVisible()
      setState("error")

      setMessage(
        "Unable to verify the connection. Check your network and try again.",
      )
      setActionDialog({
        action: "verify",
        phase: "error",
        message: "Unable to verify. Check your network and try again.",
      })
    }
  }

  async function saveConnection() {
    if (!credentialsVerified || !verifiedCredentials) return

    setState("saving")
    setMessage("")
    setActionDialog({
      action: "save",
      phase: "working",
      message: "Saving your key for this session…",
    })

    await new Promise((resolve) => window.setTimeout(resolve, 250))

    try {
      assistantSessionRepository.save({
        version: 1,

        provider,

        apiKey: verifiedCredentials.apiKey,
      })

      setSavedCredentials({
        provider,

        apiKey: verifiedCredentials.apiKey,
      })

      setState("saved")

      setMessage("Key saved for this session.")
      setActionDialog({
        action: "save",
        phase: "complete",
        message: "Key saved for this session.",
      })
    } catch {
      setState("error")

      const errorMessage =
        "The key was verified, but this browser could not save it for the session."
      setMessage(errorMessage)
      setActionDialog({
        action: "save",
        phase: "error",
        message: errorMessage,
      })
    }
  }

  function updateProvider(value: string) {
    if (value !== "openrouter" && value !== "nvidia_nim") return

    setProvider(value)

    setVerifiedCredentials(null)

    setState("idle")

    setMessage("")
  }

  function updateApiKey(value: string) {
    setApiKey(value)

    setVerifiedCredentials(null)

    setState("idle")

    setMessage("")
  }

  function removeToken() {
    try {
      assistantSessionRepository.clear()

      setApiKey("")

      setVerifiedCredentials(null)

      setSavedCredentials(null)

      setState("idle")

      setMessage("Saved key removed.")
    } catch {
      setState("error")

      setMessage("This browser could not remove the saved API key.")
    }
  }

  const hasSavedKey =
    savedCredentials !== null &&
    savedCredentials.provider === provider &&
    savedCredentials.apiKey === apiKey.trim()

  return (
    <main className="min-h-[100svh] bg-canvas px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-4">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col">
        <AppHeader />

        <header className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-xs font-extrabold tracking-wide text-primary-strong uppercase">
              Assistant connection
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              AI provider
            </h1>
            <p className="mt-1 text-sm leading-6 text-muted">
              Connect a key for Research, Writing, and Teach me.
            </p>
          </div>
          <Link
            href="/focus"
            className="interactive inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted hover:bg-surface hover:text-ink"
          >
            Return to focus
          </Link>
        </header>

        <div className="mt-4 grid gap-4 lg:flex-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch">
          <Card className="p-4 sm:p-5">
            <form
              className="flex h-full flex-col gap-4"
              onSubmit={verifyConnection}
            >
              <div>
                <FieldLabel htmlFor="provider">Provider</FieldLabel>
                <Select
                  id="provider"
                  value={provider}
                  disabled={state === "verifying" || state === "saving"}
                  onChange={(event) => updateProvider(event.target.value)}
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="nvidia_nim">NVIDIA NIM</option>
                </Select>
              </div>

              <div>
                <FieldLabel htmlFor="api-key">API key</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    name="api-key"
                    className="min-w-0 flex-1"
                    type={revealed ? "text" : "password"}
                    autoComplete="new-password"
                    value={apiKey}
                    onChange={(event) => updateApiKey(event.target.value)}
                    placeholder={
                      provider === "openrouter" ? "sk-or-v1-…" : "nvapi-…"
                    }
                    minLength={10}
                    maxLength={512}
                    disabled={state === "verifying" || state === "saving"}
                    required
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label={revealed ? "Hide API key" : "Show API key"}
                    onClick={() => setRevealed((value) => !value)}
                    disabled={state === "verifying" || state === "saving"}
                  >
                    {revealed ? (
                      <EyeOff aria-hidden="true" size={18} />
                    ) : (
                      <Eye aria-hidden="true" size={18} />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Verify runs a short model request. Provider usage limits may
                  apply.
                </p>
              </div>

              {message ? (
                <div
                  role={state === "error" ? "alert" : "status"}
                  aria-live={state === "error" ? "assertive" : "polite"}
                  className={
                    state === "error"
                      ? "flex items-start gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm font-semibold leading-6 text-danger"
                      : "flex items-start gap-2 rounded-xl border border-line bg-sage/35 p-3 text-sm font-semibold leading-6 text-ink"
                  }
                >
                  {state !== "error" ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-primary-strong"
                      size={17}
                    />
                  ) : null}
                  <span>{message}</span>
                </div>
              ) : null}

              <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
                <div className="flex flex-col gap-2 min-[420px]:flex-row">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={
                      state === "verifying" ||
                      state === "saving" ||
                      apiKey.trim().length < 10
                    }
                  >
                    {state === "verifying" ? "Verifying…" : "Verify"}
                  </Button>
                  <Button
                    type="button"
                    onClick={saveConnection}
                    disabled={!credentialsVerified || hasSavedKey}
                  >
                    {hasSavedKey ? "Saved" : "Save"}
                  </Button>
                </div>
                {savedCredentials ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="sm:ms-auto"
                    onClick={removeToken}
                  >
                    <Trash2 aria-hidden="true" size={17} />
                    Remove saved key
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="flex min-h-0 flex-col gap-4">
            <section
              aria-labelledby="session-key-heading"
              className="rounded-3xl bg-primary p-4 text-on-accent sm:p-5"
            >
              <h2 id="session-key-heading" className="text-lg font-extrabold">
                Session-only key
              </h2>
              <p className="mt-2 text-sm leading-6 text-on-accent/85">
                Your API key stays in this browser tab&apos;s session storage
                and is cleared when the session ends. It is never stored in
                local storage or included in a URL. PomoKit sends it with a
                short test prompt only when you select Verify; saving keeps it
                available for this session.
              </p>
            </section>

            <section
              aria-labelledby="assistant-tools-heading"
              className="flex-1 rounded-3xl border border-line bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2
                  id="assistant-tools-heading"
                  className="text-lg font-extrabold"
                >
                  Planned tools
                </h2>
                <p className="text-xs font-bold text-muted">Coming soon</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <ToolPurpose
                  title="Research"
                  description="Find and summarize information."
                />
                <ToolPurpose
                  title="Writing"
                  description="Draft and refine text."
                />
                <ToolPurpose
                  title="Teach me"
                  description="Learn topics step by step."
                />
              </div>
            </section>
          </div>
        </div>
      </div>
      {portalReady && actionDialog
        ? createPortal(
            <ActionProgressDialog
              dialogRef={actionDialogRef}
              action={actionDialog}
              onClose={() => setActionDialog(null)}
            />,
            document.body,
          )
        : null}
    </main>
  )
}

function ActionProgressDialog({
  dialogRef,
  action,
  onClose,
}: {
  dialogRef: React.RefObject<HTMLDivElement | null>
  action: ActionDialogState
  onClose: () => void
}) {
  useEffect(() => {
    if (action.phase !== "working") {
      dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
    }
  }, [action.phase, dialogRef])

  const title =
    action.phase === "working"
      ? action.action === "verify"
        ? "Verifying API key"
        : "Saving API key"
      : action.phase === "complete"
        ? action.action === "verify"
          ? "Verification complete"
          : "Key saved"
        : action.action === "verify"
          ? "Verification failed"
          : "Could not save key"

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/45 px-4 py-6 backdrop-blur-sm">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-busy={action.phase === "working"}
        aria-labelledby="assistant-action-title"
        aria-describedby="assistant-action-message"
        className="w-full max-w-md rounded-3xl border border-line bg-surface p-5 paper-shadow outline-none sm:p-7"
      >
        <div className="flex items-start gap-4">
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
              action.phase === "error"
                ? "bg-danger/10 text-danger"
                : "bg-primary/20 text-primary-strong"
            }`}
          >
            {action.phase === "working" ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : action.phase === "complete" ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <CircleAlert aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="assistant-action-title"
              aria-live="polite"
              className="font-display text-2xl font-semibold tracking-tight"
            >
              {title}
            </h2>
            <p
              id="assistant-action-message"
              role={action.phase === "working" ? "status" : undefined}
              aria-live={action.phase === "working" ? "polite" : undefined}
              className="mt-2 text-sm leading-6 text-muted"
            >
              {action.message}
            </p>
          </div>
        </div>

        {action.phase === "working" ? (
          <div
            role="progressbar"
            aria-label={
              action.action === "verify"
                ? "Verifying API key"
                : "Saving API key"
            }
            aria-valuetext="In progress"
            className="mt-6 h-2 overflow-hidden rounded-full bg-primary/20"
          >
            <div className="assistant-progress-indicator h-full rounded-full bg-primary" />
          </div>
        ) : (
          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ToolPurpose({
  title,

  description,
}: {
  title: string

  description: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-extrabold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
    </div>
  )
}
