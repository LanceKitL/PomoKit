import { z } from "zod"

export const assistantConnectionSchema = z.object({
  provider: z.enum(["openrouter", "nvidia_nim"]),
  apiKey: z.string().trim().min(10).max(512),
})
