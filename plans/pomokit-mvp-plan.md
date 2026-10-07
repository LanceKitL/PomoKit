# PomoKit MVP Implementation Plan

## 1. Goal

Create the first production-shaped version of **PomoKit**, a pastel productivity application that helps users organize tasks, see priority/status clearly, and stay focused with a Pomodoro workflow.

The first milestone will provide:

- A two-step first-run onboarding flow: welcome, then light/dark theme selection.
- A working Pomodoro workspace with task selection and a distraction-reduced focus mode.
- A task system with clear priority and status controls.
- A functional “Bring my Assistant” provider setup for OpenRouter and NVIDIA NIM, including secure server-side connection testing, but no chat experience yet.
- Local persistence behind replaceable repository interfaces so a future authenticated backend can be added without rewriting the UI.
- Next.js App Router architecture, documentation for future engineers/AI agents, and a Vercel-ready server runtime.

## 2. Confirmed Product Decisions

- **Framework:** Migrate the current empty React/Vite scaffold to Next.js App Router with TypeScript and React 19.
- **Production runtime:** Target Vercel. Figma Make remains the local design/development preview. The current Figma static `dist/` deployment wrapper is not a production path because Route Handlers require a server runtime.
- **MVP scope:** Core productivity vertical slice. Assistant chat is explicitly deferred.
- **Persistence:** Browser-local data implemented through typed adapters. Start with localStorage for onboarding, theme, tasks, and timer preferences/state.
- **BYOK security:** Store provider tokens only in sessionStorage, send them to same-origin Route Handlers only when testing/using a connection, and never persist or log them server-side.
- **Timer:** 25-minute focus, 5-minute short break, 15-minute long break after four completed focus sessions. Users can start, pause, reset, and skip; durations can be edited in settings.
- **Visual direction:** “Pastel focus desk”: lavender workspace, warm cream surfaces, peach/coral accents, subtle geometric line art, Plus Jakarta Sans for interface text, and Fraunces used sparingly for warm display moments.
- **Interface quality guidance:** Apply the `community-skills/community-better-interface` principles during implementation/review, with accessibility, layout, writing, typography, and polish reviewed as one system.

## 3. Scope

### In scope

1. Framework/tooling migration from Vite to Next.js.
2. Responsive welcome and theme-selection routes.
3. Responsive primary workspace with:
   - Pomodoro phase and countdown.
   - Start, pause, reset, and skip controls.
   - Current-task assignment.
   - Focus mode that removes secondary UI without forcing browser fullscreen.
   - Completed focus-session count.
4. Task management with:
   - Create, edit, complete/reopen, and delete actions.
   - Status: `todo`, `in_progress`, `done`.
   - Priority: `low`, `medium`, `high`.
   - Status filtering and priority sorting.
   - A visible non-color cue for every priority/status.
5. Theme and timer preferences.
6. Assistant connection settings with OpenRouter/NVIDIA provider selection, masked token input, session-only retention, remove action, and test-connection behavior.
7. Versioned local storage and clean backend replacement seams.
8. Agent/developer documentation and environment template.
9. Focused unit/component/API tests for high-risk behavior.

### Out of scope for this milestone

- Assistant chat, streaming responses, model selection, prompt history, or tool calling.
- Authentication, user accounts, cloud synchronization, database setup, or server-side token vault.
- Teams, projects, calendars, recurring tasks, due-date notifications, analytics, or gamification.
- Offline service worker/PWA installation.
- Production deployment through Figma’s static deployment scripts.

## 4. Information Architecture and User Flow

### Routes

- `/` — Welcome route.
  - First visit: show “Hi there! Welcome to PomoKit. Let’s get it done.” and a primary **Start focusing** action.
  - Returning users with completed onboarding: redirect to `/focus` after client hydration/persistence check.
- `/onboarding/theme` — Light/dark theme selection.
  - Show two accessible preview cards using the real design tokens.
  - Apply the selected theme immediately.
  - **Continue to PomoKit** saves onboarding completion and navigates to `/focus`.
- `/focus` — Main productivity workspace.
- `/settings` — Preferences for theme and Pomodoro durations, plus a way to replay onboarding/reset local data.
- `/settings/assistant` — Bring my Assistant connection setup.
- `/api/assistant/test` — Server-only POST endpoint for provider credential validation.

Use Next.js route groups/layouts where useful, but preserve these public URLs. Avoid a single giant client component; layouts remain Server Components by default, with focused Client Component islands around browser storage, timer state, theme controls, and forms.

### Main workspace interaction

1. User sees the current focus phase, countdown, selected task, and primary timer action first.
2. Task area groups or filters tasks by status and keeps priority labels visible.
3. Selecting **Focus on this** from a task makes it the active task and marks it `in_progress` if it was `todo`.
4. Starting a focus session begins a timestamp-based countdown.
5. Entering **Focus mode** hides navigation and the full task list, leaving the phase, timer, selected task, and essential controls. A clearly labeled control and `Escape` exit focus mode.
6. Completing a focus interval increments the focus count and advances to the appropriate break. Do not auto-start the next interval.
7. Completing a task keeps it available under the Done filter and clears it as the active task if necessary.

## 5. Initial Design System

The attachment is inspiration, not a literal mobile-phone reproduction. Translate its lavender, peach, coral, cream, rounded blocks, and fine geometric marks into a serious daily productivity workspace.

### Visual principles

- Warm, flat pastel surfaces with enough contrast for WCAG AA text and controls.
- Large calm regions and clear shared alignment edges; do not fill every area with cards.
- Rounded rectangles with concentric radii and restrained layered shadows.
- Thin bespoke geometric line art and small abstract marks as background decoration only; all decorative SVG is hidden from assistive technology.
- No generic AI gradients, sparkle motifs, floating robot heads, excessive pills, glassmorphism, arbitrary bento grids, or decorative metric cards.
- No photography is needed for this utility product.
- Motion is limited to meaningful state changes, uses interruptible CSS transitions, and respects `prefers-reduced-motion`.

### Token roles

Define semantic light and dark tokens once in `app/globals.css` and expose them through Tailwind CSS v4 theme utilities:

- Canvas: lavender in light mode; deep desaturated plum in dark mode.
- Surface: warm cream/light paper; dark aubergine surface.
- Elevated surface: near-white/light blush; slightly lighter dark-plum panel.
- Text: ink plum; warm off-white in dark mode.
- Muted text: mauve gray with verified contrast.
- Primary action: muted coral.
- Secondary/accent: peach and soft apricot.
- Focus accent: periwinkle.
- Success/done: muted sage.
- Destructive: deep rose, used semantically rather than decoratively.
- Border/focus ring/shadow tokens for structure, keyboard focus, and elevation.
- Semantic priority/status tokens must always be paired with text or icons.

Do not scatter literal color values through components. Components consume semantic tokens only.

### Typography

- Use `next/font/google` to self-host **Plus Jakarta Sans** for interface/body text.
- Use **Fraunces** only for the PomoKit wordmark, welcome display line, and occasional focus-phase accent; never for dense controls or task data.
- Use a small semantic scale and tabular numerals for the countdown.
- Use sentence case for interface labels and verb-first action copy.

### Responsive composition

- Desktop: slim navigation rail/header, dominant timer/focus region, and task panel aligned on a shared grid.
- Tablet: timer above task panel with settings/navigation in compact header controls.
- Mobile: single-column flow, sticky essential timer controls only when needed, minimum 44px touch targets, and no clipped horizontal content.
- Derive breakpoints from content fit rather than styling for named devices.

### Iconography and controls

- Add Lucide React for coherent line icons; do not use emoji as interface icons.
- Build a small local component layer (`Button`, `IconButton`, `Card`, `Field`, `Select`, `Badge`, `Dialog` if needed) around native semantics and project tokens.
- Keep native keyboard behavior, visible `:focus-visible` states, proper labels, accessible names for icon-only actions, and status cues beyond color.

## 6. Proposed Folder Structure

```text
src/
  app/
    api/
      assistant/
        test/
          route.ts
    onboarding/
      theme/
        page.tsx
    focus/
      page.tsx
    settings/
      assistant/
        page.tsx
      page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    layout/
    ui/
  features/
    assistant/
      components/
      server/
      assistant.types.ts
      assistant.validation.ts
    onboarding/
      components/
      onboarding.repository.ts
    tasks/
      components/
      tasks.model.ts
      tasks.reducer.ts
      tasks.repository.ts
      local-tasks.repository.ts
    timer/
      components/
      timer.model.ts
      timer.reducer.ts
      timer.repository.ts
      local-timer.repository.ts
    preferences/
      components/
      preferences.model.ts
      preferences.repository.ts
      local-preferences.repository.ts
  providers/
    app-providers.tsx
    theme-provider.tsx
  lib/
    storage/
      local-storage.ts
      storage-keys.ts
    cn.ts
  test/
    setup.ts
public/
docs/
  architecture.md
  backend-readiness.md
AGENTS.md
README.md
.env.example
```

Keep types and behavior close to their feature. Shared code moves to `lib` or `components/ui` only after it is genuinely shared. Use `@/*` as the `src/*` alias.

## 7. Domain Models and State Contracts

### Task

```ts
type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
```

Rules:

- Titles are trimmed, required, and capped at a documented reasonable length.
- IDs use `crypto.randomUUID()` in the browser adapter.
- Sorting is stable: incomplete before completed, priority high-to-low, then most recently updated.
- Reducer/domain functions enforce transitions; presentation components do not mutate arrays directly.

### Timer

```ts
type TimerPhase = "focus" | "short_break" | "long_break";
type TimerStatus = "idle" | "running" | "paused";

type TimerState = {
  phase: TimerPhase;
  status: TimerStatus;
  remainingSeconds: number;
  endAt: number | null;
  completedFocusSessions: number;
  activeTaskId: string | null;
};
```

Use wall-clock timestamps (`endAt - Date.now()`) rather than decrementing an assumed-perfect interval. Reconcile on visibility changes and hydration so background tabs and refreshes do not create drift. Persist a versioned snapshot, but do not auto-start after a completed phase.

### Preferences and onboarding

Persist:

- Schema version.
- Onboarding completion.
- Theme: `light | dark`.
- Focus/short-break/long-break durations.
- Number of focus sessions before a long break (default four).

Use guarded parsing and defaults when storage is missing, malformed, or from an unsupported version. Keep storage keys namespaced, for example `pomokit:v1:tasks`.

## 8. Persistence and Backend-Ready Boundaries

Define repository interfaces used by feature hooks/controllers:

- `TasksRepository`: `list`, `save`, `remove`, `replaceAll`.
- `TimerRepository`: `load`, `save`, `clear`.
- `PreferencesRepository`: `load`, `save`, `reset`.
- `OnboardingRepository`: `isComplete`, `complete`, `reset`.

The MVP injects local adapters. Future HTTP adapters can implement the same contracts. Components must not call localStorage directly.

Document the future server mapping:

- Task repository -> authenticated `/api/tasks` or server actions -> database.
- Preferences/onboarding repository -> user preference record.
- Timer sessions -> append-only focus-session records if analytics/history is added.
- BYOK session token -> encrypted server vault tied to a user, never a plaintext database field.

Do not add a database or fake network layer in this milestone.

## 9. Bring my Assistant Contract

### Client setup

- Provider choices: `openrouter` and `nvidia_nim`.
- Explain that the token lasts only for the current browser tab/session and is removed when the session ends.
- Mask the input, allow reveal/hide, and provide an explicit **Remove token** action.
- Store token and selected provider in sessionStorage through a dedicated assistant session adapter; never localStorage.
- Provide loading, connected, invalid token, rate limited, provider unavailable, timeout, and generic failure states.
- Never display the complete token after entry.

### Route Handler

`POST /api/assistant/test`

Request:

```json
{
  "provider": "openrouter | nvidia_nim",
  "apiKey": "string"
}
```

Success:

```json
{
  "ok": true,
  "provider": "openrouter"
}
```

Failure:

```json
{
  "ok": false,
  "code": "INVALID_KEY | RATE_LIMITED | PROVIDER_UNAVAILABLE | TIMEOUT | INVALID_REQUEST",
  "message": "Safe user-facing guidance"
}
```

Server rules:

- Validate input with a small schema library such as Zod.
- Provider endpoints come from a fixed allowlist; never accept a user-supplied URL.
- Validate OpenRouter through its authenticated key endpoint and NVIDIA NIM through its authenticated OpenAI-compatible models endpoint.
- Apply an abort timeout and `cache: "no-store"`.
- Do not log request bodies, authorization headers, tokens, or raw upstream responses.
- Normalize upstream status codes and return controlled messages; never forward arbitrary provider error bodies to the client.
- Add security headers through Next configuration where appropriate.
- Document that durable rate limiting, audit logging without secrets, authentication, and encrypted token storage are required before adding production chat.

## 10. Next.js Migration and Tooling

1. Replace Vite dependencies/scripts with the current stable Next.js release compatible with React 19.
2. Add the Next App Router files, Next TypeScript configuration, and Tailwind CSS v4 PostCSS integration.
3. Retain strict TypeScript and the `@/*` alias.
4. Remove obsolete Vite entry/config files after the Next entry points are working.
5. Keep `.figma/make/dev` intact because it delegates to `pnpm run dev`; make the new `dev` script bind to the host-provided port/hostname so the supervised preview continues to work.
6. Do not claim the existing `.figma/make/deploy` and `deploy-preview` static wrappers support the server app. Document Vercel deployment and, if those wrappers must be changed during implementation, load the required Make deployment skill before editing them.
7. Add scripts for `dev`, `build`, `start`, `typecheck`, `test`, and `format`.
8. Keep oxfmt as the formatter; add Vitest and React Testing Library for focused tests.
9. Add only dependencies with clear value: Next, Tailwind’s Next/PostCSS package, `next-themes`, Lucide React, Zod, and the test stack. Avoid a global state library for this MVP; feature reducers/context are sufficient.

## 11. Documentation Deliverables

### `AGENTS.md`

Replace the Vite-specific agent guide with durable instructions covering:

- Next.js App Router and server/client boundaries.
- Canonical project structure and feature ownership.
- Exact package-manager, formatting, typecheck, test, and build commands.
- Design-token/component rules and accessibility expectations.
- Storage repository boundaries and “no direct localStorage in components.”
- BYOK secret-handling prohibitions.
- Figma preview versus Vercel production deployment expectations.
- Scope boundaries and pointers to architecture documents.

### `README.md`

Document product purpose, current MVP features, prerequisites, setup, scripts, environment behavior, local preview, Vercel deployment, and known deferred work.

### `docs/architecture.md`

Document route map, Server/Client Component boundaries, feature modules, state flow, repository pattern, timer correctness strategy, theming, and key architectural decisions.

### `docs/backend-readiness.md`

Document future API/database adapters, suggested server entities, authentication boundary, encrypted BYOK vault requirements, migration from local records, security/rate-limit needs, and the assistant provider contract.

### `.env.example`

Include only documented non-secret placeholders if configuration is needed. BYOK tokens must not be represented as server environment variables because they are supplied by each user at runtime.

## 12. Accessibility, Content, and Edge Cases

- Use semantic headings, forms, labels, buttons, navigation, and live regions.
- Keyboard users can complete onboarding, manage tasks, operate the timer, enter/exit focus mode, and configure Assistant settings.
- Timer announcements should be restrained: announce phase changes/completion, not every second.
- Honor reduced motion and maintain visible focus indicators.
- Ensure text and meaningful non-text controls meet WCAG AA contrast in both themes.
- Inputs use at least 16px text on mobile and controls use touch-friendly targets.
- Empty task states explain what tasks are for and offer **Add a task**.
- A missing active task does not block starting a timer.
- Deleting the active task clears the timer’s task reference without stopping the timer.
- Refreshing a running timer recalculates from `endAt`; clock expiry while hidden advances to the next idle phase once.
- Corrupt/old local data falls back safely rather than crashing hydration.
- Theme is applied without a visible flash and hydration warnings are handled correctly.
- Network failures preserve the token in sessionStorage so the user can retry, while **Remove token** clears it immediately.
- Provider responses and credentials are never included in analytics, console output, or rendered error details.

## 13. Implementation Sequence

1. **Migrate the scaffold**
   - Update dependencies, scripts, TypeScript/PostCSS/Next config, and root App Router files.
   - Confirm the supervised development entry remains compatible.
2. **Establish the design foundation**
   - Add fonts, semantic tokens, theme provider, local UI primitives, responsive shell, icon system, and decorative background treatment.
3. **Build onboarding**
   - Implement welcome, theme preview/selection, persistence, returning-user redirect, and reset path.
4. **Implement task domain**
   - Add model/reducer/repository, local adapter, task form/list/filter/sort, active-task selection, empty state, and persistence.
5. **Implement timer domain**
   - Add timestamp-based reducer/hook, phase cycle, persistence, controls, current task, completion behavior, settings, and focus mode.
6. **Compose the `/focus` workspace**
   - Integrate timer and task domains in responsive desktop/tablet/mobile layouts; refine hierarchy and interaction states.
7. **Add Assistant setup**
   - Add session adapter, settings UI, validation schema, provider adapters, test Route Handler, safe normalized errors, and connection state.
8. **Add documentation**
   - Rewrite `AGENTS.md`; create README, architecture, backend-readiness, and environment docs.
9. **Quality pass**
   - Apply the interface-review skill’s full pass across accessibility, layout, writing, typography, and polish.
   - Fix only issues within this milestone’s scope.

## 14. Verification Strategy

### Automated tests

- Timer reducer/state tests:
  - Start/pause/resume/reset/skip.
  - Background elapsed-time reconciliation.
  - Four-focus-session long-break transition.
  - Completion occurs once even across repeated visibility/hydration checks.
- Task reducer/repository tests:
  - Create/update/status/priority/delete.
  - Stable priority/status ordering.
  - Corrupt storage fallback and version handling.
  - Active-task deletion behavior.
- Onboarding/preferences tests:
  - First-run route state, completion, theme persistence, and reset.
- Assistant Route Handler tests with mocked fetch:
  - Both providers’ success paths.
  - Invalid input/key, rate limit, timeout, and unavailable provider mappings.
  - Response never contains the submitted key or uncontrolled upstream body.
- Focused component tests for keyboard-accessible task/timer controls and assistant validation states.

### Required commands

Run the repository’s final documented commands in this order:

1. `pnpm format`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

Do not start another development server. Use the supervised Figma Make preview for visual checks.

### Manual acceptance checks

- Complete the entire first-run flow in light mode and dark mode.
- Refresh at every route and during a running/paused timer.
- Verify returning users bypass onboarding and can intentionally replay/reset it.
- Create tasks at each priority, move them through each status, filter/sort them, select one for focus, and delete the active task.
- Complete/skip enough phases to confirm the long-break rule.
- Enter and exit focus mode by pointer and keyboard.
- Test Assistant connection handling for valid/invalid OpenRouter and NVIDIA credentials without exposing tokens.
- Check narrow mobile, tablet, and wide desktop layouts; verify zoom, wrapping, hit targets, and no horizontal overflow.
- Complete the primary flow keyboard-only and with reduced motion enabled.
- Confirm browser console/server output contains no token values or avoidable hydration/runtime errors.

## 15. Acceptance Criteria

The milestone is complete when:

- The Vite shell has been coherently migrated to a buildable Next.js App Router application.
- A new user can progress from welcome to theme choice to the focus workspace, and a returning user resumes directly in the workspace.
- Tasks persist locally, expose clear status/priority controls, and can be selected as the active focus task.
- The Pomodoro timer remains accurate across pauses, hidden tabs, and refreshes and follows the configured focus/break cycle.
- Focus mode materially reduces distraction without trapping the user.
- Light/dark themes are polished, responsive, accessible, and recognizably derived from the supplied pastel reference without copying its composition.
- OpenRouter/NVIDIA credentials remain session-only and can be validated through a safe server-side endpoint without secret leakage.
- UI code depends on repository contracts rather than storage implementation details.
- Future agents can understand setup, architecture, security boundaries, backend migration points, and exact verification commands from repository documentation.
- Formatting, typecheck, tests, and production build all pass.
