"use client"

import { ArrowRight, CheckCircle2, ListTodo, TimerReset } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Brand from "@/components/layout/brand"
import Button from "@/components/ui/button"
import { localOnboardingRepository } from "../onboarding.repository"

export default function WelcomeScreen() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (localOnboardingRepository.isComplete()) {
      router.replace("/focus")
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <main className="min-h-screen bg-canvas" aria-label="Loading PomoKit" />
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-5 py-6 sm:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 decorative-grid opacity-35"
      />
      <div
        aria-hidden="true"
        className="absolute -start-24 top-28 size-80 rounded-full border border-primary/55"
      />
      <div
        aria-hidden="true"
        className="absolute -end-24 -top-16 size-96 rounded-[35%] bg-peach/80"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header>
          <Brand />
        </header>
        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-muted">
              <span className="size-2 rounded-full bg-primary" />A calmer way to
              get things done
            </p>
            <h1 className="text-balance font-display text-5xl leading-[1.02] font-semibold tracking-tight text-ink sm:text-7xl">
              Let&apos;s get it done.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted sm:text-xl">
              Organize what matters, choose one task, and give it your full
              attention.
            </p>
            <Button
              className="mt-9"
              size="lg"
              onClick={() => router.push("/onboarding/theme")}
            >
              Start focusing
              <ArrowRight aria-hidden="true" size={19} />
            </Button>
          </section>
          <aside className="relative mx-auto w-full max-w-md rounded-[2.25rem] bg-surface p-5 paper-shadow sm:p-7">
            <div className="rounded-3xl bg-lavender p-6 text-on-accent">
              <p className="text-sm font-bold text-on-accent/75">
                Today’s focus
              </p>
              <p className="timer-digits mt-2 text-6xl font-extrabold">25:00</p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface/60">
                <div className="h-full w-2/3 rounded-full bg-primary" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Feature icon={<ListTodo size={19} />} label="Clear priorities" />
              <Feature
                icon={<TimerReset size={19} />}
                label="Focused sessions"
              />
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-peach p-4 text-on-accent">
              <CheckCircle2
                aria-hidden="true"
                className="text-on-accent"
                size={22}
              />
              <div>
                <p className="font-bold">One task at a time</p>
                <p className="text-sm text-on-accent/75">
                  Less noise. More momentum.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

interface FeatureProps {
  icon: React.ReactNode
  label: string
}

function Feature({ icon, label }: FeatureProps) {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-2xl bg-surface-raised p-4 font-bold">
      <span
        className="grid size-9 place-items-center rounded-xl bg-canvas text-ink"
        aria-hidden
      >
        {icon}
      </span>
      {label}
    </div>
  )
}
