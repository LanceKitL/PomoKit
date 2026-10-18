"use client"

import { Minimize2, Pause, PictureInPicture2, Play } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/button"
import { cn } from "@/lib/cn"
import type { Task } from "@/features/tasks/tasks.model"
import type { TimerState } from "../timer.model"
import {
  createBreakGifPositions,
  type BreakGifPosition,
} from "./break-gif-layout"
import IconTooltipButton from "./icon-tooltip-button"
import TimerDigitTransition from "./timer-digit-transition"
import { phaseLabel } from "./timer-panel"

export default function FocusOverlay({
  timer,
  activeTask,
  durationSeconds,
  onStartPause,
  onClose,
  onToggleFloating,
  floatingOpen,
  floatingSupported,
  locked,
  fullscreenError,
}: {
  timer: TimerState
  activeTask: Task | null
  durationSeconds: number
  onStartPause: () => void
  onClose: () => void
  onToggleFloating: () => void
  floatingOpen: boolean
  floatingSupported: boolean
  locked: boolean
  fullscreenError: string | null
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [breakGifs, setBreakGifs] = useState<{
    src: string
    aspectRatio: number
  }[]>([])
  const [breakGifError, setBreakGifError] = useState<string | null>(null)
  const [breakGifPositions, setBreakGifPositions] =
    useState<BreakGifPosition[]>([])
  const display = `${String(Math.floor(timer.remainingSeconds / 60)).padStart(2, "0")}:${String(
    timer.remainingSeconds % 60,
  ).padStart(2, "0")}`
  const totalSeconds = Math.max(1, durationSeconds)
  const ratio = Math.min(1, Math.max(0, timer.remainingSeconds / totalSeconds))
  const markerAngle = Math.PI * (1 - ratio)
  const markerTransform = `translate(${(100 + 85 * Math.cos(markerAngle)).toFixed(2)},${(
    100 -
    85 * Math.sin(markerAngle)
  ).toFixed(2)})`

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
      className="fixed inset-0 z-50 grid h-screen h-[100svh] place-items-center overflow-hidden bg-canvas px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8"
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
        <div className="absolute end-4 top-4 z-20 flex items-center gap-1.5 sm:end-7 sm:top-7">
          <IconTooltipButton
            label={
              floatingOpen ? "Hide floating timer" : "Show floating timer"
            }
            variant="ghost"
            onClick={onToggleFloating}
            pressed={floatingOpen}
            disabled={!floatingSupported}
            align="end"
            className="text-muted"
          >
            <PictureInPicture2 aria-hidden="true" size={20} />
          </IconTooltipButton>
          <IconTooltipButton
            label="Leave focus mode"
            tooltip="Leave focus mode (Esc)"
            variant="ghost"
            onClick={onClose}
            align="end"
            className="text-muted"
          >
            <Minimize2 aria-hidden="true" size={21} />
          </IconTooltipButton>
        </div>
      )}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center">
        {activeTask && (
          <p className="mb-4 max-w-3xl truncate px-3 text-base font-semibold text-muted sm:text-xl">
            {activeTask.title}
          </p>
        )}
        <div
          role="progressbar"
          aria-label={phaseLabel[timer.phase]}
          aria-valuemin={0}
          aria-valuemax={totalSeconds}
          aria-valuenow={timer.remainingSeconds}
          aria-valuetext={`${display} remaining`}
          className="focus-dial"
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
              <p
                role="status"
                aria-live="polite"
                className="text-sm text-muted"
              >
                {fullscreenError}
              </p>
            ) : null}
            {breakGifError ? (
              <p
                role="status"
                aria-live="polite"
                className="text-sm text-muted"
              >
                {breakGifError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-9 flex justify-center">
            <Button size="lg" onClick={onStartPause} className="min-w-40">
              {timer.status === "running" ? (
                <>
                  <Pause aria-hidden="true" size={20} fill="currentColor" />{" "}
                  Pause
                </>
              ) : (
                <>
                  <Play aria-hidden="true" size={20} fill="currentColor" />
                  {timer.status === "paused" ? "Resume" : "Start session"}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
