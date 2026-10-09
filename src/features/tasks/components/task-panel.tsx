"use client"

import {
  Check,
  Circle,
  CircleDot,
  ListFilter,
  Plus,
  Trash2,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useMemo, useState } from "react"
import Button from "@/components/ui/button"
import Card from "@/components/ui/card"
import { Input } from "@/components/ui/field"
import { cn } from "@/lib/cn"
import {
  sortTasks,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../tasks.model"

type Filter = "all" | TaskStatus

export default function TaskPanel({
  tasks,
  activeTaskId,
  dispatch,
  className,
}: {
  tasks: Task[]
  activeTaskId: string | null
  dispatch: React.Dispatch<import("../tasks.reducer").TasksAction>
  className?: string
}) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [filter, setFilter] = useState<Filter>("all")
  const visibleTasks = useMemo(
    () =>
      sortTasks(tasks).filter(
        (task) => filter === "all" || task.status === filter,
      ),
    [filter, tasks],
  )

  function addTask(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    dispatch({ type: "create", title, priority })
    setTitle("")
  }

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Tasks
          </h2>
        </div>
        <span className="rounded-full bg-lavender px-2.5 py-1 text-xs font-extrabold text-on-accent">
          {tasks.filter((task) => task.status === "in_progress").length} active
        </span>
      </div>

      <form
        className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2"
        onSubmit={addTask}
      >
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task"
          aria-label="Task title"
          maxLength={120}
        />
        <Button
          size="icon"
          type="submit"
          aria-label="Add task"
          disabled={!title.trim()}
        >
          <Plus aria-hidden="true" size={20} />
        </Button>
        <PriorityControl value={priority} onChange={setPriority} />
      </form>

      <div
        role="group"
        className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1"
        aria-label="Filter tasks"
      >
        <ListFilter
          aria-hidden="true"
          className="shrink-0 text-muted"
          size={17}
        />
        {(["all", "todo", "in_progress", "done"] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            className={cn(
              "interactive min-h-11 shrink-0 rounded-lg px-2.5 text-xs font-extrabold",
              filter === value
                ? "bg-ink text-surface"
                : "bg-surface-raised text-muted",
            )}
            onClick={() => setFilter(value)}
          >
            {filterLabel[value]}
          </button>
        ))}
      </div>

      <div
        className="scrollbar-hidden mt-3 max-h-[22rem] min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain"
        aria-live="polite"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visibleTasks.length === 0 ? (
            <div
              key="empty-state"
              className="grid min-h-44 place-items-center rounded-xl border border-dashed border-line p-5 text-center"
            >
              <div>
                <Circle
                  aria-hidden="true"
                  className="mx-auto text-primary"
                  size={30}
                />
                <p className="mt-3 font-extrabold">
                  {tasks.length === 0
                    ? "Your focus list is clear"
                    : "No tasks in this view"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {tasks.length === 0
                    ? "Add one meaningful task to begin."
                    : "Choose another filter to see your tasks."}
                </p>
              </div>
            </div>
          ) : (
            visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                active={task.id === activeTaskId}
                dispatch={dispatch}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}

const filterLabel: Record<Filter, string> = {
  all: "All",
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
}

function TaskRow({
  task,
  active,
  dispatch,
}: {
  task: Task
  active: boolean
  dispatch: React.Dispatch<import("../tasks.reducer").TasksAction>
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        layout: { type: "spring", bounce: 0, duration: 0.3 },
        opacity: { duration: 0.18 },
        y: { duration: 0.2 },
      }}
      className={cn(
        "rounded-xl border bg-surface-raised p-3",
        active ? "border-primary-strong shadow-sm" : "border-line",
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          className={cn(
            "interactive mt-0.5 grid size-11 shrink-0 place-items-center rounded-lg border",
            task.status === "done"
              ? "border-sage bg-sage text-on-accent"
              : "border-line text-muted hover:border-primary",
          )}
          aria-label={
            task.status === "done"
              ? `Reopen ${task.title}`
              : `Complete ${task.title}`
          }
          onClick={() =>
            dispatch({
              type: "set_status",
              id: task.id,
              status: task.status === "done" ? "todo" : "done",
            })
          }
        >
          {task.status === "done" ? (
            <Check aria-hidden="true" size={17} strokeWidth={3} />
          ) : null}
        </button>
        <div className="min-w-0 flex-1 pt-0.5">
          <p
            className={cn(
              "overflow-wrap-anywhere text-lg font-extrabold leading-6 tracking-tight",
              task.status === "done" && "text-muted line-through",
            )}
          >
            {task.title}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-11 min-h-11 shrink-0 text-muted hover:text-danger"
          aria-label={`Delete ${task.title}`}
          onClick={() => dispatch({ type: "delete", id: task.id })}
        >
          <Trash2 aria-hidden="true" size={17} />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line pt-2.5">
        <div>
          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-muted">
            Priority
          </span>
          <PriorityControl
            value={task.priority}
            onChange={(priority) =>
              dispatch({ type: "set_priority", id: task.id, priority })
            }
          />
        </div>
        <div>
          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-muted">
            Status
          </span>
          <StatusControl
            value={task.status}
            onChange={(status) =>
              dispatch({ type: "set_status", id: task.id, status })
            }
          />
        </div>
      </div>
    </motion.article>
  )
}

const priorityDotStyle: Record<TaskPriority, string> = {
  high: "bg-danger",
  medium: "bg-peach",
  low: "bg-sage",
}

function PriorityControl({
  value,
  onChange,
}: {
  value: TaskPriority
  onChange: (value: TaskPriority) => void
}) {
  return (
    <div
      role="group"
      aria-label="Task priority"
      className="inline-flex min-h-11 items-center rounded-lg bg-canvas p-0.5"
    >
      {(["high", "medium", "low"] as TaskPriority[]).map((priority) => (
        <button
          key={priority}
          type="button"
          aria-label={`${priority} priority`}
          aria-pressed={value === priority}
          title={`${priority[0].toUpperCase()}${priority.slice(1)} priority`}
          onClick={() => onChange(priority)}
          className={cn(
            "interactive grid size-10 shrink-0 place-items-center rounded-full",
            value === priority
              ? "bg-surface-raised ring-2 ring-ink ring-offset-2 ring-offset-canvas"
              : "hover:bg-surface-raised",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("size-3 rounded-full", priorityDotStyle[priority])}
          />
        </button>
      ))}
    </div>
  )
}

function StatusControl({
  value,
  onChange,
}: {
  value: TaskStatus
  onChange: (value: TaskStatus) => void
}) {
  const options: Array<{ value: Exclude<TaskStatus, "done">; label: string }> = [
    { value: "todo", label: "To do" },
    { value: "in_progress", label: "Active" },
  ]
  return (
    <div
      role="group"
      aria-label="Task status"
      className="inline-flex min-h-11 items-center rounded-lg bg-canvas p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={value === option.value}
          title={option.label}
          onClick={() => onChange(option.value)}
          className={cn(
            "interactive inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-[11px] font-extrabold",
            value === option.value
              ? "bg-ink text-surface"
              : "text-muted hover:bg-surface-raised hover:text-ink",
          )}
        >
          {option.value === "todo" ? (
            <Circle aria-hidden="true" size={13} />
          ) : (
            <CircleDot aria-hidden="true" size={13} />
          )}
          {option.label}
        </button>
      ))}
    </div>
  )
}
