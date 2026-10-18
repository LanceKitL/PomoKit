import { afterEach, describe, expect, it, vi } from "vitest"
import {
  copyThemeToWindow,
  isFloatingTimerSupported,
  mirrorThemeAttributes,
  openFloatingWindow,
} from "./floating-pip"

function stubPictureInPicture(value: unknown) {
  Object.defineProperty(window, "documentPictureInPicture", {
    value,
    configurable: true,
    writable: true,
  })
}

describe("floating pip helpers", () => {
  afterEach(() => {
    delete (window as { documentPictureInPicture?: unknown })
      .documentPictureInPicture
    document.documentElement.removeAttribute("class")
    document
      .querySelectorAll("style[data-pip-test]")
      .forEach((style) => style.remove())
    vi.restoreAllMocks()
  })

  it("reports unsupported when the API is missing", async () => {
    expect(isFloatingTimerSupported()).toBe(false)
    await expect(openFloatingWindow()).resolves.toEqual({
      ok: false,
      reason: "unsupported",
    })
  })

  it("opens a window when the browser provides the API", async () => {
    const created = { document: document.implementation.createHTMLDocument() }
    stubPictureInPicture({
      requestWindow: vi.fn().mockResolvedValue(created),
      window: null,
    })

    expect(isFloatingTimerSupported()).toBe(true)
    await expect(openFloatingWindow()).resolves.toEqual({
      ok: true,
      window: created,
    })
    expect(
      (window.documentPictureInPicture as unknown as {
        requestWindow: ReturnType<typeof vi.fn>
      }).requestWindow,
    ).toHaveBeenCalledWith({ width: 340, height: 320 })
  })

  it("maps a rejected window request to a blocked failure", async () => {
    stubPictureInPicture({
      requestWindow: vi.fn().mockRejectedValue(new Error("denied")),
      window: null,
    })

    await expect(openFloatingWindow()).resolves.toEqual({
      ok: false,
      reason: "blocked",
    })
  })

  it("copies theme rules and the html theme class into the target document", () => {
    const source = document.createElement("style")
    source.setAttribute("data-pip-test", "true")
    source.textContent = ".focus-dial { color: rgb(0, 0, 0); }"
    document.head.appendChild(source)
    document.documentElement.className = "dark"

    const target = document.implementation.createHTMLDocument("pip")
    copyThemeToWindow(target)

    const copied = target.querySelector("style:last-of-type")
    expect(copied?.textContent).toContain(".focus-dial")
    expect(copied?.textContent).toContain("var(--canvas)")
    expect(target.documentElement.className).toBe("dark")
    expect(target.head.querySelector("style")).not.toBeNull()
  })

  it("re-mirrors theme and font attributes after the source theme changes", () => {
    const target = document.implementation.createHTMLDocument("pip")
    document.documentElement.className = "dark"
    document.documentElement.dataset.font = "outfit"

    mirrorThemeAttributes(target)

    expect(target.documentElement.className).toBe("dark")
    expect(target.documentElement.dataset.font).toBe("outfit")

    document.documentElement.className = "violet"
    mirrorThemeAttributes(target)

    expect(target.documentElement.className).toBe("violet")
    document.documentElement.removeAttribute("data-font")
  })
})
