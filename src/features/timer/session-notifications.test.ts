import { afterEach, describe, expect, it, vi } from "vitest"
import {
  notifySessionEnded,
  requestNotificationPermission,
} from "./session-notifications"

type FakeInstance = { title: string; options?: NotificationOptions }

function stubNotification(permission: NotificationPermission) {
  const instances: FakeInstance[] = []
  class FakeNotification {
    static permission: NotificationPermission = permission
    static requestPermission = vi.fn(async () => "granted" as const)
    static instances: FakeInstance[] = instances
    title: string
    options?: NotificationOptions

    constructor(title: string, options?: NotificationOptions) {
      this.title = title
      this.options = options
      instances.push({ title, options })
    }
  }

  vi.stubGlobal("Notification", FakeNotification)
  return { FakeNotification, instances }
}

describe("session notifications", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("fires exactly one tagged notification when permission is granted", async () => {
    const { instances } = stubNotification("granted")

    notifySessionEnded("focus")

    expect(instances).toHaveLength(1)
    expect(instances[0].title).toBe("Focus session complete")
    expect(instances[0].options?.tag).toBe("pomokit:session")
    await expect(requestNotificationPermission()).resolves.toBe("granted")
  })

  it("stays silent while permission has not been granted", () => {
    const { instances } = stubNotification("default")

    notifySessionEnded("short_break")

    expect(instances).toHaveLength(0)
  })

  it("stays silent when permission is denied", () => {
    const { instances } = stubNotification("denied")

    notifySessionEnded("long_break")

    expect(instances).toHaveLength(0)
  })

  it("reports unsupported and never throws without the Notification API", async () => {
    vi.stubGlobal("Notification", undefined)

    expect(() => notifySessionEnded("focus")).not.toThrow()
    await expect(requestNotificationPermission()).resolves.toBe("unsupported")
  })

  it("requests permission once while it is still default", async () => {
    stubNotification("default")

    await expect(requestNotificationPermission()).resolves.toBe("granted")
    expect(
      (Notification as unknown as { requestPermission: ReturnType<typeof vi.fn> })
        .requestPermission,
    ).toHaveBeenCalledTimes(1)
  })
})
