import { describe, expect, it } from "vitest"
import { defaultPreferences } from "@/features/preferences/preferences.model"
import {
  createTimer,
  formatTimerTabTitle,
  nextPhase,
  reconcileTimer,
  resolveFocusCheckIn,
} from "./timer.model"

describe("timer model", () => {
  it("formats the browser tab title for live, paused, and completed timers", () => {
    const timer = {
      ...createTimer(defaultPreferences),
      remainingSeconds: 1_445,
    }

    expect(formatTimerTabTitle(timer)).toBe("24:05 · Focus | PomoKit")
    expect(
      formatTimerTabTitle({ ...timer, status: "paused" }),
    ).toBe("Paused · 24:05 · Focus | PomoKit")
    expect(formatTimerTabTitle(timer, true)).toBe("Time's up! | PomoKit")
  })

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

  it("waits for a check-in when a focus session completes", () => {
    const timer = {
      ...createTimer(defaultPreferences),
      status: "running" as const,
      remainingSeconds: 1,
      endAt: 1_000,
    }

    const next = reconcileTimer(timer, 1_000, defaultPreferences)

    expect(next.phase).toBe("short_break")
    expect(next.status).toBe("idle")
    expect(next.breakLocked).toBe(false)
    expect(next.checkInPending).toBe(true)
    expect(next.endAt).toBeNull()
  })

  it("starts another focus session when the user chooses to keep working", () => {
    const pending = {
      ...nextPhase(createTimer(defaultPreferences), defaultPreferences),
      checkInPending: true,
    }
    const next = resolveFocusCheckIn(
      pending,
      "continue",
      defaultPreferences,
      10_000,
    )

    expect(next.phase).toBe("focus")
    expect(next.status).toBe("running")
    expect(next.endAt).toBe(10_000 + defaultPreferences.focusMinutes * 60_000)
    expect(next.checkInPending).toBe(false)
  })

  it("starts and locks the configured break after a completed task", () => {
    const pending = {
      ...nextPhase(createTimer(defaultPreferences), defaultPreferences),
      checkInPending: true,
    }
    const next = resolveFocusCheckIn(
      pending,
      "complete",
      defaultPreferences,
      10_000,
    )

    expect(next.phase).toBe("short_break")
    expect(next.status).toBe("running")
    expect(next.breakLocked).toBe(true)
    expect(next.endAt).toBe(
      10_000 + defaultPreferences.shortBreakMinutes * 60_000,
    )
    expect(next.checkInPending).toBe(false)
  })

  it("allows the user to dismiss a check-in without starting a timer", () => {
    const pending = {
      ...nextPhase(createTimer(defaultPreferences), defaultPreferences),
      checkInPending: true,
    }
    const next = resolveFocusCheckIn(
      pending,
      "dismiss",
      defaultPreferences,
      10_000,
    )

    expect(next.phase).toBe("short_break")
    expect(next.status).toBe("idle")
    expect(next.endAt).toBeNull()
    expect(next.checkInPending).toBe(false)
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
