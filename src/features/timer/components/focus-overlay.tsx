"use client"

import { Minimize2, Pause, Play } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/button"
import type { Task } from "@/features/tasks/tasks.model"
import type { TimerState } from "../timer.model"
import {
  createBreakGifPositions,
  type BreakGifPosition,
} from "./break-gif-layout"
import TimerDigitTransition from "./timer-digit-transition"
import { phaseLabel } from "./timer-panel"

export default function FocusOverlay({
  timer,
  activeTask,
  onStartPause,
  onClose,
  locked,
  fullscreenError,
}: {
  timer: TimerState
  activeTask: Task | null
  onStartPause: () => void
  onClose: () => void
  locked: boolean
  fullscreenError: string | null
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [breakGifs, setBreakGifs] = useState<
    { src: string; aspectRatio: number }[]
  >([])
  const [breakGifError, setBreakGifError] = useState<string | null>(null)
  const [breakGifPositions, setBreakGifPositions] = useState<
    BreakGifPosition[]
  >([])
  const display = `${String(Math.floor(timer.remainingSeconds / 60)).padStart(2, "0")}:${String(
    timer.remainingSeconds % 60,
  ).padStart(2, "0")}`

  useEffect(() => {
    if (!locked) {
      setBreakGifs([])
      setBreakGifError(null)
      setBreakGifPositions([])
      return
    }

    const controller = new AbortController()
    setBreakGifError(null)
    void fetch("/api/break-gifs", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`GIF list request failed with ${response.status}`)
        }

        const result: unknown = await response.json()
        if (
          typeof result !== "object" ||
          result === null ||
          !("gifs" in result) ||
          !Array.isArray(result.gifs) ||
          !result.gifs.every(
            (gif) =>
              typeof gif === "object" &&
              gif !== null &&
              "src" in gif &&
              typeof gif.src === "string" &&
              "aspectRatio" in gif &&
              typeof gif.aspectRatio === "number" &&
              Number.isFinite(gif.aspectRatio) &&
              gif.aspectRatio > 0,
          )
        ) {
          throw new Error("GIF list response has an invalid format")
        }

        setBreakGifs(result.gifs)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.error("Unable to load break GIFs", error)
        setBreakGifError(
          "Break GIFs could not be loaded. The protected break will continue.",
        )
      })

    return () => controller.abort()
  }, [locked])

  useEffect(() => {
    if (!locked) return

    function updateBreakGifPositions() {
      setBreakGifPositions(
        createBreakGifPositions(
          breakGifs,
          window.innerWidth,
          window.innerHeight,
        ),
      )
    }

    updateBreakGifPositions()
    window.addEventListener("resize", updateBreakGifPositions)
    return () => window.removeEventListener("resize", updateBreakGifPositions)
  }, [breakGifs, locked])

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
      {locked ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          {breakGifPositions.map(({ src, left, top, width, height }) => (
            <img
              key={src}
              src={src}
              alt=""
              className="absolute opacity-75"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
            />
          ))}
        </div>
      ) : null}
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
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center">
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
          <div className="mt-8 space-y-2">
            <p className="text-sm font-bold text-primary-strong sm:text-base">
              Break in progress · workspace locked
            </p>
            <p className="text-sm text-muted">
              Keyboard controls are disabled in PomoKit until the break ends.
              Browser and system shortcuts may still work.
            </p>
            {fullscreenError ? (
              <p role="status" aria-live="polite" className="text-sm text-muted">
                {fullscreenError}
              </p>
            ) : null}
            {breakGifError ? (
              <p role="status" aria-live="polite" className="text-sm text-muted">
                {breakGifError}
              </p>
            ) : null}
          </div>
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
