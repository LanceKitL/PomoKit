import type { Task } from "./tasks.model"

export interface TasksRepository {
  list(): Task[]
  replaceAll(tasks: Task[]): void
  removeAll(): void
}
