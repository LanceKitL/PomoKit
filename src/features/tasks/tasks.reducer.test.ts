import { describe, expect, it } from "vitest"
import { sortTasks } from "./tasks.model"
import { tasksReducer } from "./tasks.reducer"

describe("tasks reducer", () => {
  it("creates, prioritizes, completes, and deletes a task", () => {
    const created = tasksReducer([], {
      type: "create",
      id: "task-1",
      title: "  Write the plan  ",
      priority: "medium",
      now: "2025-01-01T00:00:00.000Z",
    })
    expect(created[0]).toMatchObject({
      id: "task-1",
      title: "Write the plan",
      status: "todo",
    })

    const prioritized = tasksReducer(created, {
      type: "set_priority",
      id: "task-1",
      priority: "high",
      now: "2025-01-01T00:01:00.000Z",
    })
    const completed = tasksReducer(prioritized, {
      type: "set_status",
      id: "task-1",
      status: "done",
      now: "2025-01-01T00:02:00.000Z",
    })
    expect(completed[0].completedAt).toBe("2025-01-01T00:02:00.000Z")
    expect(tasksReducer(completed, { type: "delete", id: "task-1" })).toEqual(
      [],
    )
  })

  it("sorts unfinished, high-priority work first", () => {
    const base = {
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      completedAt: null,
    }
    const sorted = sortTasks([
      { ...base, id: "low", title: "Low", priority: "low", status: "todo" },
      {
        ...base,
        id: "done",
        title: "Done",
        priority: "high",
        status: "done",
        completedAt: "2025-01-01T00:01:00.000Z",
      },
      {
        ...base,
        id: "high",
        title: "High",
        priority: "high",
        status: "in_progress",
      },
    ])
    expect(sorted.map((task) => task.id)).toEqual(["high", "low", "done"])
  })
})
