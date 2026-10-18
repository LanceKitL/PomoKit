"use client"

import {
  Expand,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  SkipForward,
  Target,
} from "lucide-react"
import Button from "@/components/ui/button"
import Card from "@/components/ui/card"
import { cn } from "@/lib/cn"
import type { Task } from "@/features/tasks/tasks.model"
import type { TimerPhase, TimerState } from "../timer.model"
import IconTooltipButton from "./icon-tooltip-button"
import TimerDigitTransition from "./timer-digit-transition"

export default function TimerPanel({
  timer,
  activeTask,
  onStartPause,
  onReset,
  onSkip,
  onFocusMode,
  onToggleFloating,
  floatingOpen,
  floatingSupported,
  floatingStatus,
  cycleLength,
}: {
  timer: TimerState
  activeTask: Task | null
  onStartPause: () => void
  onReset: () => void
  onSkip: () => void
  onFocusMode: () => void
  onToggleFloating: () => void
  floatingOpen: boolean
  floatingSupported: boolean
  floatingStatus: string | null
  cycleLength: number
}) {
  const minutes = Math.floor(timer.remainingSeconds / 60)
  const seconds = timer.remainingSeconds % 60
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
      <div
        aria-hidden="true"
        className="absolute -end-16 -top-20 size-56 rounded-full bg-peach/70"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -start-16 size-64 rounded-full border border-primary/45"
      />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">
              {phaseLabel[timer.phase]}
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-lavender px-3 py-2 text-sm font-extrabold text-on-accent">
            <Target aria-hidden="true" size={17} />
            {timer.completedFocusSessions} sessions
          </div>
        </div>

        <div className="py-12 text-center sm:py-16">
          <p
            className="timer-digits text-[clamp(5rem,16vw,10rem)] leading-none font-extrabold text-ink"
            aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
          >
            <TimerDigitTransition display={display} />
          </p>
          <p className="mx-auto mt-7 max-w-md text-pretty text-base leading-7 text-muted">
            {activeTask ? (
              <>
                Focusing on{" "}
                <strong className="text-ink">{activeTask.title}</strong>
              </>
            ) : (
              "Create a task or use this session to clear your head."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="min-w-40" onClick={onStartPause}>
            {timer.status === "running" ? (
              <>
                <Pause aria-hidden="true" size={20} fill="currentColor" />
                Pause
              </>
            ) : (
              <>
                <Play aria-hidden="true" size={20} fill="currentColor" />
                {timer.status === "paused" ? "Resume" : "Start session"}
              </>
            )}
          </Button>
          <IconTooltipButton
            label="Reset timer"
            variant="secondary"
            onClick={onReset}
          >
            <RotateCcw aria-hidden="true" size={19} />
          </IconTooltipButton>
          <IconTooltipButton
            label="Skip phase"
            variant="secondary"
            onClick={onSkip}
          >
            <SkipForward aria-hidden="true" size={19} />
          </IconTooltipButton>
          <IconTooltipButton
            label="Enter focus mode"
            variant="ghost"
            onClick={onFocusMode}
          >
            <Expand aria-hidden="true" size={19} />
          </IconTooltipButton>
          <IconTooltipButton
            label={
              floatingOpen ? "Hide floating timer" : "Show floating timer"
            }
            variant="secondary"
            onClick={onToggleFloating}
            pressed={floatingOpen}
            disabled={!floatingSupported}
          >
            <PictureInPicture2 aria-hidden="true" size={19} />
          </IconTooltipButton>
        </div>

        {floatingStatus ? (
          <p role="status" className="mt-3 text-sm text-muted">
            {floatingStatus}
          </p>
        ) : null}

        <div
          className="mt-9 flex justify-center gap-2"
          aria-label="Pomodoro cycle"
        >
          {Array.from({ length: cycleLength }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 w-10 rounded-full",
                index < timer.completedFocusSessions % cycleLength
                  ? "bg-primary"
                  : "bg-line",
              )}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

export const phaseLabel: Record<TimerPhase, string> = {
  focus: "Focus session",
  short_break: "Short break",
  long_break: "Long break",
}
