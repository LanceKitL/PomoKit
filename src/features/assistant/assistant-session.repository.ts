import { STORAGE_KEYS } from "@/lib/storage/storage-keys"
import type { AssistantSession } from "./assistant.types"

export const assistantSessionRepository = {
  load(): AssistantSession | null {
    if (typeof window === "undefined") return null
    try {
      const value = window.sessionStorage.getItem(STORAGE_KEYS.assistant)
      if (!value) return null
      const session = JSON.parse(value) as Partial<AssistantSession>
      if (
        session.version !== 1 ||
        !["openrouter", "nvidia_nim"].includes(session.provider ?? "") ||
        typeof session.apiKey !== "string"
      ) {
        return null
      }
      return session as AssistantSession
    } catch {
      return null
    }
  },
  save(session: AssistantSession) {
    window.sessionStorage.setItem(
      STORAGE_KEYS.assistant,
      JSON.stringify(session),
    )
  },
  clear() {
    window.sessionStorage.removeItem(STORAGE_KEYS.assistant)
  },
}
