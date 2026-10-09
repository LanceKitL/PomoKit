"use client"

import { ArrowRight, Check, Circle } from "lucide-react"
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
    <main className="relative isolate min-h-screen overflow-hidden bg-canvas px-5 py-5 sm:px-8 sm:py-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-48 -top-56 -z-10 size-[38rem] rounded-full border border-primary/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-32 -top-40 -z-10 size-[30rem] rounded-full bg-peach/45 blur-3xl"
      />
      <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <p className="inline-flex min-h-10 items-center gap-2 rounded-full bg-lavender px-3.5 text-sm font-extrabold text-on-accent">
            <Check aria-hidden="true" size={16} strokeWidth={2.75} />
            No account needed
          </p>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">
          <section className="max-w-2xl">
            <p className="mb-5 text-sm font-extrabold tracking-[0.18em] text-primary-strong uppercase">
              A little more focus
            </p>
            <h1 className="text-balance font-display text-5xl leading-[1.03] font-semibold tracking-tight text-ink sm:text-7xl">
              Make room for the work that matters.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted sm:text-xl">
              Keep your next task, a steady timer, and your notes in one
              uncluttered place.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => router.push("/onboarding/theme")}
              >
                Set up your space
                <ArrowRight aria-hidden="true" size={19} />
              </Button>
            </div>
          </section>

          <Preview />
        </div>

        <section
          aria-label="How PomoKit works"
          className="grid gap-5 border-t border-line py-6 sm:grid-cols-3 sm:gap-8 sm:py-7"
        >
          <Step number="01" title="Choose a task" />
          <Step number="02" title="Focus" />
          <Step number="03" title="Take a break" />
        </section>
      </div>
    </main>
  )
}

function Preview() {
  return (
    <section
      aria-label="Sample focus session"
      className="relative mx-auto w-full max-w-lg"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-4 -rotate-2 rounded-[2rem] border border-primary/25"
      />
      <div className="relative rounded-[1.75rem] border border-line bg-surface p-5 paper-shadow sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] text-muted uppercase">
              Sample session
            </p>
            <h2 className="mt-1 text-lg font-extrabold">Focus session</h2>
          </div>
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-surface-raised px-3 text-xs font-bold text-muted">
            <span className="size-2 rounded-full bg-primary" />
            Ready when you are
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-lavender p-5 text-on-accent sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-on-accent/75">
                One session
              </p>
              <p className="timer-digits mt-1 text-6xl leading-none font-extrabold tracking-tight sm:text-7xl">
                25:00
              </p>
            </div>
            <div
              aria-hidden="true"
              className="mb-1 grid size-12 place-items-center rounded-full border-2 border-on-accent/25"
            >
              <span className="size-2 rounded-full bg-primary" />
            </div>
          </div>
          <div className="mt-5 h-1.5 rounded-full bg-on-accent/15" />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface-raised p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-muted">
            <Circle aria-hidden="true" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold tracking-wide text-muted uppercase">
              Next task
            </p>
            <p className="mt-0.5 truncate font-bold">One thing at a time</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 px-1 text-sm">
          <span className="font-bold text-ink">Your notes, close at hand</span>
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

function Step({
  number,
  title,
}: {
  number: string
  title: string
}) {
  return (
    <div className="flex gap-3">
      <span className="pt-0.5 text-xs font-extrabold tracking-wide text-primary-strong">
        {number}
      </span>
      <div>
        <h2 className="font-extrabold">{title}</h2>
      </div>
    </div>
  )
}
