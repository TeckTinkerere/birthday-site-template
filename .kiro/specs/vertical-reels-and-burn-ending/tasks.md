# Implementation Plan: Vertical Reels and Burn Ending

## Overview

Convert the vertical-reels-and-burn-ending design into incremental coding steps. The plan
starts by extracting the pure state logic into a testable module and setting up a test
runner, so the three correctness properties can be verified with property-based tests
against browser-free helpers. It then extends the visits API, builds the `ReelScroller`
component and its internal pieces, wires the farewell and letter-journey orchestration,
removes the old horizontal Swiper experience, and finishes with lint/build verification.
Each step builds on the previous, ending with everything wired together.

## Tasks

- [x] 1. Extract pure reel-state helpers and set up the test runner
  - [x] 1.1 Create the pure reel-state helper module
    - Create `src/lib/reel-state.js` with browser-free pure functions
    - `addViewed(viewedIds, src)`: returns a new Set adding `src`, leaving other entries intact (idempotent when `src` already present)
    - `allViewed(viewedIds, videos)`: returns true iff every `video.src` appears in `viewedIds`
    - `nextPhase(viewedIds, videos, reduceMotion)`: returns `"playing"` if not all viewed; `"burning"` if all viewed and `reduceMotion` is false; `"closed"` if all viewed and `reduceMotion` is true
    - Export a shared `validateVisitEvent(payload)` predicate encoding the four allowed shapes (chapter, reels-choice, reels-button, reels-timing) plus the allowed chapter/action/phase sets, so both the API route and the property test use one source of truth
    - _Requirements: 4.1, 4.2, 4.5, 6.4_

  - [x] 1.2 Set up vitest and fast-check
    - Add `vitest` and `fast-check` as devDependencies
    - Add a `test` script to `package.json` that runs `vitest --run`
    - Add a minimal `vitest.config` (or equivalent) so tests resolve the `@/` alias used by the project
    - _Requirements: 5 (NFR 5)_

- [x] 1.3 Write property test for the viewed-set logic
  - **Property 1: Viewed-set completion and idempotence**
  - Generate reel lists with unique `src` values and random sequences of view events; assert `addViewed` adds without removing others, re-adding is a no-op, and `allViewed` is true iff every `src` is present
  - Minimum 100 iterations; tag: **Feature: vertical-reels-and-burn-ending, Property 1: Viewed-set completion and idempotence**
  - **Validates: Requirements 4.1**

- [x] 1.4 Write property test for the phase decision function
  - **Property 2: Phase decision is a total function of viewed state and motion preference**
  - Generate reel lists, viewed sets, and reduced-motion flags; assert `nextPhase` returns `playing`/`burning`/`closed` exactly per the rule and never returns `burning` under reduced motion
  - Minimum 100 iterations; tag: **Feature: vertical-reels-and-burn-ending, Property 2: Phase decision is a total function of viewed state and motion preference**
  - **Validates: Requirements 4.2, 4.5**

- [x] 2. Extend the visits API for the new events
  - [x] 2.1 Add reels-button and reels-timing validation and record shape
    - In `src/app/api/visits/route.js`, add `"reels-button"` and `"reels-timing"` to `EVENT_TYPES` and add a `REEL_PHASES` set (`enter`, `exit`)
    - Extend validation: `reels-button` requires `chapter === "farewell"` and no `action`/`phase`; `reels-timing` requires `chapter === "reels"`, `phase` in `REEL_PHASES`, and no `action`; preserve existing `chapter` and `reels-choice` rules
    - Prefer reusing `validateVisitEvent` from `src/lib/reel-state.js` so validation stays single-sourced
    - Add `phase` to the stored record for `reels-timing` events only; keep the server-generated `timestamp`; make no other changes to origin/session/size/rate-limit/record shape
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2.2 Write property test for the visits event validator
  - **Property 3: Visits API accepts an event if and only if it conforms to its schema**
  - Generate valid and malformed payloads (unknown type, wrong chapter, missing/extra fields, invalid action/phase); assert `validateVisitEvent` accepts iff the payload matches exactly one allowed shape
  - Minimum 100 iterations; tag: **Feature: vertical-reels-and-burn-ending, Property 3: Visits API accepts an event if and only if it conforms to its schema**
  - **Validates: Requirements 6.4**

- [x] 2.3 Write unit test for the visits API record shape
  - Assert a stored `reels-timing` record includes `phase` and a server-generated `timestamp`, and that no record includes an IP or location field
  - _Requirements: 6.4_

- [~] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Build the ReelScroller styles and internal pieces
  - [x] 4.1 Create the scroll-snap and effect stylesheet
    - Create `src/components/reel-scroller.module.css`
    - Vertical scroll-snap container (`scroll-snap-type: y mandatory`), one slide per `100dvh` with `scroll-snap-align: start`, portrait video sizing
    - Playback bar styling, fire "burn" keyframe animation (rises and fades to black), and full-screen black closing screen layout
    - _Requirements: 2.1, 2.2, 4.3, 5.1_

  - [x] 4.2 Implement the PlaybackBar piece
    - Add an internal `PlaybackBar` (native `<input type="range">`) inside `src/components/reel-scroller.jsx`
    - `value` reflects `currentTime`, `max` reflects `duration`; `onChange` seeks the active video; `aria-label="Video progress"` with a current-position `aria-valuetext`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.3 Implement the BurnOverlay and ClosingScreen pieces
    - Add internal `BurnOverlay` (full motion only): renders the fire animation, calls `onComplete` on `animationend` with a duration-matched timeout fallback
    - Add internal `ClosingScreen`: fixed full-screen black background, centered text exactly "Have a happy day ahead. I'll miss you.", terminal with no controls or navigation
    - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.3_

- [ ] 5. Implement the ReelScroller component
  - [-] 5.1 Implement fetch, scroll-snap feed, and active-slide playback
    - Create `src/components/reel-scroller.jsx` accepting an optional `onTrack` prop
    - On mount: fetch `/api/videos`, hold `status`/`videos`; emit `onTrack({ type: "reels-timing", chapter: "reels", phase: "enter" })` once
    - Render one video slide per `100dvh` using the module CSS; use `IntersectionObserver` (threshold ~0.6) over `slideRefs` to set `activeIndex`
    - Active reel plays muted with `playsInline` under full motion; others pause; catch and ignore rejected `play()` promises
    - Render the `PlaybackBar` bound to the active reel via `timeupdate`/`durationchange`
    - Handle empty (`status === "ready" && videos.length === 0`) and `error` states with calm messages and no burn
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 3.1, 3.2, 6.2_

  - [~] 5.2 Implement auto-advance, viewed tracking, and the burn/close state machine
    - On active reel `ended`: `scrollIntoView` the next slide; the last reel does not advance or loop
    - Mark a reel viewed (via `addViewed`) on its first `play` while active (full motion) or on becoming the active snapped slide (reduced motion)
    - When `allViewed` is true: emit `onTrack({ type: "reels-timing", chapter: "reels", phase: "exit" })` exactly once, then set `phase` via `nextPhase` (`burning` full motion, `closed` reduced motion)
    - Render `BurnOverlay` when `phase === "burning"` (moving to `closed` on complete) and `ClosingScreen` when `phase === "closed"`; never emit a burn/closing event
    - _Requirements: 2.5, 2.6, 4.1, 4.2, 4.4, 4.5, 6.3, 6.6_

- [~] 5.3 Write unit tests for ReelScroller wiring
  - Emits `reels-timing`/`enter` once on mount; active slide plays and others pause (mocked `play`/`pause`); `ended` scrolls the next slide and the last reel does not advance; reaching all-viewed emits `reels-timing`/`exit` exactly once and no burn/closing event
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 6.2, 6.3, 6.6_

- [~] 5.4 Write unit tests for PlaybackBar, BurnOverlay, and ClosingScreen
  - PlaybackBar tracks `timeupdate` and seeks on change with an accessible label; BurnOverlay `animationend` and the timeout fallback both move to the closing screen; ClosingScreen has a black background, the exact copy, and no navigation controls
  - _Requirements: 3.2, 3.3, 3.4, 4.4, 5.1, 5.2, 5.3_

- [~] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Wire the farewell entry and orchestration
  - [x] 7.1 Replace the farewell text link with a floating entry button
    - In `src/components/farewell.jsx`, remove the `ChapterLink` "Watch a little more" link
    - Add a single small floating native `<button>` fixed near the bottom-center, shown only when `hasReels` is true, with an accessible label (e.g. `aria-label="Watch a few moments in motion"`), keyboard-focusable and operable
    - On activation: emit `onTrack?.({ type: "reels-button", chapter: "farewell" })` then call `onContinue()`; keep the existing "Stay with this a little longer" button and its `reels-choice` "stay" tracking
    - Ensure authored copy contains no em dashes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1_

  - [x] 7.2 Render ReelScroller from LetterJourney
    - In `src/components/letter-journey.jsx`, replace the `ReelOpener` import and render with `ReelScroller`, passing `onTrack`
    - Keep the chapter list and atmosphere map unchanged (`reels` remains the final chapter)
    - _Requirements: 2.8_

- [-] 7.3 Write unit tests for farewell and orchestration
  - Entry button shown only when reels exist and the old link is removed; activating it calls `onContinue` and emits `reels-button`; with consent declined no tracking events are sent; `LetterJourney` renders `ReelScroller` (not `ReelOpener`) for the reels chapter
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.8, 6.5_

- [ ] 8. Remove the old horizontal reel experience
  - [~] 8.1 Delete ReelOpener and its unused styles
    - Delete `src/components/reel-opener.jsx`
    - Remove the now-unused `.reel-*` Swiper styles from `src/app/globals.css`
    - Confirm no remaining references to `ReelOpener` or the removed styles
    - _Requirements: 2.8_

- [~] 9. Final checkpoint - lint and build
  - Run `npm run lint` and `npm run build` and fix any issues; ensure all tests pass
  - _Requirements: 5 (NFR 5)_

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation.
- Property tests validate the three universal correctness properties; unit tests cover
  the UI, wiring, and browser-driven behavior.
- Pure helpers live in `src/lib/reel-state.js` so property tests run without a browser and
  the visits API and component share one validation source.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "4.1"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.2", "2.3", "4.2", "4.3", "7.1", "7.2"] },
    { "id": 3, "tasks": ["5.1", "7.3"] },
    { "id": 4, "tasks": ["5.2"] },
    { "id": 5, "tasks": ["5.3", "5.4", "8.1"] }
  ]
}
```
