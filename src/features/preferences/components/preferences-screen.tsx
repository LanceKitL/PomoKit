"use client"

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Minus,
  Plus,
  RotateCcw,
  Save,
  X,
} from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { createPortal } from "react-dom"
import { useEffect, useRef, useState } from "react"
import AppHeader from "@/components/layout/app-header"
import Button from "@/components/ui/button"
import Card from "@/components/ui/card"
import { FieldLabel, Input } from "@/components/ui/field"
import FontPicker from "@/components/ui/font-picker"
import ThemePicker from "@/components/ui/theme-picker"
import { defaultThemeName } from "@/lib/themes"
import { useSoundSettings } from "@/providers/sound-provider"
import { localOnboardingRepository } from "@/features/onboarding/onboarding.repository"
import { localNotesRepository } from "@/features/notes/local-notes.repository"
import { localTasksRepository } from "@/features/tasks/local-tasks.repository"
import { localTimerRepository } from "@/features/timer/local-timer.repository"
import { localFontRepository } from "../local-font.repository"
import { localPreferencesRepository } from "../local-preferences.repository"
import { defaultPreferences, type Preferences } from "../preferences.model"

type DurationKey = Exclude<keyof Preferences, "version" | "soundEnabled">
type DurationDraft = Record<DurationKey, string>

function durationDraftFrom(preferences: Preferences): DurationDraft {
  return {
    focusMinutes: String(preferences.focusMinutes),
    shortBreakMinutes: String(preferences.shortBreakMinutes),
    longBreakMinutes: String(preferences.longBreakMinutes),
    sessionsBeforeLongBreak: String(preferences.sessionsBeforeLongBreak),
  }
}

export default function PreferencesScreen() {
  const { setTheme } = useTheme()
  const { soundEnabled, setSoundEnabled } = useSoundSettings()
  const prefersReducedMotion = useReducedMotion()
  const [durationDraft, setDurationDraft] = useState<DurationDraft>(() =>
    durationDraftFrom(defaultPreferences),
  )
  const [toastMessage, setToastMessage] = useState("")
  const [portalReady, setPortalReady] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const resetDialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localPreferencesRepository.load()
    setDurationDraft(durationDraftFrom(stored))
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!toastMessage) return
    const timeout = window.setTimeout(() => setToastMessage(""), 3000)
    return () => window.clearTimeout(timeout)
  }, [toastMessage])

  useEffect(() => {
    if (!resetDialogOpen) return

    const dialog = resetDialogRef.current
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    dialog?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus()

    function handleKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        setResetDialogOpen(false)
        return
      }
      if (event.key !== "Tab") return

      const focusable = Array.from(
        dialog?.querySelectorAll<HTMLButtonElement>(
          "button:not([disabled])",
        ) ?? [],
      )
      if (!focusable.length) return
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

    dialog?.addEventListener("keydown", handleKeys)
    return () => {
      dialog?.removeEventListener("keydown", handleKeys)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [resetDialogOpen])

  function update(key: DurationKey, value: string) {
    setToastMessage("")
    setDurationDraft((current) => ({ ...current, [key]: value }))
  }

  function stepDuration(key: DurationKey, amount: number) {
    const current = Number(durationDraft[key])
    update(key, String(Math.max(1, Math.min(120, current + amount))))
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    const values = Object.values(durationDraft).map(Number)
    if (
      values.some(
        (value) => !Number.isInteger(value) || value < 1 || value > 120,
      )
    ) {
      return
    }
    const next: Preferences = {
      version: 1,
      focusMinutes: Number(durationDraft.focusMinutes),
      shortBreakMinutes: Number(durationDraft.shortBreakMinutes),
      longBreakMinutes: Number(durationDraft.longBreakMinutes),
      sessionsBeforeLongBreak: Number(durationDraft.sessionsBeforeLongBreak),
      soundEnabled: localPreferencesRepository.load().soundEnabled,
    }
    localPreferencesRepository.save(next)
    setDurationDraft(durationDraftFrom(next))
    setToastMessage("Timer settings saved.")
  }

  function resetAll() {
    setResetDialogOpen(false)
    localPreferencesRepository.reset()
    localFontRepository.reset()
    localNotesRepository.reset()
    localTasksRepository.removeAll()
    localTimerRepository.clear()
    localOnboardingRepository.reset()
    setTheme(defaultThemeName)
    window.location.assign("/")
  }

  return (
    <main className="min-h-[100svh] bg-canvas px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-4">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col">
        <AppHeader />
        <header className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Shape your rhythm
            </h1>
            <p className="mt-1 text-sm leading-6 text-muted">
              Personalize your workspace and timer.
            </p>
          </div>
          <Link
            href="/focus"
            className="interactive inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted hover:bg-surface hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Back to focus
          </Link>
        </header>

        <div className="mt-4 grid gap-4 lg:flex-1 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)] lg:items-stretch xl:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)]">
          <div className="flex flex-col gap-4">
            <Card className="p-4 sm:p-5">
              <section aria-labelledby="appearance-heading">
                <h2
                  id="appearance-heading"
                  className="text-lg font-extrabold tracking-tight"
                >
                  Appearance
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted">
                  Changes apply immediately.
                </p>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="theme">Color theme</FieldLabel>
                    <ThemePicker
                      id="theme"
                      className="w-full"
                      variant="full"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="font">Interface font</FieldLabel>
                    <FontPicker
                      id="font"
                      className="w-full"
                      variant="full"
                    />
                  </div>
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <label
                    htmlFor="sound-effects"
                    className="flex min-h-11 cursor-pointer items-center gap-3"
                  >
                    <input
                      id="sound-effects"
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(event) =>
                        setSoundEnabled(event.target.checked)
                      }
                      className="size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    />
                    <span>
                      <span className="block text-sm font-bold text-ink">
                        Sound effects
                      </span>
                      <span className="block text-sm leading-5 text-muted">
                        Button taps and timer completion.
                      </span>
                    </span>
                  </label>
                </div>
              </section>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-4 lg:flex-col">
                <div className="max-w-xl">
                  <h2 className="text-lg font-extrabold">Reset local data</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Clear tasks, notes, timer progress, and preferences on this
                    device. Assistant session keys are kept.
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setResetDialogOpen(true)}
                >
                  <RotateCcw aria-hidden="true" size={17} />
                  Reset data
                </Button>
              </div>
            </Card>
          </div>

          <Card className="p-4 sm:p-5">
            <form className="flex h-full flex-col" onSubmit={save}>
              <section aria-labelledby="timer-settings-heading">
                <h2
                  id="timer-settings-heading"
                  className="text-lg font-extrabold tracking-tight"
                >
                  Timer sessions
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted">
                  Applies to new sessions.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DurationControl
                    id="focus"
                    label="Focus session (minutes)"
                    value={durationDraft.focusMinutes}
                    onChange={(value) => update("focusMinutes", value)}
                    onStep={(amount) => stepDuration("focusMinutes", amount)}
                  />
                  <DurationControl
                    id="short-break"
                    label="Short break (minutes)"
                    value={durationDraft.shortBreakMinutes}
                    onChange={(value) => update("shortBreakMinutes", value)}
                    onStep={(amount) => stepDuration("shortBreakMinutes", amount)}
                  />
                  <DurationControl
                    id="long-break"
                    label="Long break (minutes)"
                    value={durationDraft.longBreakMinutes}
                    onChange={(value) => update("longBreakMinutes", value)}
                    onStep={(amount) => stepDuration("longBreakMinutes", amount)}
                  />
                  <DurationControl
                    id="cycle"
                    label="Sessions before long break"
                    value={durationDraft.sessionsBeforeLongBreak}
                    onChange={(value) =>
                      update("sessionsBeforeLongBreak", value)
                    }
                    onStep={(amount) =>
                      stepDuration("sessionsBeforeLongBreak", amount)
                    }
                  />
                </div>
              </section>
              <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <Button type="submit">
                  <Save aria-hidden="true" size={17} />
                  Save timer settings
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
      {resetDialogOpen ? (
        createPortal(
          <div
            className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/45 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setResetDialogOpen(false)
              }
            }}
          >
            <div
              ref={resetDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-data-title"
              aria-describedby="reset-data-description"
              className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface paper-shadow"
            >
              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger">
                    <AlertTriangle aria-hidden="true" size={23} />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Close reset confirmation"
                    onClick={() => setResetDialogOpen(false)}
                  >
                    <X aria-hidden="true" size={19} />
                  </Button>
                </div>
                <h2
                  id="reset-data-title"
                  className="mt-5 font-display text-2xl font-semibold tracking-tight"
                >
                  Reset local data?
                </h2>
                <p
                  id="reset-data-description"
                  className="mt-2 text-sm leading-6 text-muted"
                >
                  This permanently clears tasks, notes, timer progress,
                  preferences, theme, font, and onboarding from this device.
                  Assistant tokens are not included.
                </p>
                <div className="mt-5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm font-semibold leading-6 text-danger">
                  This can&apos;t be undone.
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-raised/60 p-4 sm:flex-row sm:justify-end sm:p-5">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setResetDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="w-full sm:w-auto"
                  onClick={resetAll}
                >
                  <RotateCcw aria-hidden="true" size={17} />
                  Reset data
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      ) : null}
      {portalReady
        ? createPortal(
            <AnimatePresence initial={false}>
              {toastMessage ? (
                <motion.div
                  key="timer-settings-saved"
                  role="status"
                  aria-live="polite"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 16, scale: 0.97 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 10, scale: 0.98 }
                  }
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="fixed inset-x-4 bottom-4 z-[70] mx-auto flex min-h-14 max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-bold text-ink paper-shadow sm:inset-x-auto sm:end-6 sm:bottom-6"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage text-on-accent">
                    <Check aria-hidden="true" size={17} strokeWidth={2.75} />
                  </span>
                  {toastMessage}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </main>
  )
}

function DurationControl({
  id,
  label,
  value,
  onChange,
  onStep,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onStep: (amount: number) => void
}) {
  const numericValue = Number(value)
  const valueLabel = label.includes("(minutes)") ? "min" : "sessions"

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="rounded-2xl border border-line bg-surface-raised p-3 sm:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <label
          id={`${id}-label`}
          htmlFor={id}
          className="mb-2 block text-sm font-bold text-ink"
        >
          {label}
        </label>
        <output
          htmlFor={id}
          className="shrink-0 text-end font-display text-3xl leading-none font-semibold tabular-nums text-ink"
        >
          {numericValue}
          <span className="ms-1 font-sans text-sm font-bold text-muted">
            {valueLabel}
          </span>
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={1}
        max={120}
        step={1}
        value={numericValue}
        aria-valuetext={`${numericValue} ${valueLabel}`}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full cursor-pointer accent-primary"
      />
      <div
        className="-mt-1 flex justify-between px-1 text-xs font-semibold text-muted"
        aria-hidden="true"
      >
        <span>1</span>
        <span>30</span>
        <span>60</span>
        <span>90</span>
        <span>120</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <span className="text-xs font-semibold text-muted">
          Adjust by {valueLabel === "min" ? "1 minute" : "1 session"}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={`Decrease ${label}`}
            disabled={numericValue <= 1}
            onClick={() => onStep(-1)}
          >
            <Minus aria-hidden="true" size={16} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={`Increase ${label}`}
            disabled={numericValue >= 120}
            onClick={() => onStep(1)}
          >
            <Plus aria-hidden="true" size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
