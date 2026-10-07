import { describe, expect, it } from "vitest"
import { defaultPreferences } from "@/features/preferences/preferences.model"
import { createTimer, nextPhase, reconcileTimer } from "./timer.model"

describe("timer model", () => {
  it("reconciles a running timer from its wall-clock deadline", () => {
    const timer = {
      ...createTimer(defaultPreferences),
      status: "running" as const,
      remainingSeconds: 30,
      endAt: 31_000,
    }
    expect(
      reconcileTimer(timer, 2_000, defaultPreferences).remainingSeconds,
    ).toBe(29)
  })

  it("moves to a long break after the fourth focus session", () => {
    const timer = {
      ...createTimer(defaultPreferences),
      completedFocusSessions: 3,
    }
    const next = nextPhase(timer, defaultPreferences)
    expect(next.phase).toBe("long_break")
    expect(next.completedFocusSessions).toBe(4)
    expect(next.status).toBe("idle")
  })

  it("moves from any break back to focus", () => {
    const timer = {
      ...createTimer(defaultPreferences),
      phase: "short_break" as const,
    }
    expect(nextPhase(timer, defaultPreferences).phase).toBe("focus")
  })

  it("starts and locks the break when a focus session completes", () => {
    const timer = {
      ...createTimer(defaultPreferences),
      status: "running" as const,
      remainingSeconds: 1,
      endAt: 1_000,
    }

    const next = reconcileTimer(timer, 1_000, defaultPreferences)

    expect(next.phase).toBe("short_break")
    expect(next.status).toBe("running")
    expect(next.breakLocked).toBe(true)
    expect(next.endAt).toBe(301_000)
  })

  it("unlocks after the protected break completes", () => {
    const timer = {
      ...createTimer(defaultPreferences),
      phase: "short_break" as const,
      status: "running" as const,
      breakLocked: true,
      remainingSeconds: 1,
      endAt: 1_000,
    }

    const next = reconcileTimer(timer, 1_000, defaultPreferences)

    expect(next.phase).toBe("focus")
    expect(next.status).toBe("idle")
    expect(next.breakLocked).toBe(false)
  })
})
