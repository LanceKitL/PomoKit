"use client"

import { ArrowLeft, ArrowRight, Check, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Brand from "@/components/layout/brand"
import Button from "@/components/ui/button"
import { ThemeSwatches } from "@/components/ui/theme-picker"
import { cn } from "@/lib/cn"
import {
  defaultThemeName,
  isThemeName,
  themeOption,
  themeOptions,
} from "@/lib/themes"
import { localOnboardingRepository } from "../onboarding.repository"

export default function ThemeScreen() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => setReady(true), [])

  if (!ready) {
    return (
      <main
        className="min-h-screen bg-canvas"
        aria-label="Loading theme options"
      />
    )
  }

  const selected = isThemeName(theme) ? theme : defaultThemeName
  const selectedOption = themeOption(selected)
  const appearance = selectedOption.appearance
  const options = themeOptions.filter(
    (option) => option.appearance === appearance,
  )

  function chooseAppearance(value: "light" | "dark") {
    const firstOption = themeOptions.find(
      (option) => option.appearance === value,
    )
    if (firstOption) setTheme(firstOption.value)
  }

  function continueToApp() {
    localOnboardingRepository.complete()
    router.push("/focus")
  }

  return (
    <main className="min-h-screen bg-canvas px-5 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <Link
            href="/"
            className="interactive inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted hover:bg-surface hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Back
          </Link>
        </header>

        <div className="mx-auto max-w-5xl py-10 sm:py-14">
          <div className="mb-7 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-extrabold text-on-accent">
              1
            </span>
            <span className="h-px w-10 bg-line" aria-hidden="true" />
            <p className="text-xs font-extrabold tracking-[0.16em] text-muted uppercase">
              First, make it yours
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:items-start lg:gap-12">
            <section aria-labelledby="theme-title">
              <h1
                id="theme-title"
                className="text-balance font-display text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl"
              >
                Pick a color for your corner.
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted">
                Choose a palette that feels right. You can change it whenever
                you like in Settings.
              </p>

              <div
                role="group"
                aria-label="Palette appearance"
                className="mt-7 inline-flex rounded-xl bg-surface-raised p-1"
              >
                <AppearanceButton
                  value="light"
                  selected={appearance === "light"}
                  onClick={chooseAppearance}
                />
                <AppearanceButton
                  value="dark"
                  selected={appearance === "dark"}
                  onClick={chooseAppearance}
                />
              </div>

              <div
                className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3"
                role="group"
                aria-label={`${appearance === "light" ? "Light" : "Dark"} palettes`}
              >
                {options.map((option) => {
                  const isSelected = option.value === selected
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${option.label}: ${option.description}`}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "interactive flex min-h-[4.5rem] items-center gap-3 rounded-xl border bg-surface px-3 py-3 text-start",
                        isSelected
                          ? "border-primary-strong ring-2 ring-primary/20"
                          : "border-line hover:border-primary/55",
                      )}
                    >
                      <ThemeSwatches value={option.value} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold">
                          {option.label}
                        </span>
                      </span>
                      {isSelected ? (
                        <Check
                          aria-hidden="true"
                          className="shrink-0 text-primary-strong"
                          size={17}
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </section>

            <aside
              aria-label={`Preview of the ${selectedOption.label} palette`}
              aria-live="polite"
              className="rounded-3xl border border-line bg-surface p-4 paper-shadow sm:p-5 lg:sticky lg:top-8"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">
                    Your preview
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold">
                    {selectedOption.label}
                  </h2>
                  <p className="mt-1 max-w-xs text-sm leading-5 text-muted">
                    {selectedOption.description}
                  </p>
                </div>
                <ThemeSwatches value={selected} size="lg" />
              </div>

              <div className="mt-4 rounded-2xl bg-canvas p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-extrabold">Focus session</span>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted">
                    Ready
                  </span>
                </div>
                <p className="timer-digits mt-5 text-center text-6xl font-extrabold tracking-tight text-ink">
                  25:00
                </p>
                <div className="mx-auto mt-4 h-1.5 max-w-48 rounded-full bg-line" />
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-surface p-3">
                  <span className="size-3 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">
                    One thing at a time
                  </span>
                  <span className="rounded-lg bg-lavender px-2 py-1 text-xs font-bold text-on-accent">
                    Next
                  </span>
                </div>
              </div>

              <p className="mt-4 px-1 text-sm leading-6 text-muted">
                The colors update as you browse. Your choice is saved with your
                workspace.
              </p>
            </aside>
          </div>

          <div className="sticky bottom-3 z-10 mt-8 flex items-center justify-between gap-4 rounded-2xl border border-line bg-canvas/90 p-3 backdrop-blur-md">
            <p className="hidden text-sm text-muted sm:block">
              This is easy to change later.
            </p>
            <Button
              size="lg"
              className="ms-auto"
              onClick={continueToApp}
            >
              Continue to focus
              <ArrowRight aria-hidden="true" size={19} />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

function AppearanceButton({
  value,
  selected,
  onClick,
}: {
  value: "light" | "dark"
  selected: boolean
  onClick: (value: "light" | "dark") => void
}) {
  const Icon = value === "light" ? Sun : Moon
  const label = value === "light" ? "Light" : "Dark"
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onClick(value)}
      className={cn(
        "interactive inline-flex min-h-10 min-w-28 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold",
        selected ? "bg-surface text-ink paper-shadow" : "text-muted",
      )}
    >
      <Icon aria-hidden="true" size={16} />
      {label}
    </button>
  )
}
