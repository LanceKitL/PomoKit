"use client"

import {
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import AppHeader from "@/components/layout/app-header"
import Button from "@/components/ui/button"
import Card from "@/components/ui/card"
import { FieldLabel, Input, Select } from "@/components/ui/field"
import type {
  AssistantProvider,
  AssistantTestResponse,
} from "@/features/assistant/assistant.types"
import { assistantSessionRepository } from "../assistant-session.repository"

type ConnectionState = "idle" | "testing" | "connected" | "error"

export default function AssistantSettings() {
  const [provider, setProvider] = useState<AssistantProvider>("openrouter")
  const [apiKey, setApiKey] = useState("")
  const [revealed, setRevealed] = useState(false)
  const [state, setState] = useState<ConnectionState>("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const session = assistantSessionRepository.load()
    if (session) {
      setProvider(session.provider)
      setApiKey(session.apiKey)
      setState("connected")
      setMessage("Token is available for this browser session.")
    }
  }, [])

  async function testConnection(event: React.FormEvent) {
    event.preventDefault()
    setState("testing")
    setMessage("")
    try {
      const response = await fetch("/api/assistant/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      })
      const result = (await response.json()) as AssistantTestResponse
      if (!result.ok) {
        setState("error")
        setMessage(result.message)
        return
      }
      assistantSessionRepository.save({ version: 1, provider, apiKey })
      setState("connected")
      setMessage("Connection verified. Your token is ready for this session.")
    } catch {
      setState("error")
      setMessage(
        "Unable to test the connection. Check your network and try again.",
      )
    }
  }

  function removeToken() {
    assistantSessionRepository.clear()
    setApiKey("")
    setState("idle")
    setMessage("Token removed from this browser session.")
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-5 sm:px-7 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <AppHeader />
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <section className="px-2 py-5 lg:sticky lg:top-6">
            <span className="grid size-14 place-items-center rounded-2xl bg-peach text-on-accent">
              <Bot aria-hidden="true" size={26} />
            </span>
            <p className="mt-7 text-sm font-bold text-primary-strong">
              Bring my Assistant
            </p>
            <h1 className="mt-2 text-balance font-display text-4xl font-semibold tracking-tight">
              Your provider. Your token.
            </h1>
            <p className="mt-4 text-pretty leading-7 text-muted">
              Connect OpenRouter or NVIDIA NIM now. Assistant chat is coming in
              the next milestone.
            </p>
            <Link
              href="/focus"
              className="mt-7 inline-flex min-h-11 items-center rounded-xl font-bold text-primary-strong hover:underline"
            >
              Return to focus
            </Link>
          </section>

          <Card className="p-6 sm:p-8">
            <div className="flex items-start gap-3 rounded-2xl bg-lavender p-4 text-on-accent">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={21}
              />
              <div>
                <p className="font-extrabold">Session-only by design</p>
                <p className="mt-1 text-sm leading-6 text-on-accent/75">
                  Your token is kept in this tab’s browser session and sent only
                  to PomoKit’s server-side provider check. It is not written to
                  local storage or server logs.
                </p>
              </div>
            </div>

            <form className="mt-7 space-y-5" onSubmit={testConnection}>
              <div>
                <FieldLabel htmlFor="provider">Provider</FieldLabel>
                <Select
                  id="provider"
                  value={provider}
                  onChange={(event) => {
                    setProvider(event.target.value as AssistantProvider)
                    setState("idle")
                  }}
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="nvidia_nim">NVIDIA NIM</option>
                </Select>
              </div>
              <div>
                <FieldLabel htmlFor="api-key">Provider token</FieldLabel>
                <div className="relative">
                  <KeyRound
                    aria-hidden="true"
                    className="absolute start-4 top-1/2 -translate-y-1/2 text-muted"
                    size={18}
                  />
                  <Input
                    id="api-key"
                    name="api-key"
                    className="px-11"
                    type={revealed ? "text" : "password"}
                    autoComplete="new-password"
                    value={apiKey}
                    onChange={(event) => {
                      setApiKey(event.target.value)
                      setState("idle")
                    }}
                    placeholder={
                      provider === "openrouter" ? "sk-or-v1-…" : "nvapi-…"
                    }
                    minLength={10}
                    maxLength={512}
                    required
                  />
                  <button
                    type="button"
                    className="interactive absolute end-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink"
                    aria-label={revealed ? "Hide token" : "Show token"}
                    onClick={() => setRevealed((value) => !value)}
                  >
                    {revealed ? (
                      <EyeOff aria-hidden="true" size={18} />
                    ) : (
                      <Eye aria-hidden="true" size={18} />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Free-tier tokens are supported. Provider usage limits still
                  apply.
                </p>
              </div>

              {message && (
                <div
                  role={state === "error" ? "alert" : "status"}
                  className={`flex items-start gap-2 rounded-xl p-3 text-sm font-semibold ${
                    state === "error"
                      ? "bg-danger text-danger-ink"
                      : "bg-sage text-on-accent"
                  }`}
                >
                  {state === "connected" && (
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      size={17}
                    />
                  )}
                  {message}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={state === "testing" || apiKey.trim().length < 10}
                >
                  {state === "testing"
                    ? "Testing connection…"
                    : "Test and save for session"}
                </Button>
                {apiKey && (
                  <Button type="button" variant="ghost" onClick={removeToken}>
                    <Trash2 aria-hidden="true" size={17} />
                    Remove token
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </main>
  )
}
