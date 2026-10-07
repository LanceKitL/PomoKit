"use client"

import { Minimize2, Pause, Play } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef } from "react"
import Button from "@/components/ui/button"
import type { Task } from "@/features/tasks/tasks.model"
import type { TimerState } from "../timer.model"
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
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    if (!dialog) return
    dialog.focus()

    function trapTab(event: KeyboardEvent) {
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
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])

  return (
    <motion.div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-overlay-title"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", bounce: 0, duration: 0.38 }}
      className="fixed inset-0 z-50 grid min-h-screen place-items-center overflow-y-auto bg-canvas p-6"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 decorative-grid opacity-25"
      />
      <div className="relative w-full max-w-4xl text-center">
        <h2
          id="focus-overlay-title"
          className="text-sm font-extrabold tracking-[0.18em] text-primary-strong uppercase"
        >
          {phaseLabel[timer.phase]}
        </h2>
        <p className="timer-digits mt-7 text-7xl leading-none font-extrabold sm:text-8xl lg:text-9xl">
          {display}
        </p>
        <p className="mx-auto mt-7 max-w-xl text-pretty text-lg leading-8 text-muted">
          {activeTask
            ? activeTask.title
            : "One quiet session. Nothing else needs your attention."}
        </p>
        {locked ? (
          <p className="mt-10 text-base font-bold text-primary-strong">
            Break in progress. Your workspace will unlock when the timer ends.
          </p>
        ) : (
          <>
            <div className="mt-10 flex justify-center gap-3">
              <Button size="lg" onClick={onStartPause}>
                {timer.status === "running" ? (
                  <>
                    <Pause aria-hidden="true" size={20} /> Pause
                  </>
                ) : (
                  <>
                    <Play aria-hidden="true" size={20} /> Resume
                  </>
                )}
              </Button>
              <Button size="lg" variant="secondary" onClick={onClose}>
                <Minimize2 aria-hidden="true" size={20} /> Leave focus mode
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted">
              Press Escape to return to your workspace.
            </p>
          </>
        )}
      </div>
    </motion.div>
  )
}
