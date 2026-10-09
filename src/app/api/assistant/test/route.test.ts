import { afterEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("assistant connection route", () => {
  it("runs an OpenRouter free-model completion before reporting success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: "PomoKit connection test successful." } },
          ],
        }),

        { status: 200 },
      ),
    )

    vi.stubGlobal("fetch", fetchMock)

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

    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",

      expect.objectContaining({
        method: "POST",

        headers: expect.objectContaining({
          Authorization: "Bearer sk-or-valid-token",

          "Content-Type": "application/json",
        }),

        body: JSON.stringify({
          model: "openrouter/free",

          messages: [
            {
              role: "user",

              content:
                "Reply with exactly: PomoKit connection test successful.",
            },
          ],

          max_tokens: 16,

          temperature: 0,

          stream: false,
        }),

        cache: "no-store",
      }),
    )
  })

  it("calls the documented NVIDIA chat model and requires a completion", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: "PomoKit connection test successful." } },
          ],
        }),

        { status: 200 },
      ),
    )

    vi.stubGlobal("fetch", fetchMock)

    const response = await POST(
      new Request("http://localhost/api/assistant/test", {
        method: "POST",

        body: JSON.stringify({
          provider: "nvidia_nim",

          apiKey: "nvapi-valid-token",
        }),
      }),
    )

    expect(response.status).toBe(200)

    expect(await response.json()).toEqual({ ok: true, provider: "nvidia_nim" })

    expect(fetchMock).toHaveBeenCalledWith(
      "https://integrate.api.nvidia.com/v1/chat/completions",

      expect.objectContaining({
        method: "POST",

        headers: expect.objectContaining({
          Authorization: "Bearer nvapi-valid-token",
        }),

        body: expect.stringContaining('"model":"meta/llama-3.1-8b-instruct"'),
      }),
    )
  })

  it("does not report success when the provider returns no model output", async () => {
    vi.stubGlobal(
      "fetch",

      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ choices: [] }), { status: 200 }),
        ),
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

    expect(response.status).toBe(502)

    expect(await response.json()).toMatchObject({
      ok: false,

      code: "PROVIDER_UNAVAILABLE",
    })
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
