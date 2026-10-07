import { NextResponse } from "next/server"
import type {
  AssistantProvider,
  AssistantTestResponse,
} from "@/features/assistant/assistant.types"
import { assistantConnectionSchema } from "@/features/assistant/assistant.validation"

export const dynamic = "force-dynamic"

const PROVIDER_ENDPOINTS: Record<AssistantProvider, string> = {
  openrouter: "https://openrouter.ai/api/v1/auth/key",
  nvidia_nim: "https://integrate.api.nvidia.com/v1/models",
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return failure("INVALID_REQUEST", "Enter a valid provider token.", 400)
  }

  const parsed = assistantConnectionSchema.safeParse(body)
  if (!parsed.success) {
    return failure(
      "INVALID_REQUEST",
      "Choose a provider and enter a valid token.",
      400,
    )
  }

  const { provider, apiKey } = parsed.data
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(PROVIDER_ENDPOINTS[provider], {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    })

    if (response.ok) {
      return NextResponse.json<AssistantTestResponse>({ ok: true, provider }, {
        headers: { "Cache-Control": "no-store" },
      })
    }
    if (response.status === 401 || response.status === 403) {
      return failure(
        "INVALID_KEY",
        "That token was not accepted. Check it and try again.",
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
    return failure(
      "PROVIDER_UNAVAILABLE",
      "The provider could not verify this token right now.",
      502,
    )
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return failure(
        "TIMEOUT",
        "The provider took too long to respond. Try again.",
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
