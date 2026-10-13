import { describe, expect, it } from "vitest"
import { createBreakGifPositions } from "./break-gif-layout"

const gifs = [
  { src: "/break/0.gif", aspectRatio: 165 / 294 },
  { src: "/break/1.gif", aspectRatio: 200 / 356 },
  { src: "/break/3.gif", aspectRatio: 200 / 272 },
  { src: "/break/4.gif", aspectRatio: 495 / 498 },
  { src: "/break/5.gif", aspectRatio: 288 / 513 },
  { src: "/break/07.gif", aspectRatio: 200 / 300 },
]

describe("break GIF layout", () => {
  it.each([
    [320, 568],
    [768, 1024],
    [1920, 1080],
  ])("keeps GIFs from overlapping at %i×%i", (width, height) => {
    const positions = createBreakGifPositions(gifs, width, height)

    for (let index = 0; index < positions.length; index += 1) {
      const first = positions[index]

      for (const second of positions.slice(index + 1)) {
        const overlaps =
          first.left < second.left + second.width &&
          first.left + first.width > second.left &&
          first.top < second.top + second.height &&
          first.top + first.height > second.top

        expect(overlaps).toBe(false)
      }
    }
  })

  it("creates one non-overlapping position for every GIF, including uploads", () => {
    const positions = createBreakGifPositions(gifs, 1920, 1080)

    expect(positions.map(({ src }) => src)).toHaveLength(gifs.length)
    expect(positions.map(({ src }) => src)).toContain("/break/07.gif")
  })
})
