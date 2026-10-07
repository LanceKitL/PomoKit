# PomoKit agent guide

PomoKit is a Next.js App Router, React 19, TypeScript, and Tailwind CSS v4 productivity app.

## Runtime and commands

- Node 22 and pnpm 10 are pinned in `.mise.toml`.
- The Figma Make development server is supervised and already running on `$PORT`. Never start another server.
- Use `pnpm format`, `pnpm typecheck`, `pnpm test`, and `pnpm build` for verification.
- Production targets Vercel because `/api/assistant/test` requires a server runtime. The legacy `.figma/make/deploy*` wrappers are static and are not the production deployment path.

## Canonical structure

- `src/app/` — routes, layouts, metadata, global tokens, and Route Handlers.
- `src/features/` — feature-owned models, reducers, repositories, server adapters, and components.
- `src/components/ui/` — shared accessible primitives only.
- `src/components/layout/` — shared application chrome.
- `src/providers/` — root client providers.
- `src/lib/` — genuinely shared infrastructure.
- `docs/architecture.md` — state, route, and boundary decisions.
- `docs/backend-readiness.md` — future backend and BYOK security plan.

## Architecture rules

- Server Components are the default. Add `\"use client\"` only for browser APIs, interactivity, or client-only providers.
- Components do not access localStorage directly. Use feature repository interfaces and local adapters.
- Keep feature types and behavior with the feature. Promote code to shared folders only when at least two features use it.
- Browser records are versioned and namespaced under `pomokit:v1:*`; parsing must fail safely.
- Timer correctness is wall-clock based (`endAt - Date.now()`), not interval-count based.
- Use strict TypeScript and the `@/*` alias for `src/*`.

## Design and accessibility

- Consume semantic colors from `src/app/globals.css`; do not scatter literal colors through components.
- Use Plus Jakarta Sans for interface text and Fraunces sparingly for display moments.
- Use Lucide icons, never emoji as interface controls.
- Preserve native semantics, keyboard access, visible focus states, labels, 44px touch targets, reduced-motion behavior, and status cues beyond color.
- Export route/page components as default exports. Feature utilities and models may use named exports.

## Secret handling

- User provider tokens are session-only. They must never be written to localStorage, logs, URLs, analytics, test snapshots, or rendered error details.
- Provider calls use fixed server-side endpoint allowlists, timeouts, `no-store`, and normalized errors.
- Never forward raw upstream response bodies to the browser.
- A future persistent implementation requires authentication and encrypted server-side token storage.

## Scope discipline

Assistant chat, authentication, a database, and cloud sync are intentionally deferred. Preserve the repository contracts so those can be added without rewriting UI components.
