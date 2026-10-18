import type { TimerPhase } from "./timer.model"

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"

const titles: Record<TimerPhase, string> = {
  focus: "Focus session complete",
  short_break: "Short break finished",
  long_break: "Long break finished",
}

const bodies: Record<TimerPhase, string> = {
  focus: "How did it go? Choose what happens next in PomoKit.",
  short_break: "Back to focus whenever you are ready.",
  long_break: "Back to focus whenever you are ready.",
}

function notificationConstructor(): typeof Notification | undefined {
  return typeof window !== "undefined" && typeof Notification !== "undefined"
    ? Notification
    : undefined
}

export function notificationPermissionState(): NotificationPermissionState {
  const notification = notificationConstructor()
  return notification ? notification.permission : "unsupported"
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const notification = notificationConstructor()
  if (!notification) return "unsupported"
  if (notification.permission !== "default") return notification.permission
  try {
    return await notification.requestPermission()
  } catch {
    return "denied"
  }
}

export function notifySessionEnded(ended: TimerPhase) {
  const notification = notificationConstructor()
  if (!notification || notification.permission !== "granted") return
  try {
    new notification(titles[ended], {
      body: bodies[ended],
      tag: "pomokit:session",
    })
  } catch {
    return
  }
}
