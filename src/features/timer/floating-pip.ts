const PIP_WIDTH = 340
const PIP_HEIGHT = 320

const baseStyles = `
html, body { height: 100%; margin: 0; }
body {
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--app-font, var(--font-jakarta)), system-ui, sans-serif;
  overscroll-behavior: none;
}
`

export const floatingUnsupportedMessage =
  "Floating timer needs a Chromium browser such as Chrome, Edge, or Brave."

export const floatingBlockedMessage =
  "The floating window was blocked. Allow pop-ups and try again."

export type FloatingWindowResult =
  | { ok: true; window: Window }
  | { ok: false; reason: "unsupported" | "blocked" }

export function isFloatingTimerSupported() {
  return (
    typeof window !== "undefined" && Boolean(window.documentPictureInPicture)
  )
}

export async function openFloatingWindow(): Promise<FloatingWindowResult> {
  const api =
    typeof window === "undefined" ? undefined : window.documentPictureInPicture
  if (!api) return { ok: false, reason: "unsupported" }
  try {
    const created = await api.requestWindow({
      width: PIP_WIDTH,
      height: PIP_HEIGHT,
    })
    return { ok: true, window: created }
  } catch {
    return { ok: false, reason: "blocked" }
  }
}

export function mirrorThemeAttributes(target: Document) {
  target.documentElement.className = document.documentElement.className
  const font = document.documentElement.dataset.font
  if (font) target.documentElement.dataset.font = font
}

export function copyThemeToWindow(target: Document) {
  const rules: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules ?? [])) {
        rules.push(rule.cssText)
      }
    } catch {
      continue
    }
  }

  const style = target.createElement("style")
  style.textContent = `${rules.join("\n")}\n${baseStyles}`
  target.head.appendChild(style)

  target.documentElement.lang = document.documentElement.lang || "en"
  mirrorThemeAttributes(target)
}
