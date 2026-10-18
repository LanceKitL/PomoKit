import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Task } from "@/features/tasks/tasks.model"
import type { TimerState } from "../timer.model"
import FocusOverlay from "./focus-overlay"

const DURATION = 25 * 60

const activeTask: Task = {
  id: "task-1",
  title: "Draft the retro outline",
  status: "todo",
  priority: "high",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  completedAt: null,
}

function timerState(overrides: Partial<TimerState> = {}): TimerState {
  return {
    version: 1,
    phase: "focus",
    status: "idle",
    remainingSeconds: DURATION,
    endAt: null,
    completedFocusSessions: 0,
    activeTaskId: "task-1",
    breakLocked: false,
    checkInPending: false,
    ...overrides,
  }
}

function renderOverlay({
  timer = timerState(),
  locked = false,
  onStartPause = vi.fn(),
  onClose = vi.fn(),
} = {}) {
  return render(
    <FocusOverlay
      timer={timer}
      activeTask={activeTask}
      durationSeconds={DURATION}
      onStartPause={onStartPause}
      onClose={onClose}
      onToggleFloating={vi.fn()}
      floatingOpen={false}
      floatingSupported
      locked={locked}
      fullscreenError={null}
    />,
  )
}

function progressPath(container: HTMLElement) {
  const path = container.querySelector(".focus-dial__svg .stroke-primary")
  expect(path).not.toBeNull()
  return path as SVGPathElement
}

function marker(container: HTMLElement) {
  const group = container.querySelector(".focus-dial__svg g")
  expect(group).not.toBeNull()
  return group as SVGGElement
}

describe("FocusOverlay dial", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ gifs: [] }),
      }))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it("shows a full progress arc and the start control for an idle timer", () => {
    const { container } = renderOverlay()

    const progressbar = screen.getByRole("progressbar")
    expect(progressbar).toHaveAttribute("aria-valuemin", "0")
    expect(progressbar).toHaveAttribute("aria-valuemax", String(DURATION))
    expect(progressbar).toHaveAttribute("aria-valuenow", String(DURATION))
    expect(progressbar).toHaveAttribute("aria-label", "Focus session")

    expect(progressPath(container)).toHaveAttribute("stroke-dasharray", "1 1")
    expect(marker(container)).toHaveAttribute(
      "transform",
      "translate(185.00,100.00)",
    )

    expect(
      screen.getByRole("button", { name: /Start session/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Leave focus mode" }),
    ).toBeInTheDocument()
    expect(
      container.querySelector('p[aria-label="Focus session: 25:00"]'),
    ).toBeInTheDocument()
  })

  it("drains the arc and parks the marker on the left at zero", () => {
    const { container } = renderOverlay({
      timer: timerState({ remainingSeconds: 0 }),
    })

    expect(progressPath(container)).toHaveAttribute("stroke-dasharray", "0 1")
    expect(marker(container)).toHaveAttribute(
      "transform",
      "translate(15.00,100.00)",
    )
  })

  it("draws half the arc with the marker on top of the dial", () => {
    const { container } = renderOverlay({
      timer: timerState({ remainingSeconds: DURATION / 2 }),
    })

    expect(progressPath(container)).toHaveAttribute("stroke-dasharray", "0.5 1")
    expect(marker(container)).toHaveAttribute(
      "transform",
      "translate(100.00,15.00)",
    )
  })

  it("pulses the digits and switches the control to Pause while running", () => {
    const { container } = renderOverlay({
      timer: timerState({ status: "running", remainingSeconds: 65 }),
    })

    expect(screen.getByRole("button", { name: /Pause/i })).toBeInTheDocument()
    expect(
      container.querySelector('p[aria-label="Focus session: 01:05"]'),
    ).toHaveClass("is-running")
  })

  it("does not pulse the digits while paused", () => {
    const { container } = renderOverlay({
      timer: timerState({ status: "paused" }),
    })

    expect(screen.getByRole("button", { name: /Resume/i })).toBeInTheDocument()
    expect(
      container.querySelector('p[aria-label="Focus session: 25:00"]'),
    ).not.toHaveClass("is-running")
  })

  it("keeps the dial but hides the minimize control during a protected break", async () => {
    renderOverlay({
      timer: timerState({
        phase: "short_break",
        status: "running",
        remainingSeconds: 60,
        breakLocked: true,
      }),
      locked: true,
    })

    const progressbar = await screen.findByRole("progressbar")
    expect(progressbar).toHaveAttribute("aria-label", "Short break")
    expect(progressbar).toHaveAttribute("aria-valuenow", "60")
    expect(
      screen.getByText("Break in progress · workspace locked"),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Leave focus mode" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Start session|Pause|Resume/i }),
    ).not.toBeInTheDocument()
  })
})
