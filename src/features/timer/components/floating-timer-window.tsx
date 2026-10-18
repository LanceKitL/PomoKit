"use client"

import { Check, Coffee, Pause, Play, RotateCcw, X } from "lucide-react"
import Button from "@/components/ui/button"
import { cn } from "@/lib/cn"
import type { Task } from "@/features/tasks/tasks.model"
import type { FocusCheckInChoice, TimerState } from "../timer.model"
import TimerDigitTransition from "./timer-digit-transition"
import { phaseLabel } from "./timer-panel"

export default function FloatingTimerWindow({
  timer,
  activeTask,
  durationSeconds,
  onStartPause,
  onReset,
  onCheckIn,
  onClose,
}: {
  timer: TimerState
  activeTask: Task | null
  durationSeconds: number
  onStartPause: () => void
  onReset: () => void
  onCheckIn: (choice: FocusCheckInChoice) => void
  onClose: () => void
}) {
  const minutes = Math.floor(timer.remainingSeconds / 60)
  const seconds = timer.remainingSeconds % 60
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  const totalSeconds = Math.max(1, durationSeconds)
  const ratio = Math.min(1, Math.max(0, timer.remainingSeconds / totalSeconds))
  const markerAngle = Math.PI * (1 - ratio)
  const markerTransform = `translate(${(100 + 85 * Math.cos(markerAngle)).toFixed(2)},${(
    100 -
    85 * Math.sin(markerAngle)
  ).toFixed(2)})`
  const checkingIn = timer.checkInPending

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4 text-center">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.65rem] font-extrabold tracking-[0.16em] text-primary-strong uppercase">
          {checkingIn ? "Focus session" : phaseLabel[timer.phase]}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close floating timer"
          title="Close floating timer"
          className="interactive -m-1.5 grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-raised hover:text-ink"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>

      {activeTask ? (
        <p className="truncate text-xs font-bold text-muted">
          {activeTask.title}
        </p>
      ) : null}

      {checkingIn ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1">
          <p className="text-xs font-extrabold tracking-[0.14em] text-primary-strong uppercase">
            Session complete
          </p>
          <p
            className="timer-digits text-4xl font-extrabold text-ink"
            aria-label={`${phaseLabel[timer.phase]}: ${display}`}
          >
            <TimerDigitTransition display={display} />
          </p>
        </div>
      ) : (
        <div
          role="progressbar"
          aria-label={phaseLabel[timer.phase]}
          aria-valuemin={0}
          aria-valuemax={totalSeconds}
          aria-valuenow={timer.remainingSeconds}
          aria-valuetext={`${display} remaining`}
          className="focus-dial focus-dial--compact mx-auto"
        >
          <svg
            className="focus-dial__svg"
            viewBox="0 0 200 112"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M15 100A85 85 0 0 1 185 100"
              className="stroke-line"
              fill="none"
              strokeWidth={14}
              strokeLinecap="round"
            />
            <path
              d="M15 100A85 85 0 0 1 185 100"
              className="stroke-primary"
              pathLength={1}
              fill="none"
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={`${ratio} 1`}
            />
            <g transform={markerTransform}>
              <ellipse cx="0" cy="3" rx="11" ry="10" fill="rgba(0,0,0,.2)" />
              <circle r="11" fill="#E63946" />
              <circle cx="-2.5" cy="-2.5" r="8" fill="#EE4B58" />
              <ellipse
                cx="-4"
                cy="-4"
                rx="3"
                ry="1.5"
                fill="#FFB3B3"
                transform="rotate(-35 -4 -4)"
              />
              <path
                d="M0-10C2-7 7-8 9-5C6-6 3-6 0-8C-3-6-6-6-9-5C-7-8-2-7 0-10Z"
                fill="#40916C"
              />
              <path
                d="M0-11C1-14 4-15 6-13C4-12 2-11 0-10C-2-11-4-12-6-13C-4-15-1-14 0-11Z"
                fill="#2D6A4F"
              />
            </g>
          </svg>
          <div className="focus-dial__face">
            <p
              className={cn(
                "focus-dial__time timer-digits text-ink",
                timer.status === "running" && "is-running",
              )}
              aria-label={`${phaseLabel[timer.phase]}: ${display}`}
            >
              <TimerDigitTransition display={display} />
            </p>
          </div>
        </div>
      )}

      {checkingIn ? (
        <div className="grid gap-2">
          {activeTask ? (
            <Button
              size="sm"
              className="w-full justify-between"
              onClick={() => onCheckIn("complete")}
            >
              Mark task done
              <Check aria-hidden="true" size={16} />
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={activeTask ? "secondary" : "primary"}
            className="w-full justify-between"
            onClick={() => onCheckIn("continue")}
          >
            Keep working
            <Play aria-hidden="true" size={16} fill="currentColor" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-full justify-between"
            onClick={() => onCheckIn("break")}
          >
            Take a break
            <Coffee aria-hidden="true" size={16} />
          </Button>
          <button
            type="button"
            className="interactive min-h-11 rounded-xl px-4 text-xs font-bold text-muted hover:bg-surface-raised hover:text-ink"
            onClick={() => onCheckIn("dismiss")}
          >
            Decide later
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <Button size="md" onClick={onStartPause} className="min-w-32">
            {timer.status === "running" ? (
              <>
                <Pause aria-hidden="true" size={17} fill="currentColor" />
                Pause
              </>
            ) : (
              <>
                <Play aria-hidden="true" size={17} fill="currentColor" />
                {timer.status === "paused" ? "Resume" : "Start"}
              </>
            )}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={onReset}
            aria-label="Reset timer"
          >
            <RotateCcw aria-hidden="true" size={17} />
          </Button>
        </div>
      )}
    </div>
  )
}
