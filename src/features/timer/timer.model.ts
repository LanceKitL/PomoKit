import type { Preferences } from "@/features/preferences/preferences.model"

export type TimerPhase = "focus" | "short_break" | "long_break"
export type TimerStatus = "idle" | "running" | "paused"

export type TimerState = {
  version: 1
  phase: TimerPhase
  status: TimerStatus
  remainingSeconds: number
  endAt: number | null
  completedFocusSessions: number
  activeTaskId: string | null
  breakLocked: boolean
  checkInPending: boolean
}

export function formatTimerTabTitle(timer: TimerState, timeUp = false) {
  if (timeUp) return "Time's up! | PomoKit"

  const minutes = Math.floor(timer.remainingSeconds / 60)
  const seconds = timer.remainingSeconds % 60
  const remaining = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  const phaseLabel = {
    focus: "Focus",
    short_break: "Short break",
    long_break: "Long break",
  }[timer.phase]
  const status = timer.status === "paused" ? "Paused · " : ""
  return `${status}${remaining} · ${phaseLabel} | PomoKit`
}

export function durationFor(phase: TimerPhase, preferences: Preferences) {
  const minutes = {
    focus: preferences.focusMinutes,
    short_break: preferences.shortBreakMinutes,
    long_break: preferences.longBreakMinutes,
  }[phase]
  return minutes * 60
}

export function createTimer(preferences: Preferences): TimerState {
  return {
    version: 1,
    phase: "focus",
    status: "idle",
    remainingSeconds: durationFor("focus", preferences),
    endAt: null,
    completedFocusSessions: 0,
    activeTaskId: null,
    breakLocked: false,
    checkInPending: false,
  }
}

export function nextPhase(
  state: TimerState,
  preferences: Preferences,
): TimerState {
  const completed =
    state.phase === "focus"
      ? state.completedFocusSessions + 1
      : state.completedFocusSessions
  const phase: TimerPhase =
    state.phase === "focus"
      ? completed % preferences.sessionsBeforeLongBreak === 0
        ? "long_break"
        : "short_break"
      : "focus"
  return {
    ...state,
    phase,
    status: "idle",
    endAt: null,
    remainingSeconds: durationFor(phase, preferences),
    completedFocusSessions: completed,
    breakLocked: false,
    checkInPending: false,
  }
}

export type FocusCheckInChoice =
  | "complete"
  | "continue"
  | "break"
  | "dismiss"

export function resolveFocusCheckIn(
  state: TimerState,
  choice: FocusCheckInChoice,
  preferences: Preferences,
  now: number,
): TimerState {
  if (choice === "dismiss") {
    return { ...state, checkInPending: false }
  }

  const phase =
    choice === "continue" ? "focus" : state.phase === "focus" ? "short_break" : state.phase
  const remainingSeconds = durationFor(phase, preferences)
  return {
    ...state,
    phase,
    status: "running",
    remainingSeconds,
    endAt: now + remainingSeconds * 1000,
    breakLocked: phase !== "focus",
    checkInPending: false,
  }
}

export function reconcileTimer(
  state: TimerState,
  now: number,
  preferences: Preferences,
): TimerState {
  if (state.status !== "running" || !state.endAt) return state
  const remainingSeconds = Math.max(0, Math.ceil((state.endAt - now) / 1000))
  if (remainingSeconds === 0) {
    const next = nextPhase(state, preferences)
    if (state.phase === "focus") {
      return {
        ...next,
        checkInPending: true,
      }
    }
    return next
  }
  return { ...state, remainingSeconds }
}
