"use client"

import { ChevronDown, ChevronUp, Timer } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import TaskPanel from "@/features/tasks/components/task-panel"
import type { Task } from "@/features/tasks/tasks.model"
import type { TasksAction } from "@/features/tasks/tasks.reducer"
import type { TimerState } from "../timer.model"
import { phaseLabel } from "./timer-panel"

export default function FocusDock({
  visible,
  timer,
  activeTask,
  tasks,
  dispatch,
}: {
  visible: boolean
  timer: TimerState
  activeTask: Task | null
  tasks: Task[]
  dispatch: React.Dispatch<TasksAction>
}) {
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const minutes = Math.floor(timer.remainingSeconds / 60)
  const seconds = timer.remainingSeconds % 60
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  useEffect(() => {
    if (!taskDrawerOpen) return
    drawerRef.current?.focus()
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setTaskDrawerOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [taskDrawerOpen])

  function closeDrawer() {
    setTaskDrawerOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", bounce: 0, duration: 0.34 }}
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 sm:inset-x-auto sm:right-6 sm:w-[min(23rem,calc(100vw-3rem))]"
        >
          <AnimatePresence initial={false}>
            {taskDrawerOpen ? (
              <motion.div
                ref={drawerRef}
                id="focus-dock-tasks"
                tabIndex={-1}
                role="region"
                aria-labelledby="focus-dock-tasks-title"
                initial={{ opacity: 0, y: 16, scaleY: 0.96 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: 16, scaleY: 0.96 }}
                transition={{ type: "spring", bounce: 0, duration: 0.34 }}
                style={{ transformOrigin: "bottom center" }}
                className="translucent-surface mb-3 max-h-[min(38rem,calc(100dvh-8rem))] overflow-y-auto rounded-2xl shadow-2xl"
              >
                <h2 id="focus-dock-tasks-title" className="sr-only">
                  Focus tasks
                </h2>
                <TaskPanel
                  tasks={tasks}
                  activeTaskId={timer.activeTaskId}
                  dispatch={dispatch}
                  className="min-h-0"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
          <motion.button
            ref={triggerRef}
            type="button"
            layout
            aria-expanded={taskDrawerOpen}
            aria-controls="focus-dock-tasks"
            aria-label={
              taskDrawerOpen ? "Hide focus tasks" : "Show focus tasks"
            }
            onClick={() => {
              if (taskDrawerOpen) closeDrawer()
              else setTaskDrawerOpen(true)
            }}
            className="translucent-surface flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line px-4 py-3 text-left shadow-(--shadow)"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-on-accent">
              <Timer aria-hidden="true" size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold tracking-[0.12em] text-primary-strong uppercase">
                {phaseLabel[timer.phase]}
              </span>
              <span className="timer-digits block text-xl font-extrabold text-ink">
                {display}
              </span>
              <span className="block truncate text-xs font-bold text-muted">
                {activeTask?.title ?? "No active task"}
              </span>
            </span>
            {taskDrawerOpen ? (
              <ChevronDown aria-hidden="true" size={20} />
            ) : (
              <ChevronUp aria-hidden="true" size={20} />
            )}
          </motion.button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
