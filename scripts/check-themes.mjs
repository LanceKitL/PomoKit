import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function parseOklch(value) {
  const match = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(
    value.trim(),
  )
  if (!match) return null
  return {
    l: Number(match[1]),
    c: Number(match[2]),
    h: Number(match[3]),
  }
}

function oklchToLinearSrgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ]
}

function gamma(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
}

function relativeLuminance(color) {
  const [r, g, b] = oklchToLinearSrgb(color)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

function outOfGamut(color) {
  return oklchToLinearSrgb(color).some((c) => c < -0.001 || c > 1.001)
}

function toOklab(color) {
  const [r, g, b] = oklchToLinearSrgb(color)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function hueDistance(a, b) {
  const d = Math.abs(((a - b + 540) % 360) - 180)
  return d
}

// Composite `fg` at `alpha` over the opaque `bg`, the way the browser paints
// an alpha colour utility. Returns the resulting relative luminance.
function composite(fg, bg, alpha) {
  return alpha * relativeLuminance(fg) + (1 - alpha) * relativeLuminance(bg)
}

function compositeContrast(fg, bg, alpha) {
  const a = composite(fg, bg, alpha)
  const b = relativeLuminance(bg)
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return (hi + 0.05) / (lo + 0.05)
}

function parseThemes(css) {
  const themes = new Map()
  const blockRe = /(?:^|\n)(:root|\.[a-z][a-z-]*)\s*\{([^}]*)\}/g
  let match
  while ((match = blockRe.exec(css)) !== null) {
    const selector = match[1]
    const body = match[2]
    if (!/^(--canvas|{)/.test(body.trim())) continue
    const name = selector === ":root" ? "light" : selector.slice(1)
    const tokens = {}
    for (const line of body.split(";")) {
      const decl = /--([a-z0-9-]+)\s*:\s*([^;]+)/.exec(line)
      if (!decl) continue
      tokens[decl[1]] = decl[2].trim()
    }
    themes.set(name, tokens)
  }
  return themes
}

const REQUIRED = [
  "canvas",
  "surface",
  "surface-raised",
  "ink",
  "muted",
  "line",
  "primary",
  "primary-strong",
  "on-accent",
  "peach",
  "lavender",
  "sage",
  "danger",
  "danger-ink",
  "focus-ring",
  "shadow",
]

const CONTRAST_RULES = [
  ["ink", "canvas", 7],
  ["ink", "surface", 7],
  ["ink", "surface-raised", 7],
  ["muted", "canvas", 4.5],
  ["muted", "surface", 4.5],
  ["muted", "surface-raised", 4.5],
  ["primary-strong", "canvas", 4.5],
  ["primary-strong", "surface", 4.5],
  ["primary-strong", "surface-raised", 4.5],
  ["primary", "on-accent", 4.5],
  ["peach", "on-accent", 4.5],
  ["lavender", "on-accent", 4.5],
  ["sage", "on-accent", 4.5],
  ["danger", "danger-ink", 4.5],
  ["focus-ring", "canvas", 3],
  ["focus-ring", "surface", 3],
]

const SEPARATION_RULES = [
  ["surface", "canvas", 1.05],
  ["surface-raised", "surface", 1.02],
  ["line", "surface", 1.2],
]

const css = await readFile(path.join(root, "src/app/globals.css"), "utf8")
const themes = parseThemes(css)
const failures = []
const warnings = []

if (themes.size === 0) {
  console.error("No theme blocks found in src/app/globals.css")
  process.exit(1)
}

const DARK = new Set([
  "dark",
  "midnight",
  "graphite",
  "ember",
  "aurora",
  "orchid",
])
const HUE_TOLERANCE = 34

const resolved = new Map()

for (const [name, tokens] of themes) {
  for (const key of REQUIRED) {
    if (!(key in tokens)) {
      failures.push(`${name}: missing --${key}`)
    }
  }
  const colors = {}
  for (const [key, raw] of Object.entries(tokens)) {
    if (key === "shadow") continue
    const parsed = parseOklch(raw)
    if (!parsed) {
      if (raw.startsWith("color-mix") || raw.startsWith("var(")) continue
      failures.push(`${name}: --${key} is not a plain oklch() value: ${raw}`)
      continue
    }
    colors[key] = parsed
    if (outOfGamut(parsed)) {
      failures.push(
        `${name}: --${key} oklch(${parsed.l} ${parsed.c} ${parsed.h}) is out of sRGB gamut`,
      )
    }
  }
  resolved.set(name, colors)

  for (const [fg, bg, min] of CONTRAST_RULES) {
    if (!colors[fg] || !colors[bg]) continue
    const ratio = contrast(colors[fg], colors[bg])
    if (ratio < min) {
      failures.push(
        `${name}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1 (needs ${min}:1)`,
      )
    }
  }

  for (const [a, b, min] of SEPARATION_RULES) {
    if (!colors[a] || !colors[b]) continue
    const ratio = contrast(colors[a], colors[b])
    if (ratio < min) {
      failures.push(
        `${name}: ${a} vs ${b} = ${ratio.toFixed(2)}:1 (needs >= ${min}:1)`,
      )
    }
  }

  const hues = ["canvas", "surface", "surface-raised", "ink", "muted", "line"]
    .map((k) => colors[k])
    .filter(Boolean)
  if (hues.length === 6) {
    const base = hues[0]
    for (const color of hues.slice(1)) {
      const d = hueDistance(color.h, base.h)
      if (d > HUE_TOLERANCE) {
        failures.push(
          `${name}: hue drift between canvas (${base.h}) and L=${color.l} token (${color.h}) is ${d.toFixed(0)}deg (max ${HUE_TOLERANCE})`,
        )
      }
    }
  }

  const dark = DARK.has(name)
  if (colors.canvas && dark && colors.canvas.l > 0.4) {
    failures.push(`${name}: expected a dark canvas, got L=${colors.canvas.l}`)
  }
  if (colors.canvas && !dark && colors.canvas.l < 0.85) {
    failures.push(`${name}: expected a light canvas, got L=${colors.canvas.l}`)
  }
  if (colors.ink && dark && colors.ink.l < 0.85) {
    failures.push(
      `${name}: expected light ink on a dark theme, got L=${colors.ink.l}`,
    )
  }
  if (colors.ink && !dark && colors.ink.l > 0.5) {
    failures.push(
      `${name}: expected dark ink on a light theme, got L=${colors.ink.l}`,
    )
  }

  // primary-strong is a text colour, not a chip fill, so it has no floor here.
  for (const accent of ["peach", "lavender", "sage", "primary"]) {
    const color = colors[accent]
    if (!color) continue
    if (color.l < 0.6) {
      failures.push(
        `${name}: --${accent} L=${color.l} is too dark to carry ${accent} ink`,
      )
    }
    if (dark && color.l > 0.9) {
      warnings.push(
        `${name}: --${accent} L=${color.l} is very bright on a dark theme`,
      )
    }
  }
}

// Tinted fills paint a translucent token over an opaque base, then the text
// token sits on the result. Each rule is
// [text, fill, base, fillAlpha, minimum contrast].
//   button secondary hover, notes + assistant status tints, accent callouts.
const TINTED_RULES = [
  ["on-accent", "lavender", "surface", 1, 4.5],
  ["on-accent", "peach", "surface", 1, 4.5],
  ["on-accent", "lavender", "surface-raised", 1, 4.5],
  ["on-accent", "sage", "surface", 1, 4.5],
  ["danger-ink", "danger", "surface", 1, 4.5],
  ["on-accent", "primary", "surface", 1, 4.5],
]

for (const [name, colors] of resolved) {
  for (const [text, fill, base, alpha, min] of TINTED_RULES) {
    if (!colors[text] || !colors[fill] || !colors[base]) continue
    const painted = composite(colors[fill], colors[base], alpha)
    const fg = relativeLuminance(colors[text])
    const ratio =
      (Math.max(painted, fg) + 0.05) / (Math.min(painted, fg) + 0.05)
    if (ratio < min) {
      failures.push(
        `${name}: ${text} on ${fill}/${Math.round(alpha * 100)}% over ${base} = ${ratio.toFixed(2)}:1 (needs ${min}:1)`,
      )
    }
  }
}

// Two palettes read as the same theme when they share an accent hue AND sit at
// the same lightness. Checking hue alone would wrongly reject a light/dark
// pair, so lightness is part of the test.
const names = [...resolved.keys()]
const DUPLICATE_HUE = 25
const NEAR_HUE = 38
const NEUTRAL_CHROMA = 0.015

for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const a = resolved.get(names[i])
    const b = resolved.get(names[j])
    if (!a.primary || !b.primary || !a.canvas || !b.canvas) continue
    const primaryHue = hueDistance(a.primary.h, b.primary.h)
    const canvasHue = hueDistance(a.canvas.h, b.canvas.h)
    const sameLightness =
      Math.abs(a.canvas.l - b.canvas.l) < 0.025 &&
      Math.abs(a.canvas.c - b.canvas.c) < 0.012

    if (primaryHue < DUPLICATE_HUE && sameLightness) {
      failures.push(
        `duplicate palettes: ${names[i]} and ${names[j]} share accent hue ${a.primary.h}/${b.primary.h} at the same lightness`,
      )
      continue
    }

    const sameKind = DARK.has(names[i]) === DARK.has(names[j])
    if (sameKind && primaryHue < NEAR_HUE) {
      warnings.push(
        `${names[i]} and ${names[j]} have close accent hues (${a.primary.h} vs ${b.primary.h})`,
      )
    }
    if (
      sameKind &&
      canvasHue < NEAR_HUE &&
      a.canvas.c > NEUTRAL_CHROMA &&
      b.canvas.c > NEUTRAL_CHROMA
    ) {
      warnings.push(
        `${names[i]} and ${names[j]} have close canvas hues (${a.canvas.h} vs ${b.canvas.h})`,
      )
    }
  }
}

const registry = await readFile(
  path.join(root, "src/lib/themes.ts"),
  "utf8",
).catch(() => null)
if (registry) {
  const registered = [...registry.matchAll(/value:\s*"([a-z]+)"/g)].map(
    (m) => m[1],
  )
  for (const name of themes.keys()) {
    if (!registered.includes(name)) {
      failures.push(
        `${name}: has a palette but is missing from src/lib/themes.ts`,
      )
    }
  }
  for (const name of registered) {
    if (!themes.has(name)) {
      failures.push(`${name}: listed in src/lib/themes.ts but has no palette`)
    }
  }
  const seen = new Set()
  for (const name of registered) {
    if (seen.has(name))
      failures.push(`${name}: duplicated in src/lib/themes.ts`)
    seen.add(name)
  }
} else {
  warnings.push("src/lib/themes.ts not found, skipping registry cross-check")
}

for (const warning of warnings) console.warn(`warn  ${warning}`)
if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL  ${failure}`)
  console.error(
    `\n${failures.length} palette problem(s) across ${themes.size} themes.`,
  )
  process.exit(1)
}

console.log(
  `All ${themes.size} themes pass gamut, contrast, hue-coherence and distinctness checks.`,
)
