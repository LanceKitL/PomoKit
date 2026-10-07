import { afterEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("assistant connection route", () => {
  it("normalizes a successful provider check", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 200 })),
    )
    const response = await POST(
      new Request("http://localhost/api/assistant/test", {
        method: "POST",
        body: JSON.stringify({
          provider: "openrouter",
          apiKey: "sk-or-valid-token",
        }),
      }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, provider: "openrouter" })
  })

  it("returns a controlled invalid-key error without echoing the key", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response('{"secret":"upstream detail"}', { status: 401 }),
        ),
    )
    const apiKey = "sk-or-private-token"
    const response = await POST(
      new Request("http://localhost/api/assistant/test", {
        method: "POST",
        body: JSON.stringify({ provider: "openrouter", apiKey }),
      }),
    )
    const body = JSON.stringify(await response.json())
    expect(response.status).toBe(401)
    expect(body).toContain("INVALID_KEY")
    expect(body).not.toContain(apiKey)
    expect(body).not.toContain("upstream detail")
  })

  it("rejects unknown providers before making an upstream call", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const response = await POST(
      new Request("http://localhost/api/assistant/test", {
        method: "POST",
        body: JSON.stringify({
          provider: "custom",
          apiKey: "long-enough-token",
        }),
      }),
    )
    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
