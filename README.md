<div align="center">
  <img src="./public/logo.png" alt="PomoKit logo" width="112" />
  <h1>PomoKit</h1>
  <p><strong>A calmer space to plan, focus, and reset.</strong></p>
  <p>
    Organize your tasks, keep your thoughts close, and make time for focused work
    with a flexible Pomodoro workspace.
  </p>
</div>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#get-started">Get started</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="./docs/architecture.md">Architecture</a>
</p>

---

## Features

- **Focus timer** — configurable focus and break sessions, an accurate
  wall-clock countdown, and a distraction-reduced focus mode.
- **Task workspace** — organize work by status and priority, and attach a task
  to the active focus session.
- **Notes** — capture and organize notes alongside your work.
- **Make it yours** — choose a color palette and interface font, with settings
  that adapt to your screen.
- **Sound feedback** — optional button and timer-completion sounds.
- **Assistant connection** — verify an OpenRouter or NVIDIA NIM API key with a
  short test request. Keys are kept only for the browser session.

> **Privacy by default:** Tasks, preferences, timer state, and notes are stored
> in your browser. PomoKit does not currently provide accounts, cloud sync, or
> persistent AI chat. Your provider key is only sent to the selected provider
> when you choose **Verify**.

## Tech stack

| Area | Technology |
| --- | --- |
| App | Next.js App Router, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Motion |
| Tests | Vitest, Testing Library |
| Production hosting | Vercel |

## Get started

### Requirements

- Node.js 22
- pnpm 10 (via Corepack)

### Install and run

```bash
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful commands

```bash
pnpm format       # Format project files
pnpm typecheck    # Check TypeScript
pnpm test         # Run the test suite
pnpm build        # Create a production build
pnpm themes:check # Validate theme tokens
```

No provider secrets are needed to run the app. Users enter their own API key in
Assistant settings; do not add provider keys to `.env`, source control, or
client-side configuration.

## Deployment

PomoKit is a Next.js application and should be deployed to a server-capable
platform such as Vercel. The Assistant verification endpoint uses a server-side
Route Handler, so static-only hosting is not supported.

1. Push the repository to GitHub.
2. Import it as a new project in [Vercel](https://vercel.com/new).
3. Keep the detected Next.js framework and default build settings.
4. Deploy. No environment variables are required for the current MVP.

The API-key verification route calls a fixed allowlist of provider endpoints.
User keys are supplied at runtime and are not deployment secrets.

## Project structure

```text
src/
├── app/          # Routes, metadata, global styles, and Route Handlers
├── components/   # Shared UI and application layout
├── features/     # Feature-owned models, repositories, and screens
├── lib/          # Shared utilities and browser infrastructure
└── providers/    # Root client-side providers
docs/             # Architecture and backend-readiness notes
```

For route boundaries, local persistence, timer behavior, and future backend
considerations, see [Architecture](./docs/architecture.md) and
[Backend readiness](./docs/backend-readiness.md).
