import { describe, expect, it } from "vitest"
import { GET } from "./route"

describe("GET /api/break-gifs", () => {
  it("discovers GIF assets and returns their dimensions", async () => {
    const response = await GET()
    const body = (await response.json()) as {
      gifs: { src: string; aspectRatio: number }[]
    }

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(body.gifs.length).toBeGreaterThan(0)
    expect(body.gifs.map(({ src }) => src)).toContain("/break/07.gif")
    expect(
      body.gifs.every(
        ({ aspectRatio }) => Number.isFinite(aspectRatio) && aspectRatio > 0,
      ),
    ).toBe(true)
  })
})
