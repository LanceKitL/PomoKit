import {
  Cloud,
  Flame,
  Flower,
  Flower2,
  Gem,
  Leaf,
  Moon,
  MoonStar,
  Palette,
  Sparkles,
  Sun,
  SunMedium,
  Waves,
  type LucideIcon,
} from "lucide-react"

/**
 * The single source of truth for every theme the app offers.
 *
 * Adding a theme here is not enough: `src/app/globals.css` needs a matching
 * class block that declares all sixteen palette tokens, plus the three
 * `--swatch-<name>-*` reference colours. `pnpm themes:check` fails when a theme
 * exists in one place and not the other.
 *
 * Order is light palettes first, then dark. Each palette claims a distinct
 * accent hue so no two options read as the same colour.
 */
export const themeOptions = [
  {
    value: "light",
    label: "Light",
    description: "Warm paper surfaces under a soft violet desk light.",
    appearance: "light",
    Icon: Sun,
  },
  {
    value: "sage",
    label: "Sage",
    description: "Leafy green surfaces for a grounded, quiet desk.",
    appearance: "light",
    Icon: Leaf,
  },
  {
    value: "emerald",
    label: "Emerald",
    description: "Refreshing mint-teal surfaces for an invigorating focus space.",
    appearance: "light",
    Icon: Sparkles,
  },
  {
    value: "ocean",
    label: "Ocean",
    description: "Clear blue surfaces for a crisp, open session.",
    appearance: "light",
    Icon: Waves,
  },
  {
    value: "cloudy",
    label: "Cloudy",
    description: "Soft misty blue-grey surfaces for a cozy, quiet desk.",
    appearance: "light",
    Icon: Cloud,
  },
  {
    value: "sunflower",
    label: "Sunflower",
    description: "Cheerful sky blue surfaces with warm sunflower yellow accents.",
    appearance: "light",
    Icon: Flower,
  },
  {
    value: "citrus",
    label: "Citrus",
    description: "Golden surfaces with an energising, sunlit rhythm.",
    appearance: "light",
    Icon: SunMedium,
  },
  {
    value: "rose",
    label: "Rose",
    description: "Soft blush neutrals for a thoughtful, editorial desk.",
    appearance: "light",
    Icon: Flower2,
  },
  {
    value: "violet",
    label: "Violet",
    description: "Soft lavender-amethyst surfaces for a calm, creative atmosphere.",
    appearance: "light",
    Icon: Palette,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Deep plum surfaces with restful pastel accents.",
    appearance: "dark",
    Icon: Moon,
  },
  {
    value: "midnight",
    label: "Midnight",
    description: "Deep indigo surfaces for a quiet late-night session.",
    appearance: "dark",
    Icon: MoonStar,
  },
  {
    value: "graphite",
    label: "Graphite",
    description: "Ink-dark neutrals with mineral gold for deep work.",
    appearance: "dark",
    Icon: Gem,
  },
  {
    value: "ember",
    label: "Ember",
    description: "Deep espresso surfaces with glowing copper amber accents.",
    appearance: "dark",
    Icon: Flame,
  },
  {
    value: "aurora",
    label: "Aurora",
    description: "Deep teal surfaces with luminous, cool northern-light accents.",
    appearance: "dark",
    Icon: Sparkles,
  },
  {
    value: "orchid",
    label: "Orchid",
    description: "Dusky plum surfaces with vivid orchid accents for a creative night desk.",
    appearance: "dark",
    Icon: Flower,
  },
] as const satisfies ReadonlyArray<{
  value: string
  label: string
  description: string
  appearance: "light" | "dark"
  Icon: LucideIcon
}>

export type ThemeName = typeof themeOptions[number]["value"]

export const themeNames: ThemeName[] = themeOptions.map(
  (option) => option.value,
)

export const defaultThemeName: ThemeName = "light"

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && themeNames.includes(value as ThemeName)
}

export function themeOption(value: string | undefined) {
  return (
    themeOptions.find((option) => option.value === value) ?? themeOptions[0]
  )
}

/** CSS custom property holding one of the three preview colours for a theme. */
export function swatchVar(
  value: ThemeName,
  slot: "canvas" | "surface" | "accent",
) {
  return `--swatch-${value}-${slot}`
}
