# Requirements Document

## Introduction

This feature replaces the current horizontal Swiper reel chapter with a full-screen,
vertical, auto-advancing video scroller styled after Instagram Reels. The letter's
"One last thing" (farewell) page gains a small floating button that leads to this video
page. Once every video has been viewed at least once, a fire effect automatically
engulfs the letter content and settles on a quiet black closing screen. The video-page
button click and the visit's entry and exit times are recorded through the existing
consented Upstash Redis logging.

The recipient needs to take no action beyond scrolling: playback, the burn transition,
and the ending are all automatic once the videos have been seen.

## Glossary

- **Reel scroller:** the full-screen vertical video experience that replaces the current
  reels chapter.
- **Reel:** a single portrait video sourced from `public/videos`.
- **Burn effect:** an automatic fire animation that consumes the on-screen letter/reel
  content.
- **Closing screen:** the final black screen reading "Have a happy day ahead. I'll miss you."
- **All-viewed:** the state reached when every discovered reel has played at least once
  while visible on screen.

## Requirements

### Requirement 1: Enter the video page from the farewell

**User Story:** As the recipient, I want a small, unobtrusive way to move from the last
letter page into the videos, so that continuing feels gentle rather than demanded.

#### Acceptance Criteria

1. WHEN the farewell ("One last thing") page is shown AND at least one reel is available
   THEN the system SHALL display a single small floating button that leads to the video page.
2. THE floating entry button SHALL replace the previous "Watch a little more" text link.
3. WHEN no reels are available THEN the system SHALL NOT display the entry button.
4. WHEN the recipient activates the entry button THEN the system SHALL navigate to the
   vertical reel scroller.
5. THE entry button SHALL be keyboard-focusable and operable, with an accessible label.

### Requirement 2: Vertical auto-advancing reel playback

**User Story:** As the recipient, I want the videos to play and advance like Instagram
Reels, so that I can simply watch without managing controls.

#### Acceptance Criteria

1. THE reel scroller SHALL present one portrait video per full screen height.
2. THE reel scroller SHALL snap vertically so that scrolling or swiping settles on a
   single reel at a time.
3. WHEN a reel becomes the active on-screen reel THEN the system SHALL play it.
4. WHEN a reel is no longer the active on-screen reel THEN the system SHALL pause it.
5. WHEN the active reel reaches its end THEN the system SHALL advance to the next reel
   automatically.
6. WHEN the active reel is the last reel AND it reaches its end THEN the system SHALL NOT
   advance beyond the last reel.
7. THE reels SHALL be sourced dynamically from `public/videos` using the existing video
   discovery mechanism.
8. THE reel scroller SHALL be the sole reel experience, replacing the horizontal Swiper
   chapter.

### Requirement 3: Per-video playback bar

**User Story:** As the recipient, I want to see and control progress within each video,
so that I can tell how much is left and move within a clip.

#### Acceptance Criteria

1. THE system SHALL display a playback progress bar for the active reel.
2. THE playback bar SHALL reflect the current playback position as the video plays.
3. WHEN the recipient interacts with the playback bar THEN the system SHALL seek the
   active reel to the selected position.
4. THE playback bar SHALL be keyboard-operable with an accessible label.

### Requirement 4: Automatic burn transition after all reels are viewed

**User Story:** As the recipient, I want the letter to close itself once I have seen the
videos, so that the ending happens naturally without me choosing it.

#### Acceptance Criteria

1. THE system SHALL track which reels have played at least once while visible.
2. WHEN every discovered reel has played at least once THEN the system SHALL
   automatically begin the burn effect without requiring any recipient action.
3. THE burn effect SHALL visually consume the on-screen letter/reel content like fire.
4. WHEN the burn effect completes THEN the system SHALL display the closing screen.
5. IF the recipient has enabled reduced motion THEN the system SHALL transition to the
   closing screen without a motion-heavy fire animation while still ending on the closing
   screen.

### Requirement 5: Closing screen

**User Story:** As the recipient, I want a calm final message, so that the experience
ends on a clear, human note.

#### Acceptance Criteria

1. THE closing screen SHALL present a black background.
2. THE closing screen SHALL display the text "Have a happy day ahead. I'll miss you."
3. THE closing screen SHALL be the terminal state, with no further navigation required.

### Requirement 6: Consented tracking of the video-page button and visit timing

**User Story:** As the letter's author, I want to know she reached and moved through the
videos, so that I have a private record that she looked through the pages.

#### Acceptance Criteria

1. WHEN the recipient activates the video-page entry button AND logging consent has been
   granted THEN the system SHALL record a button-click event through the existing Upstash
   Redis logging.
2. WHEN the recipient enters the video page AND logging consent has been granted THEN the
   system SHALL record an entry time.
3. WHEN every reel has been played at least once (the visit's exit point) AND logging
   consent has been granted THEN the system SHALL record an exit time.
4. THE recorded events SHALL follow the existing consent, signed-session, and privacy
   model, recording no IP address or precise location.
5. WHEN logging consent has not been granted THEN the system SHALL NOT send any of these
   events.
6. THE system SHALL NOT record a separate event for the burn effect or closing screen.

## Non-Functional Requirements

1. **Privacy:** Tracking SHALL reuse the existing opt-in consent flow, HttpOnly signed
   session, and server-side validation; no new personal data categories SHALL be
   introduced.
2. **Accessibility:** Interactive controls (entry button, playback bar) SHALL be
   keyboard-operable and labelled; the ending SHALL remain reachable under reduced motion.
3. **Resilience:** WHEN video discovery returns no reels THEN the farewell SHALL omit the
   entry button and the experience SHALL end at the existing farewell state.
4. **Consistency:** The feature SHALL follow the project's existing typography and tone,
   and SHALL contain no em dashes in authored copy.
5. **Verification:** The implementation SHALL pass `npm run lint` and `npm run build`.

## Out of Scope

- Recording the burn or closing screen as tracking events.
- Any recipient-facing controls for triggering the burn manually.
- Recording exit based on tab close or navigation away (exit is defined solely as all
  reels having played at least once).
