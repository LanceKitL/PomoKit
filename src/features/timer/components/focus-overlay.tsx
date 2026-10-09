"use client"

import { Minimize2, Pause, Play } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef } from "react"
import Button from "@/components/ui/button"
import type { Task } from "@/features/tasks/tasks.model"
import type { TimerState } from "../timer.model"
import TimerDigitTransition from "./timer-digit-transition"
import { phaseLabel } from "./timer-panel"

export default function FocusOverlay({
  timer,
  activeTask,
  onStartPause,
  onClose,
  locked,
}: {
  timer: TimerState
  activeTask: Task | null
  onStartPause: () => void
  onClose: () => void
  locked: boolean
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const display = `${String(Math.floor(timer.remainingSeconds / 60)).padStart(2, "0")}:${String(
    timer.remainingSeconds % 60,
  ).padStart(2, "0")}`

  useEffect(() => {
    const dialog = dialogRef.current
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    if (!dialog) return
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    dialog.focus()

    function trapTab(event: KeyboardEvent) {
      if (!dialog) return
      if (event.key !== "Tab") return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener("keydown", trapTab)
    return () => {
      dialog.removeEventListener("keydown", trapTab)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])

  return (
    <motion.div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Focus timer"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", bounce: 0, duration: 0.38 }}
      className="fixed inset-0 z-50 grid h-screen h-[100svh] place-items-center overflow-hidden bg-canvas px-4 py-6 sm:px-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 decorative-grid opacity-15"
      />
      {!locked && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Leave focus mode"
          title="Leave focus mode (Esc)"
          className="absolute end-4 top-4 z-10 text-muted sm:end-7 sm:top-7"
        >
          <Minimize2 aria-hidden="true" size={21} />
        </Button>
      )}
      <div className="relative flex h-full w-full flex-col items-center justify-center text-center">
        {activeTask && (
          <p className="mb-4 max-w-3xl truncate px-3 text-base font-semibold text-muted sm:text-xl">
            {activeTask.title}
          </p>
        )}
        <p
          className="timer-digits whitespace-nowrap text-[clamp(4rem,min(27vw,34vh),24rem)] leading-[0.88] font-extrabold tracking-[-0.06em] text-ink"
          aria-label={`${phaseLabel[timer.phase]}: ${display}`}
        >
          <TimerDigitTransition display={display} />
        </p>
        {locked ? (
          <p className="mt-8 text-sm font-bold text-primary-strong sm:text-base">
            Break in progress · workspace locked
          </p>
        ) : (
          <>
            <div className="mt-9 flex justify-center">
              <Button size="lg" onClick={onStartPause} className="min-w-40">
                {timer.status === "running" ? (
                  <>
                    <Pause aria-hidden="true" size={20} /> Pause
                  </>
                ) : (
                  <>
                    <Play aria-hidden="true" size={20} />
                    {timer.status === "paused" ? "Resume" : "Start session"}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
