"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { Task } from "@/features/tasks/tasks.model"
import {
  copyThemeToWindow,
  floatingBlockedMessage,
  floatingUnsupportedMessage,
  mirrorThemeAttributes,
  openFloatingWindow,
} from "../floating-pip"
import type { FocusCheckInChoice, TimerState } from "../timer.model"
import FloatingTimerWindow from "./floating-timer-window"

export default function FloatingTimer({
  timer,
  activeTask,
  durationSeconds,
  open,
  onOpenChange,
  onStatus,
  onStartPause,
  onReset,
  onCheckIn,
  onTick,
}: {
  timer: TimerState
  activeTask: Task | null
  durationSeconds: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatus: (message: string) => void
  onStartPause: () => void
  onReset: () => void
  onCheckIn: (choice: FocusCheckInChoice) => void
  onTick: () => void
}) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const pipWindowRef = useRef<Window | null>(null)
  const onOpenChangeRef = useRef(onOpenChange)
  const onStatusRef = useRef(onStatus)
  const onTickRef = useRef(onTick)

  onOpenChangeRef.current = onOpenChange
  onStatusRef.current = onStatus
  onTickRef.current = onTick

  useEffect(() => {
    if (!open) return

    const existing = pipWindowRef.current
    if (existing && !existing.closed) {
      setPipWindow(existing)
      return
    }

    let disposed = false
    let created: Window | null = null
    let intervalId: number | undefined
    let themeObserver: MutationObserver | null = null

    function handlePageHide() {
      onOpenChangeRef.current(false)
    }

    void openFloatingWindow().then((result) => {
      if (!result.ok) {
        if (disposed) return
        onStatusRef.current(
          result.reason === "unsupported"
            ? floatingUnsupportedMessage
            : floatingBlockedMessage,
        )
        onOpenChangeRef.current(false)
        return
      }
      if (disposed) {
        result.window.close()
        return
      }
      created = result.window
      pipWindowRef.current = created
      copyThemeToWindow(created.document)
      created.addEventListener("pagehide", handlePageHide)
      intervalId = created.setInterval(() => {
        onTickRef.current()
      }, 1000)
      themeObserver = new MutationObserver(() => {
        if (created && !created.closed) mirrorThemeAttributes(created.document)
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-font"],
      })
      setPipWindow(created)
    })

    return () => {
      disposed = true
      themeObserver?.disconnect()
      if (created) {
        if (intervalId !== undefined) created.clearInterval(intervalId)
        created.removeEventListener("pagehide", handlePageHide)
        if (!created.closed) created.close()
      }
      pipWindowRef.current = null
      setPipWindow(null)
    }
  }, [open])

  if (!pipWindow) return null

  return createPortal(
    <FloatingTimerWindow
      timer={timer}
      activeTask={activeTask}
      durationSeconds={durationSeconds}
      onStartPause={onStartPause}
      onReset={onReset}
      onCheckIn={onCheckIn}
      onClose={() => onOpenChangeRef.current(false)}
    />,
    pipWindow.document.body,
  )
}
