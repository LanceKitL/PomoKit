import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  defaultThemeName,
  isThemeName,
  swatchVar,
  themeNames,
  themeOption,
  themeOptions,
} from "./themes"

const css = readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf8",
)

describe("theme registry", () => {
  it("has no duplicated theme values", () => {
    const values = themeOptions.map((option) => option.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it("has no duplicated labels", () => {
    const labels = themeOptions.map((option) => option.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it("defaults to a registered theme", () => {
    expect(isThemeName(defaultThemeName)).toBe(true)
  })

  it("falls back to the default for unknown or missing values", () => {
    expect(isThemeName("mint")).toBe(false)
    expect(isThemeName(undefined)).toBe(false)
    expect(themeOption("mint").value).toBe(defaultThemeName)
    expect(themeOption(undefined).value).toBe(defaultThemeName)
  })

  it("keeps themeNames in step with themeOptions", () => {
    expect(themeNames).toEqual(themeOptions.map((option) => option.value))
  })

  it("points every swatch at a colour declared in globals.css", () => {
    for (const value of themeNames) {
      for (const slot of ["canvas", "surface", "accent"] as const) {
        expect(css).toContain(`${swatchVar(value, slot)}:`)
      }
    }
  })
})

describe("theme palettes", () => {
  it("satisfies the gamut, contrast and distinctness contract", () => {
    expect(() =>
      execFileSync(
        process.execPath,
        [path.join(process.cwd(), "scripts/check-themes.mjs")],
        { encoding: "utf8", stdio: "pipe" },
      ),
    ).not.toThrow()
  })
})
