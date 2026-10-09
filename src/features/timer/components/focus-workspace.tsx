"use client"

import { AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react"
import AppHeader from "@/components/layout/app-header"
import NotesPanel from "@/features/notes/components/notes-panel"
import { localOnboardingRepository } from "@/features/onboarding/onboarding.repository"
import { localPreferencesRepository } from "@/features/preferences/local-preferences.repository"
import { playTimerComplete } from "@/lib/sounds"
import { useSoundSettings } from "@/providers/sound-provider"
import { localTasksRepository } from "@/features/tasks/local-tasks.repository"
import TaskPanel from "@/features/tasks/components/task-panel"
import { tasksReducer } from "@/features/tasks/tasks.reducer"
import { localTimerRepository } from "../local-timer.repository"
import {
  createTimer,
  durationFor,
  formatTimerTabTitle,
  nextPhase,
  reconcileTimer,
  resolveFocusCheckIn,
  type FocusCheckInChoice,
  type TimerState,
} from "../timer.model"
import FocusOverlay from "./focus-overlay"
import FocusDock from "./focus-dock"
import SessionCheckIn from "./session-check-in"
import TimerPanel from "./timer-panel"

export default function FocusWorkspace() {
  const router = useRouter()
  const { soundEnabled } = useSoundSettings()
  const preferences = useMemo(() => localPreferencesRepository.load(), [])
  const [tasks, dispatch] = useReducer(tasksReducer, [])
  const [timer, setTimer] = useState<TimerState>(() => createTimer(preferences))
  const timerRef = useRef(timer)
  const [ready, setReady] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const [timeUpNotice, setTimeUpNotice] = useState(false)
  const [dockVisible, setDockVisible] = useState(false)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const titleBeforeTimerRef = useRef<string | null>(null)
  const timeUpTimeoutRef = useRef<number | null>(null)
  const breakLocked = timer.breakLocked && timer.phase !== "focus"

  const reconcileCurrentTimer = useCallback(() => {
    const current = timerRef.current
    const next = reconcileTimer(current, Date.now(), preferences)
    if (next === current) return

    timerRef.current = next
    setTimer(next)
    if (next.phase === current.phase) return

    setAnnouncement(
      current.phase === "focus"
        ? "Focus session complete. Choose what to do next."
        : "Break complete. Your next focus session is ready.",
    )
    setTimeUpNotice(true)
    if (soundEnabled) playTimerComplete()
    if (timeUpTimeoutRef.current !== null) {
      window.clearTimeout(timeUpTimeoutRef.current)
    }
    timeUpTimeoutRef.current = window.setTimeout(
      () => {
        timeUpTimeoutRef.current = null
        setTimeUpNotice(false)
      },
      6000,
    )
  }, [preferences, soundEnabled])

  useEffect(() => {
    titleBeforeTimerRef.current = document.title
    return () => {
      if (titleBeforeTimerRef.current) {
        document.title = titleBeforeTimerRef.current
      }
    }
  }, [])

  useEffect(() => {
    timerRef.current = timer
  }, [timer])

  useEffect(() => {
    if (timer.status !== "running") return
    setTimeUpNotice(false)
    if (timeUpTimeoutRef.current !== null) {
      window.clearTimeout(timeUpTimeoutRef.current)
      timeUpTimeoutRef.current = null
    }
  }, [timer.status])

  useEffect(() => {
    if (!ready) return
    document.title = formatTimerTabTitle(timer, timeUpNotice)
  }, [ready, timeUpNotice, timer.phase, timer.remainingSeconds, timer.status])

  useEffect(
    () => () => {
      if (timeUpTimeoutRef.current !== null) {
        window.clearTimeout(timeUpTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    const observer = new IntersectionObserver(
      ([entry]) => setDockVisible(!entry.isIntersecting),
      { threshold: 0.05 },
    )
    observer.observe(workspace)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!localOnboardingRepository.isComplete()) {
      router.replace("/")
      return
    }
    dispatch({ type: "hydrate", tasks: localTasksRepository.list() })
    const stored = localTimerRepository.load()
    setTimer(() => {
      if (!stored) return createTimer(preferences)
      const reconciled = reconcileTimer(stored, Date.now(), preferences)
      return reconciled.status === "idle"
        ? {
            ...reconciled,
            remainingSeconds: durationFor(reconciled.phase, preferences),
          }
        : reconciled
    })
    setReady(true)
  }, [preferences, router])

  useEffect(() => {
    if (ready) localTasksRepository.replaceAll(tasks)
  }, [ready, tasks])

  useEffect(() => {
    if (ready) localTimerRepository.save(timer)
  }, [ready, timer])

  useEffect(() => {
    if (!ready || timer.status !== "running") return
    const interval = window.setInterval(() => {
      reconcileCurrentTimer()
    }, 1000)
    return () => window.clearInterval(interval)
  }, [reconcileCurrentTimer, ready, timer.status])

  useEffect(() => {
    if (timer.checkInPending) setFocusMode(false)
  }, [timer.checkInPending])

  useEffect(() => {
    function reconcile() {
      if (document.visibilityState === "visible") {
        reconcileCurrentTimer()
      }
    }
    document.addEventListener("visibilitychange", reconcile)
    return () => document.removeEventListener("visibilitychange", reconcile)
  }, [reconcileCurrentTimer])

  useEffect(() => {
    if (!focusMode || breakLocked) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFocusMode(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [breakLocked, focusMode])

  useEffect(() => {
    if (
      timer.activeTaskId &&
      !tasks.some(
        (task) => task.id === timer.activeTaskId && task.status !== "done",
      )
    ) {
      setTimer((current) => ({ ...current, activeTaskId: null }))
    }
  }, [tasks, timer.activeTaskId])

  const activeTask =
    tasks.find((task) => task.id === timer.activeTaskId) ?? null

  const handleCheckIn = useCallback(
    (choice: FocusCheckInChoice) => {
      if (choice === "complete" && activeTask) {
        dispatch({
          type: "set_status",
          id: activeTask.id,
          status: "done",
        })
      }
      setTimer((current) =>
        resolveFocusCheckIn(current, choice, preferences, Date.now()),
      )
    },
    [activeTask, preferences],
  )

  const startPause = useCallback(() => {
    setTimer((current) => {
      if (current.status === "running") {
        const reconciled = reconcileTimer(current, Date.now(), preferences)
        return { ...reconciled, status: "paused", endAt: null }
      }
      return {
        ...current,
        status: "running",
        endAt: Date.now() + current.remainingSeconds * 1000,
      }
    })
  }, [preferences])

  function reset() {
    setTimer((current) => ({
      ...current,
      status: "idle",
      endAt: null,
      remainingSeconds: durationFor(current.phase, preferences),
    }))
  }

  if (!ready)
    return (
      <main className="min-h-screen bg-canvas" aria-label="Loading workspace" />
    )

  return (
    <>
      <main className="min-h-screen bg-canvas px-4 py-5 sm:px-7 sm:py-6 lg:px-10">
        <div className="mx-auto max-w-[90rem]">
          <AppHeader />
          <div ref={workspaceRef}>
            <div className="mt-7 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.72fr)]">
              <TimerPanel
                timer={timer}
                activeTask={activeTask}
                onStartPause={startPause}
                onReset={reset}
                onSkip={() =>
                  setTimer((current) => nextPhase(current, preferences))
                }
                onFocusMode={() => setFocusMode(true)}
                cycleLength={preferences.sessionsBeforeLongBreak}
              />
              <TaskPanel
                tasks={tasks}
                activeTaskId={timer.activeTaskId}
                dispatch={dispatch}
              />
            </div>
          </div>
          <section className="mt-8" aria-labelledby="workspace-notes-title">
            <NotesPanel />
          </section>
        </div>
      </main>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
      <FocusDock
        visible={dockVisible && !focusMode && !breakLocked}
        timer={timer}
        activeTask={activeTask}
        tasks={tasks}
        dispatch={dispatch}
      />
      <AnimatePresence initial={false}>
        {(focusMode || breakLocked) && !timer.checkInPending ? (
          <FocusOverlay
            key="focus-overlay"
            timer={timer}
            activeTask={activeTask}
            onStartPause={startPause}
            onClose={() => setFocusMode(false)}
            locked={breakLocked}
          />
        ) : null}
      </AnimatePresence>
      {timer.checkInPending ? (
        <SessionCheckIn
          activeTask={activeTask}
          onChoose={handleCheckIn}
        />
      ) : null}
    </>
  )
}
