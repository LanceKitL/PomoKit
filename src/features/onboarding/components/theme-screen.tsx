"use client"

import { ArrowRight, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import Brand from "@/components/layout/brand"
import Button from "@/components/ui/button"
import { ThemeSwatches } from "@/components/ui/theme-picker"
import { cn } from "@/lib/cn"
import { defaultThemeName, isThemeName, themeOptions } from "@/lib/themes"
import { localOnboardingRepository } from "../onboarding.repository"

export default function ThemeScreen() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const selected = isThemeName(theme) ? theme : defaultThemeName

  function continueToApp() {
    localOnboardingRepository.complete()
    router.push("/focus")
  }

  return (
    <main className="min-h-screen bg-canvas px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header>
          <Brand />
        </header>
        <section className="mx-auto max-w-3xl py-16 text-center sm:py-24">
          <p className="text-sm font-extrabold tracking-[0.16em] text-primary-strong uppercase">
            Make it yours
          </p>
          <h1 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Choose your focus atmosphere
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-8 text-muted">
            Start with a mood that fits your work. You can switch anytime from
            settings.
          </p>
          <div className="mt-8 grid gap-3 text-start sm:grid-cols-2">
            {themeOptions.map((option) => {
              const { Icon } = option
              const isSelected = option.value === selected
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "interactive relative min-h-40 rounded-2xl border-2 bg-surface p-4 text-start paper-shadow sm:min-h-44 sm:p-5",
                    isSelected
                      ? "border-primary-strong"
                      : "border-transparent hover:border-line",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className="grid size-11 place-items-center rounded-xl bg-lavender text-on-accent"
                      aria-hidden="true"
                    >
                      <Icon size={22} />
                    </span>
                    {isSelected && (
                      <span className="grid size-8 place-items-center rounded-full bg-primary text-on-accent">
                        <Check aria-hidden="true" size={17} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="mt-5 block text-lg font-extrabold">
                    {option.label}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-muted">
                    {option.description}
                  </span>
                  <span className="mt-4 flex">
                    <ThemeSwatches value={option.value} size="lg" />
                  </span>
                </button>
              )
            })}
          </div>
          <div className="sticky bottom-4 z-10 mt-6 flex justify-center rounded-2xl bg-canvas/85 p-2 backdrop-blur-md">
            <Button size="lg" onClick={continueToApp}>
              Continue to PomoKit
              <ArrowRight aria-hidden="true" size={19} />
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
