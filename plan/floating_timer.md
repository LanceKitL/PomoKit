Feature Specification: Floating Pomodoro Timer for Next.js
Objective

Implement a floating Pomodoro timer in an existing Next.js application that remains visible above other browser tabs and websites, allowing users to control their focus sessions without returning to the original application tab.

The timer is not a video. It must be a custom HTML interface with interactive controls.

1. Technology Requirements
Framework: Next.js
UI: React client components
Language: TypeScript
Styling: Follow the existing application's design system and styling conventions.
Floating window: Document Picture-in-Picture API.
React portal: Use createPortal to render the timer interface inside the floating window.
Do not install unnecessary dependencies.
2. Core Functionality

Implement the following features:

Display a countdown timer.
Start, pause, resume, and reset the timer.
Open the timer in a separate floating window.
Keep the floating window visible while the user switches to other browser tabs and websites.
Allow timer controls to work inside both the original application and the floating window.
Keep the countdown synchronized between both interfaces.
Display the current session type, such as Focus, Short Break, or Long Break.
Automatically transition between focus and break sessions.
Display a completion notification when a session ends, where browser permissions allow it.
Allow the floating window to close independently without resetting the active session.
3. Floating Window Implementation

Use the Document Picture-in-Picture API:

window.documentPictureInPicture.requestWindow()

Requirements:

Open the floating window only in response to a user interaction, such as clicking a button.
Use a compact, responsive layout suitable for an always-on-top mini-window.
Render the existing timer component into the new window using React's createPortal.
Apply the required styles to the floating document, since the new window does not automatically inherit all styles from the original page.
Provide a clear button to open or restore the floating timer.
Prevent duplicate floating windows. Reuse an existing window when possible.
Handle the floating window's pagehide event and clean up references and portal state.
Handle errors when the browser rejects the request or does not support the API.
Do not use the video Picture-in-Picture API.
4. Timer Architecture

The timer must remain accurate when the original tab is backgrounded or browser timers are throttled.

Do not rely exclusively on decrementing a counter every second.

Instead:

Store the absolute session end timestamp when a session starts.
Calculate remaining time using endTimestamp - Date.now().
Update the displayed countdown periodically.
Recalculate the remaining time when the page becomes visible again.
When the timer is paused, save the remaining duration and clear the active end timestamp.
When resumed, calculate a new end timestamp from the saved remaining duration.
Detect when the session expires and transition to the next session exactly once.

Avoid duplicate intervals, duplicate notifications, and repeated session transitions.

5. Shared State and Synchronization

The main timer and floating timer must use the same React state and callbacks.

Use a single source of truth for:

Remaining time
Session end timestamp
Running or paused status
Current session type
Completed focus sessions
Current Pomodoro cycle

The floating window must not implement a separate countdown state.

If the application already has a timer state management system, extend or reuse it instead of introducing a competing implementation.

6. Recommended Default Session Durations

Make durations configurable.

Focus: 25 minutes
Short break: 5 minutes
Long break: 15 minutes
Long break frequency: After every 4 completed focus sessions

Expected behavior:

Start a focus session.
When focus ends, notify the user and transition to a short break.
After the configured number of completed focus sessions, use a long break instead.
After the break ends, transition to the next focus session.
Allow the user to pause, resume, or reset at any time.

Do not silently restart a completed session without applying the session transition logic.

7. Next.js and TypeScript Requirements
Place browser-dependent code inside a Client Component using "use client".
Do not access window, document, or documentPictureInPicture during server-side rendering.
Use appropriate TypeScript types for the Picture-in-Picture window and portal container.
If the installed TypeScript DOM definitions do not include the Document Picture-in-Picture API, provide a safe local type declaration or a small typed wrapper.
Avoid using any unless absolutely necessary.
Handle component unmounting and event-listener cleanup safely.
Prevent hydration mismatches.
Follow the project's existing folder structure, import aliases, and linting rules.
8. Browser Compatibility and Fallbacks

The Document Picture-in-Picture API is not supported in every browser.

Detect feature support before attempting to open the floating window.
If unsupported, display a clear, user-friendly message.
Keep the normal in-app timer functional even without Picture-in-Picture support.
Do not claim that the timer works above every browser or operating-system window.
Explain that the floating window can remain visible across browser tabs and websites, but generally closes when its originating browser window is closed.
Use HTTPS in production and localhost during development.

If universal support across browsers is required, document the limitations and propose a browser extension or desktop application as a separate solution.

9. Persistence and Reliability

Persist enough timer information to restore the session after a page refresh.

Prefer storing:

Current session type
Session end timestamp or paused remaining duration
Running or paused status
Completed focus-session count
Configured session durations

Use the project's existing persistence mechanism if available. Otherwise, localStorage is acceptable for a single-browser implementation.

On initialization, restore the timer state and determine whether the session is still active or has already expired.

Avoid storing a stale countdown value as the only source of truth.

Keep persistence synchronized with timer actions and avoid overwriting a valid active session with default values during initialization.

10. UI and Accessibility

The floating timer should include:

Current session label
Large, readable countdown
Start or Resume button
Pause button when running
Reset button
Optional progress indicator
Clear focus and break states
Accessible button labels and keyboard interaction
Styling consistent with the main application

Ensure the timer remains usable in the small floating window. Avoid unnecessary page navigation or controls that require returning to the original tab.

11. Implementation Workflow

Before making changes:

Inspect the existing Next.js project structure.
Identify the existing timer implementation, if any.
Identify existing state management, persistence, styling, and notification systems.
Reuse existing components and utilities where appropriate.
Avoid rewriting unrelated parts of the application.

Then:

Implement or refactor the shared timer state.
Implement the Document Picture-in-Picture integration.
Render the shared timer UI into the floating window with a React portal.
Add persistence and session transitions.
Handle unsupported browsers and lifecycle cleanup.
Run the project's linting, type checks, and tests.
Fix any regressions introduced by the implementation.
12. Acceptance Criteria

The implementation is complete only when all applicable criteria pass:

The timer works in the normal Next.js page.
Clicking the floating-window button opens a custom HTML timer.
The floating timer remains visible when switching to other browser tabs and websites.
The countdown continues accurately while the original tab is in the background.
Start, pause, resume, and reset work in both interfaces.
The main timer and floating timer remain synchronized.
Session completion triggers exactly one transition and notification.
Focus, short-break, and long-break cycles work correctly.
Closing the floating window does not stop or reset the timer.
Refreshing the page restores the saved timer state when persistence is enabled.
Unsupported browsers receive a useful fallback.
No server-side rendering errors or hydration mismatches occur.
No duplicate intervals, event listeners, or floating windows are created.
TypeScript, linting, and relevant tests pass.
13. Deliverables

Provide:

A concise summary of the implementation.
A list of files created or modified.
Complete, working code for each modified or new file.
Any required TypeScript declarations.
Setup instructions and browser compatibility notes.
Manual testing instructions.
Any limitations or assumptions.

Do not provide pseudocode in place of required implementation code.

Do not rewrite unrelated features.

If the existing codebase differs from the assumed structure, adapt the implementation to the actual project instead of blindly replacing files.

Final Instruction

Implement this feature directly in the existing Next.js project. Prioritize accurate timer behavior, shared state, browser compatibility, clean lifecycle management, and maintainability. Inspect the existing code before deciding how to integrate the feature.