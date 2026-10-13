export type BreakGifPosition = {
  src: string
  left: number
  top: number
  width: number
  height: number
}

export function createBreakGifPositions(
  gifs: { src: string; aspectRatio: number }[],
  viewportWidth: number,
  viewportHeight: number,
  random = Math.random,
): BreakGifPosition[] {
  if (
    gifs.length === 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight)
  ) {
    return []
  }

  const columns = Math.ceil(
    Math.sqrt(gifs.length * (viewportWidth / viewportHeight)),
  )
  const rows = Math.ceil(gifs.length / columns)
  const padding = 8
  const cellWidth = viewportWidth / columns
  const cellHeight = viewportHeight / rows

  if (cellWidth <= padding * 2 || cellHeight <= padding * 2) return []

  const slots = Array.from({ length: gifs.length }, (_, index) => index)
  for (let index = slots.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentSlot = slots[index]
    slots[index] = slots[swapIndex]
    slots[swapIndex] = currentSlot
  }

  return gifs.map(({ src, aspectRatio }, index) => {
    const slot = slots[index]
    const column = slot % columns
    const row = Math.floor(slot / columns)
    const cellLeft = column * cellWidth
    const cellTop = row * cellHeight
    const maxWidth = cellWidth - padding * 2
    const maxHeight = cellHeight - padding * 2
    const width = Math.min(120, maxWidth, maxHeight * aspectRatio)
    const height = width / aspectRatio

    return {
      src,
      left: cellLeft + padding + random() * (maxWidth - width),
      top: cellTop + padding + random() * (maxHeight - height),
      width,
      height,
    }
  })
}
