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
import { localTasksRepository } from "@/features/tasks/local-tasks.repository"
import TaskPanel from "@/features/tasks/components/task-panel"
import { tasksReducer } from "@/features/tasks/tasks.reducer"
import { localTimerRepository } from "../local-timer.repository"
import {
  createTimer,
  durationFor,
  nextPhase,
  reconcileTimer,
  type TimerState,
} from "../timer.model"
import FocusOverlay from "./focus-overlay"
import FocusDock from "./focus-dock"
import TimerPanel from "./timer-panel"

export default function FocusWorkspace() {
  const router = useRouter()
  const preferences = useMemo(() => localPreferencesRepository.load(), [])
  const [tasks, dispatch] = useReducer(tasksReducer, [])
  const [timer, setTimer] = useState<TimerState>(() => createTimer(preferences))
  const [ready, setReady] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const [dockVisible, setDockVisible] = useState(false)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const breakLocked = timer.breakLocked && timer.phase !== "focus"

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
      setTimer((current) => {
        const next = reconcileTimer(current, Date.now(), preferences)
        if (next.phase !== current.phase)
          setAnnouncement("Phase complete. Your next phase is ready.")
        return next
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [preferences, ready, timer.status])

  useEffect(() => {
    function reconcile() {
      if (document.visibilityState === "visible") {
        setTimer((current) => reconcileTimer(current, Date.now(), preferences))
      }
    }
    document.addEventListener("visibilitychange", reconcile)
    return () => document.removeEventListener("visibilitychange", reconcile)
  }, [preferences])

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
            <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.72fr)]">
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
        {focusMode || breakLocked ? (
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
    </>
  )
}
