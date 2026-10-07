export type TaskStatus = "todo" | "in_progress" | "done"
export type TaskPriority = "low" | "medium" | "high"

export type Task = {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export const priorityRank: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1
    if (a.status !== "done" && b.status === "done") return -1
    const priorityDifference =
      priorityRank[b.priority] - priorityRank[a.priority]
    if (priorityDifference !== 0) return priorityDifference
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}
