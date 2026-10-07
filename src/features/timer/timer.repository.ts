import type { TimerState } from "./timer.model"

export interface TimerRepository {
  load(): TimerState | null
  save(timer: TimerState): void
  clear(): void
}
