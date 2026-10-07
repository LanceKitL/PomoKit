export type AssistantProvider = "openrouter" | "nvidia_nim"

export type AssistantSession = {
  version: 1
  provider: AssistantProvider
  apiKey: string
}

interface AssistantTestSuccess {
  ok: true
  provider: AssistantProvider
}

interface AssistantTestFailure {
  ok: false
  code: "INVALID_KEY" | "RATE_LIMITED" | "PROVIDER_UNAVAILABLE" | "TIMEOUT" | "INVALID_REQUEST"
  message: string
}

export type AssistantTestResponse = AssistantTestSuccess | AssistantTestFailure
