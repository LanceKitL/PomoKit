"use client"

import { RotateCcw, Save, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import AppHeader from "@/components/layout/app-header"
import Button from "@/components/ui/button"
import Card from "@/components/ui/card"
import { FieldLabel, Input } from "@/components/ui/field"
import ThemePicker from "@/components/ui/theme-picker"
import { localOnboardingRepository } from "@/features/onboarding/onboarding.repository"
import { localNotesRepository } from "@/features/notes/local-notes.repository"
import { localTasksRepository } from "@/features/tasks/local-tasks.repository"
import { localTimerRepository } from "@/features/timer/local-timer.repository"
import { localPreferencesRepository } from "../local-preferences.repository"
import { defaultPreferences, type Preferences } from "../preferences.model"

export default function PreferencesScreen() {
  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences)
  const [saved, setSaved] = useState(false)

  useEffect(() => setPreferences(localPreferencesRepository.load()), [])

  function update(key: keyof Omit<Preferences, "version">, value: string) {
    setSaved(false)
    setPreferences((current) => ({
      ...current,
      [key]: Math.max(1, Math.min(120, Number(value) || 1)),
    }))
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    localPreferencesRepository.save(preferences)
    setSaved(true)
  }

  function resetAll() {
    if (
      !window.confirm(
        "Reset onboarding, notes, tasks, timer, and preferences on this device?",
      )
    )
      return
    localPreferencesRepository.reset()
    localNotesRepository.reset()
    localTasksRepository.removeAll()
    localTimerRepository.clear()
    localOnboardingRepository.reset()
    window.location.assign("/")
  }

  return (
    <main className="min-h-screen bg-canvas px-4 py-5 sm:px-7 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <AppHeader />
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <section className="px-2 py-5">
            <span className="grid size-14 place-items-center rounded-2xl bg-peach text-on-accent">
              <SlidersHorizontal aria-hidden="true" size={25} />
            </span>
            <p className="mt-7 text-sm font-bold text-primary-strong">
              Preferences
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
              Shape your rhythm
            </h1>
            <p className="mt-4 leading-7 text-muted">
              Adjust session lengths without turning focus into another
              complicated system.
            </p>
            <Link
              href="/focus"
              className="mt-7 inline-flex min-h-11 items-center rounded-xl font-bold text-primary-strong hover:underline"
            >
              Return to focus
            </Link>
          </section>
          <div className="space-y-6">
            <Card className="p-6 sm:p-8">
              <form onSubmit={save}>
                <h2 className="text-xl font-extrabold">Timer and theme</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="theme">Theme</FieldLabel>
                    <ThemePicker id="theme" className="w-full" variant="full" />
                  </div>
                  <NumberField
                    id="focus"
                    label="Focus minutes"
                    value={preferences.focusMinutes}
                    onChange={(value) => update("focusMinutes", value)}
                  />
                  <NumberField
                    id="short-break"
                    label="Short break minutes"
                    value={preferences.shortBreakMinutes}
                    onChange={(value) => update("shortBreakMinutes", value)}
                  />
                  <NumberField
                    id="long-break"
                    label="Long break minutes"
                    value={preferences.longBreakMinutes}
                    onChange={(value) => update("longBreakMinutes", value)}
                  />
                  <NumberField
                    id="cycle"
                    label="Focus sessions before long break"
                    value={preferences.sessionsBeforeLongBreak}
                    onChange={(value) =>
                      update("sessionsBeforeLongBreak", value)
                    }
                  />
                </div>
                <div className="mt-7 flex items-center gap-4">
                  <Button type="submit">
                    <Save aria-hidden="true" size={17} />
                    Save preferences
                  </Button>
                  {saved && (
                    <span className="text-sm font-bold text-muted">Saved</span>
                  )}
                </div>
              </form>
            </Card>
            <Card className="p-6 sm:p-8">
              <h2 className="text-xl font-extrabold">Start fresh</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Clear tasks, timer progress, preferences, and onboarding data
                stored on this device. Assistant tokens are session-only and are
                not included.
              </p>
              <Button className="mt-5" variant="danger" onClick={resetAll}>
                <RotateCcw aria-hidden="true" size={17} />
                Reset local data
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: number
  onChange: (value: string) => void
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={120}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
