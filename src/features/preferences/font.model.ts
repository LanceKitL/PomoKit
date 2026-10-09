export const fontOptions = [
  {
    value: "jakarta",
    label: "Plus Jakarta Sans",
    preview: "var(--font-jakarta), sans-serif",
  },
  {
    value: "space",
    label: "Space Grotesk",
    preview: "var(--font-space), sans-serif",
  },
  {
    value: "outfit",
    label: "Outfit",
    preview: "var(--font-outfit), sans-serif",
  },
  {
    value: "lexend",
    label: "Lexend",
    preview: "var(--font-lexend), sans-serif",
  },
  {
    value: "inter",
    label: "Inter",
    preview: "var(--font-inter), sans-serif",
  },
  {
    value: "dm-sans",
    label: "DM Sans",
    preview: "var(--font-dm-sans), sans-serif",
  },
  {
    value: "manrope",
    label: "Manrope",
    preview: "var(--font-manrope), sans-serif",
  },
  {
    value: "nunito-sans",
    label: "Nunito Sans",
    preview: "var(--font-nunito-sans), sans-serif",
  },
] as const

export type FontName = (typeof fontOptions)[number]["value"]

export const defaultFontName: FontName = "jakarta"

export function isFontName(value: unknown): value is FontName {
  return (
    typeof value === "string" &&
    fontOptions.some((font) => font.value === value)
  )
}

export function fontOption(value: FontName) {
  return fontOptions.find((font) => font.value === value) ?? fontOptions[0]
}
