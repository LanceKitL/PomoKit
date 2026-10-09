# Backend readiness

## Migration path

The browser adapters are temporary implementations of stable feature boundaries. A backend milestone can replace them with authenticated HTTP adapters:

- `TasksRepository` -> task API/database rows
- `PreferencesRepository` and onboarding -> user preferences
- `TimerRepository` -> current timer plus optional append-only focus-session history
- Assistant session repository -> encrypted user-owned provider credential vault

The UI should continue to call feature actions and repository interfaces rather than fetch endpoints directly.

## Suggested server entities

- `users`
- `tasks` with owner, title, status, priority, and timestamps
- `user_preferences` with theme and timer durations
- `focus_sessions` if history/analytics is introduced
- `provider_credentials` with provider, encrypted payload, key version, and timestamps

Add authentication and owner checks before exposing CRUD APIs. Use migrations and map local IDs/timestamps during an explicit opt-in import rather than silently uploading browser data.

## BYOK security requirements

The MVP sends a token to a same-origin Route Handler only when the user verifies it. The handler sends a short, non-streaming chat-completion prompt to a fixed provider/model allowlist, with a request timeout, no-store responses, and controlled errors. OpenRouter uses its free-model router; NVIDIA NIM uses `meta/llama-3.1-8b-instruct`, so provider usage limits may apply. Tokens and raw upstream bodies are never logged or returned.

Before persistent Assistant chat ships, add:

1. Authentication and CSRF/origin protections appropriate to the chosen auth model.
2. Envelope encryption through a managed KMS; never store plaintext tokens.
3. Per-user and per-IP rate limiting.
4. Secret-safe audit events and structured redaction.
5. Credential rotation/removal and provider revocation guidance.
6. Streaming proxy limits, model allowlists, request/body caps, and abuse monitoring.

Provider URLs must remain server-owned. Do not accept arbitrary proxy destinations from the client.

## Current connection API

`POST /api/assistant/test`

```json
{ \"provider\": \"openrouter\", \"apiKey\": \"user-supplied-token\" }
```

Success means the model returned non-empty chat-completion text and returns `{ \"ok\": true, \"provider\": \"openrouter\" }`. Failures return a controlled code: `INVALID_REQUEST`, `INVALID_KEY`, `RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, or `TIMEOUT`.
