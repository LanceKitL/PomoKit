import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/storage/local-storage"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import type { TimerRepository } from "./timer.repository"
import type { TimerState } from "./timer.model"

function isTimer(value: unknown): value is TimerState {
  if (!value || typeof value !== "object") return false
  const timer = value as Partial<TimerState>
  return (
    timer.version === 1 &&
    ["focus", "short_break", "long_break"].includes(timer.phase ?? "") &&
    ["idle", "running", "paused"].includes(timer.status ?? "") &&
    typeof timer.remainingSeconds === "number" &&
    typeof timer.completedFocusSessions === "number"
  )
}

export const localTimerRepository: TimerRepository = {
  load() {
    const timer = readStorage<TimerState | null>(STORAGE_KEYS.timer, null)
    return isTimer(timer)
      ? { ...timer, breakLocked: timer.breakLocked === true }
      : null
  },
  save(timer) {
    writeStorage(STORAGE_KEYS.timer, timer)
  },
  clear() {
    removeStorage(STORAGE_KEYS.timer)
  },
}
