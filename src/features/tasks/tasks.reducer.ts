import type { Task, TaskPriority, TaskStatus } from "./tasks.model"

interface HydrateTasksAction {
  type: "hydrate"
  tasks: Task[]
}

interface CreateTaskAction {
  type: "create"
  title: string
  priority: TaskPriority
  now?: string
  id?: string
}

interface RenameTaskAction {
  type: "rename"
  id: string
  title: string
  now?: string
}

interface SetTaskPriorityAction {
  type: "set_priority"
  id: string
  priority: TaskPriority
  now?: string
}

interface SetTaskStatusAction {
  type: "set_status"
  id: string
  status: TaskStatus
  now?: string
}

interface DeleteTaskAction {
  type: "delete"
  id: string
}

export type TasksAction = HydrateTasksAction | CreateTaskAction | RenameTaskAction | SetTaskPriorityAction | SetTaskStatusAction | DeleteTaskAction

export function tasksReducer(state: Task[], action: TasksAction): Task[] {
  if (action.type === "hydrate") return action.tasks
  if (action.type === "delete")
    return state.filter((task) => task.id !== action.id)

  const now =
    "now" in action && action.now ? action.now : new Date().toISOString()

  if (action.type === "create") {
    const title = action.title.trim()
    if (!title) return state
    return [
      ...state,
      {
        id: action.id ?? crypto.randomUUID(),
        title: title.slice(0, 120),
        priority: action.priority,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      },
    ]
  }

  return state.map((task) => {
    if (task.id !== action.id) return task
    if (action.type === "rename") {
      const title = action.title.trim()
      return title
        ? { ...task, title: title.slice(0, 120), updatedAt: now }
        : task
    }
    if (action.type === "set_priority") {
      return { ...task, priority: action.priority, updatedAt: now }
    }
    if (action.type === "set_status") {
      return {
        ...task,
        status: action.status,
        updatedAt: now,
        completedAt: action.status === "done" ? now : null,
      }
    }
    return task
  })
}
