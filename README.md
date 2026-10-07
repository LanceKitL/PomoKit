# PomoKit

PomoKit is a calm productivity workspace for organizing tasks, making priority visible, and focusing on one thing at a time.

## Current MVP

- Welcome and light/dark theme onboarding
- Versioned local task storage with priority, status, filtering, and active-task focus
- Accurate 25/5/15 Pomodoro cycle with configurable durations
- Distraction-reduced focus mode
- Session-only OpenRouter and NVIDIA NIM token validation
- Backend-ready repository boundaries

Assistant chat, accounts, cloud sync, and database persistence are intentionally deferred.

## Stack

- Next.js App Router and React 19
- TypeScript
- Tailwind CSS v4
- next-themes
- Vitest and Testing Library

## Local development

The Figma Make preview server is managed by the host and starts `pnpm run dev` automatically. Do not start a second server.

```bash
pnpm install
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

No provider keys belong in `.env`. Each user supplies a token at runtime; it is retained only in sessionStorage and sent to a same-origin Route Handler for validation.

## Deployment

Deploy the repository as a Next.js application on Vercel. Route Handlers require a server runtime, so the legacy Figma static `dist/` deployment wrappers are not a production target.

See [architecture](docs/architecture.md) and [backend readiness](docs/backend-readiness.md) for implementation boundaries and future work.
