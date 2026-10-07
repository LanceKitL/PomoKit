# PomoKit architecture

## Route map

- `/` — first-run welcome; returning users continue to `/focus`
- `/onboarding/theme` — live light/dark selection
- `/focus` — timer and task workspace
- `/settings` — theme and timer preferences
- `/settings/assistant` — provider token connection
- `/api/assistant/test` — server-only provider validation

Route pages and layouts remain Server Components. Interactive screens are explicit Client Component islands because they use browser storage, timers, or theme state.

## Feature boundaries

Each feature owns its model, transition logic, persistence interface, adapter, and UI. Components dispatch domain actions and never mutate stored records directly. Shared UI primitives live in `src/components/ui`; shared browser infrastructure lives in `src/lib`.

The current adapters use versioned localStorage records:

- `pomokit:v1:onboarding`
- `pomokit:v1:preferences`
- `pomokit:v1:tasks`
- `pomokit:v1:timer`

Notes use a versioned collection envelope under `pomokit:v1:notes`. Existing
single-note records migrate to the collection on first load. The active note,
note ids, and content remain local to the browser.

Assistant credentials are the exception: `pomokit:v1:assistant-session` uses sessionStorage and is cleared when the browser session ends.

## Timer correctness

Running timers persist an absolute `endAt`. The interface recalculates remaining time from the clock on each visual tick, tab visibility change, and hydration. An interval is only a render trigger; it is not the source of truth. Completed phases transition once to an idle next phase and never auto-start.

## Styling

Tailwind CSS v4 consumes semantic design tokens defined in `src/app/globals.css`. The light and dark modes share token names, which keeps feature components theme-neutral. `next/font` self-hosts Plus Jakarta Sans and Fraunces.

## State choice

Feature reducers and React state are enough for the MVP. A global state package would add coupling without solving a current problem. Repository interfaces are the stable seam for later HTTP/database adapters.
