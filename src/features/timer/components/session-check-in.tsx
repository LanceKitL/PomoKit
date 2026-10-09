"use client"

import { Check, Coffee, Play, X } from "lucide-react"
import { useEffect, useRef } from "react"
import Button from "@/components/ui/button"
import type { Task } from "@/features/tasks/tasks.model"
import type { FocusCheckInChoice } from "../timer.model"

export default function SessionCheckIn({
  activeTask,
  onChoose,
}: {
  activeTask: Task | null
  onChoose: (choice: FocusCheckInChoice) => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    const initialFocus =
      dialog?.querySelector<HTMLButtonElement>("button[data-autofocus]") ??
      dialog?.querySelector<HTMLButtonElement>("button:not([disabled])")
    initialFocus?.focus()

    function handleKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onChoose("dismiss")
        return
      }
      if (event.key !== "Tab") return

      const focusable = Array.from(
        dialog?.querySelectorAll<HTMLButtonElement>(
          "button:not([disabled])",
        ) ?? [],
      )
      if (!focusable.length) return
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

    dialog?.addEventListener("keydown", handleKeys)
    return () => {
      dialog?.removeEventListener("keydown", handleKeys)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [onChoose])

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/40 px-4 py-6 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-check-in-title"
        aria-describedby="session-check-in-description"
        className="w-full max-w-md rounded-3xl border border-line bg-surface p-5 paper-shadow sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-[0.16em] text-primary-strong uppercase">
              Session complete
            </p>
            <h2
              id="session-check-in-title"
              className="mt-2 font-display text-3xl font-semibold tracking-tight"
            >
              How did that go?
            </h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Decide later"
            onClick={() => onChoose("dismiss")}
          >
            <X aria-hidden="true" size={19} />
          </Button>
        </div>

        <p
          id="session-check-in-description"
          className="mt-2 text-sm leading-6 text-muted"
        >
          {activeTask
            ? `You worked on “${activeTask.title}”. Choose what feels right next.`
            : "One session finished. Choose what feels right next."}
        </p>

        <div className="mt-6 grid gap-2.5">
          {activeTask ? (
            <Button
              size="lg"
              data-autofocus={activeTask ? true : undefined}
              className="w-full justify-between"
              onClick={() => onChoose("complete")}
            >
              Mark task done
              <Check aria-hidden="true" size={19} />
            </Button>
          ) : null}
          <Button
            size="lg"
            data-autofocus={activeTask ? undefined : true}
            variant={activeTask ? "secondary" : "primary"}
            className="w-full justify-between"
            onClick={() => onChoose("continue")}
          >
            Keep working
            <Play aria-hidden="true" size={18} />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full justify-between"
            onClick={() => onChoose("break")}
          >
            Take a break
            <Coffee aria-hidden="true" size={19} />
          </Button>
        </div>

        <button
          type="button"
          className="interactive mt-3 min-h-11 w-full rounded-xl px-4 text-sm font-bold text-muted hover:bg-surface-raised hover:text-ink"
          onClick={() => onChoose("dismiss")}
        >
          Decide later
        </button>
      </div>
    </div>
  )
}
