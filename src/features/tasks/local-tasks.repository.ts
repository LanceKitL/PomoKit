import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/storage/local-storage"
import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import type { Task } from "./tasks.model"
import type { TasksRepository } from "./tasks.repository"

interface StoredTasks {
  version: 1
  tasks: Task[]
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false
  const task = value as Partial<Task>
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    ["todo", "in_progress", "done"].includes(task.status ?? "") &&
    ["low", "medium", "high"].includes(task.priority ?? "") &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string"
  )
}

export const localTasksRepository: TasksRepository = {
  list() {
    const stored = readStorage<StoredTasks | null>(STORAGE_KEYS.tasks, null)
    if (stored?.version !== 1 || !Array.isArray(stored.tasks)) return []
    return stored.tasks.filter(isTask)
  },
  replaceAll(tasks) {
    writeStorage<StoredTasks>(STORAGE_KEYS.tasks, { version: 1, tasks })
  },
  removeAll() {
    removeStorage(STORAGE_KEYS.tasks)
  },
}
