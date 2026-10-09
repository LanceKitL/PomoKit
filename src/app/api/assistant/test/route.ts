import { NextResponse } from "next/server"

import type {
  AssistantProvider,
  AssistantTestResponse,
} from "@/features/assistant/assistant.types"

import { assistantConnectionSchema } from "@/features/assistant/assistant.validation"

export const dynamic = "force-dynamic"

const PROVIDER_CONFIG: Record<AssistantProvider, {
  endpoint: string
  model: string
}> = {
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",

    model: "openrouter/free",
  },

  nvidia_nim: {
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",

    model: "meta/llama-3.1-8b-instruct",
  },
}

const TEST_PROMPT = "Reply with exactly: PomoKit connection test successful."

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return failure("INVALID_REQUEST", "Enter a valid provider API key.", 400)
  }

  const parsed = assistantConnectionSchema.safeParse(body)

  if (!parsed.success) {
    return failure(
      "INVALID_REQUEST",

      "Choose a provider and enter a valid API key.",

      400,
    )
  }

  const { provider, apiKey } = parsed.data

  const config = PROVIDER_CONFIG[provider]

  const controller = new AbortController()

  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,

        "Content-Type": "application/json",

        Accept: "application/json",
      },

      body: JSON.stringify({
        model: config.model,

        messages: [{ role: "user", content: TEST_PROMPT }],

        max_tokens: 16,

        temperature: 0,

        stream: false,
      }),

      cache: "no-store",

      signal: controller.signal,
    })

    if (response.status === 401 || response.status === 403) {
      return failure(
        "INVALID_KEY",

        "The provider rejected this key. Check it and try again.",

        401,
      )
    }

    if (response.status === 429) {
      return failure(
        "RATE_LIMITED",

        "The provider is busy. Wait a moment and try again.",

        429,
      )
    }

    if (!response.ok) {
      return failure(
        "PROVIDER_UNAVAILABLE",

        "The provider could not complete the test. Check your model access or usage limits and try again.",

        502,
      )
    }

    const result: unknown = await response.json().catch(() => null)

    if (!hasModelResponse(result)) {
      return failure(
        "PROVIDER_UNAVAILABLE",

        "The provider did not return a model response. Check your model access and try again.",

        502,
      )
    }

    return NextResponse.json<AssistantTestResponse>(
      { ok: true, provider },

      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return failure(
        "TIMEOUT",

        "The model took too long to respond. Try again.",

        504,
      )
    }

    return failure(
      "PROVIDER_UNAVAILABLE",

      "Unable to reach the provider. Check your connection and try again.",

      502,
    )
  } finally {
    clearTimeout(timeout)
  }
}

function hasModelResponse(
  value: unknown,
): value is { choices: Array<{ message: { content: string } }> } {
  if (typeof value !== "object" || value === null || !("choices" in value)) {
    return false
  }

  const choices = value.choices

  if (!Array.isArray(choices) || choices.length === 0) return false

  const firstChoice: unknown = choices[0]

  if (
    typeof firstChoice !== "object" ||
    firstChoice === null ||
    !("message" in firstChoice) ||
    typeof firstChoice.message !== "object" ||
    firstChoice.message === null ||
    !("content" in firstChoice.message)
  ) {
    return false
  }

  return (
    typeof firstChoice.message.content === "string" &&
    firstChoice.message.content.trim().length > 0
  )
}

function failure(
  code: Exclude<AssistantTestResponse, { ok: true }>["code"],

  message: string,

  status: number,
) {
  return NextResponse.json<AssistantTestResponse>(
    { ok: false, code, message },

    { status, headers: { "Cache-Control": "no-store" } },
  )
}
