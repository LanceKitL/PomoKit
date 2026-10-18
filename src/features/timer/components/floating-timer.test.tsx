import React from "react"
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { floatingUnsupportedMessage } from "../floating-pip"
import type { FocusCheckInChoice, TimerState } from "../timer.model"
import FloatingTimer from "./floating-timer"

function timerState(overrides: Partial<TimerState> = {}): TimerState {
  return {
    version: 1,
    phase: "focus",
    status: "idle",
    remainingSeconds: 25 * 60,
    endAt: null,
    completedFocusSessions: 0,
    activeTaskId: null,
    breakLocked: false,
    checkInPending: false,
    ...overrides,
  }
}

function createFakePipWindow() {
  const doc = document.implementation.createHTMLDocument("pip")
  Object.defineProperty(doc, "defaultView", { value: window, configurable: true })
  const target = new EventTarget()
  let tick: (() => void) | null = null
  const fake = {
    document: doc,
    closed: false,
    addEventListener: (type: string, listener: EventListener) =>
      target.addEventListener(type, listener),
    removeEventListener: (type: string, listener: EventListener) =>
      target.removeEventListener(type, listener),
    dispatchEvent: (event: Event) => target.dispatchEvent(event),
    setInterval: (handler: () => void) => {
      tick = handler
      return 1
    },
    clearInterval: () => {
      tick = null
    },
    close: () => {
      fake.closed = true
    },
  }

  return {
    window: fake as unknown as Window,
    doc,
    isClosed: () => fake.closed,
    hasTick: () => tick !== null,
    runTick: () => tick?.(),
    firePageHide: () => target.dispatchEvent(new Event("pagehide")),
  }
}

function stubPictureInPicture(created: Window) {
  const requestWindow = vi.fn().mockResolvedValue(created)
  Object.defineProperty(window, "documentPictureInPicture", {
    value: { requestWindow, window: null },
    configurable: true,
    writable: true,
  })
  return requestWindow
}

describe("FloatingTimer", () => {
  beforeEach(() => {
    delete (window as { documentPictureInPicture?: unknown })
      .documentPictureInPicture
  })

  afterEach(() => {
    cleanup()
    delete (window as { documentPictureInPicture?: unknown })
      .documentPictureInPicture
    vi.restoreAllMocks()
  })

  function baseProps(overrides: Partial<Parameters<typeof FloatingTimer>[0]> = {}) {
    return {
      timer: timerState(),
      activeTask: null,
      durationSeconds: 25 * 60,
      open: true,
      onOpenChange: vi.fn(),
      onStatus: vi.fn(),
      onStartPause: vi.fn(),
      onReset: vi.fn(),
      onCheckIn: vi.fn<(choice: FocusCheckInChoice) => void>(),
      onTick: vi.fn(),
      ...overrides,
    }
  }

  it("renders the compact timer into the floating window and starts from there", async () => {
    const pip = createFakePipWindow()
    stubPictureInPicture(pip.window)
    const props = baseProps()

    render(<FloatingTimer {...props} />)

    await waitFor(() =>
      expect(pip.doc.body.textContent).toContain("Focus session"),
    )
    expect(pip.doc.body.textContent).toContain("25:00")

    const start = Array.from(pip.doc.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Start"),
    )
    expect(start).toBeTruthy()
    fireEvent.click(start as Element)
    expect(props.onStartPause).toHaveBeenCalledTimes(1)
  })

  it("reuses one window across re-renders and drives ticks from its own interval", async () => {
    const pip = createFakePipWindow()
    const requestWindow = stubPictureInPicture(pip.window)
    const props = baseProps()
    const { rerender } = render(<FloatingTimer {...props} />)

    await waitFor(() =>
      expect(pip.doc.body.textContent).toContain("Focus session"),
    )

    rerender(
      <FloatingTimer
        {...props}
        timer={timerState({ status: "running", remainingSeconds: 1500 })}
      />,
    )

    await waitFor(() => expect(requestWindow).toHaveBeenCalledTimes(1))
    expect(pip.hasTick()).toBe(true)

    act(() => pip.runTick())
    expect(props.onTick).toHaveBeenCalled()
  })

  it("reports closure from the floating window without touching timer state", async () => {
    const pip = createFakePipWindow()
    stubPictureInPicture(pip.window)
    const props = baseProps()
    const { unmount } = render(<FloatingTimer {...props} />)

    await waitFor(() =>
      expect(pip.doc.body.textContent).toContain("Focus session"),
    )

    act(() => pip.firePageHide())
    expect(props.onOpenChange).toHaveBeenCalledWith(false)

    unmount()
    expect(pip.isClosed()).toBe(true)
  })

  it("fails with a friendly status when the browser has no floating window API", async () => {
    const props = baseProps()

    render(<FloatingTimer {...props} />)

    await waitFor(() =>
      expect(props.onStatus).toHaveBeenCalledWith(floatingUnsupportedMessage),
    )
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows the check-in choices inside the floating window", async () => {
    const pip = createFakePipWindow()
    stubPictureInPicture(pip.window)
    const props = baseProps({
      timer: timerState({
        checkInPending: true,
        phase: "short_break",
        remainingSeconds: 5 * 60,
      }),
    })

    render(<FloatingTimer {...props} />)

    await waitFor(() =>
      expect(pip.doc.body.textContent).toContain("Keep working"),
    )

    const takeBreak = Array.from(pip.doc.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Take a break"),
    )
    fireEvent.click(takeBreak as Element)
    expect(props.onCheckIn).toHaveBeenCalledWith("break")
  })
})
