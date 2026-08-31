// Pure, browser-free reel-state helpers plus a shared visit-event validator.
// No React, no browser APIs, no Node built-ins so this module runs in vitest
// without a DOM and can be reused by the visits API route.

// Constant sets. These MUST match the values used by the visits API route in
// src/app/api/visits/route.js so validation stays single-sourced.
export const CHAPTERS = ["opening", "memory", "wishes", "farewell", "reels"]
export const EVENT_TYPES = ["chapter", "reels-choice", "reels-button", "reels-timing"]
export const REEL_ACTIONS = ["stay", "watch"]
export const REEL_PHASES = ["enter", "exit"]

const CHAPTER_SET = new Set(CHAPTERS)
const REEL_ACTION_SET = new Set(REEL_ACTIONS)
const REEL_PHASE_SET = new Set(REEL_PHASES)

/**
 * Returns a NEW Set containing every existing entry plus src.
 * Does not mutate the input Set. Idempotent when src is already present.
 */
export function addViewed(viewedIds, src) {
  const next = new Set(viewedIds)
  next.add(src)
  return next
}

/**
 * Returns true iff every video.src in the videos array appears in viewedIds.
 * videos is an array of { name, src, type }.
 *
 * Empty-videos case: with zero videos there is nothing to view, so we return
 * false to avoid falsely triggering completion (and therefore burning/closed)
 * on an empty feed. The ReelScroller derives the empty state separately.
 */
export function allViewed(viewedIds, videos) {
  if (!Array.isArray(videos) || videos.length === 0) return false
  return videos.every((video) => viewedIds.has(video.src))
}

/**
 * Returns the next phase given viewed state and motion preference:
 * - "playing" when not all reels are viewed
 * - "burning" when all viewed and reduceMotion is false
 * - "closed"  when all viewed and reduceMotion is true
 * Never returns "burning" under reduced motion.
 */
export function nextPhase(viewedIds, videos, reduceMotion) {
  if (!allViewed(viewedIds, videos)) return "playing"
  return reduceMotion ? "closed" : "burning"
}

function keysMatch(payload, requiredKeys) {
  const own = Object.keys(payload)
  if (own.length !== requiredKeys.length) return false
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(payload, key))
}

/**
 * Single source of truth for visit-event validation. Returns true iff payload
 * matches EXACTLY one of the four allowed shapes. Rejects non-object/null
 * payloads, unknown types, wrong chapters, invalid action/phase, and any
 * missing or extra keys beyond the matched shape's allowed keys.
 *
 * Allowed shapes:
 * - { type: "chapter", chapter }                      chapter in CHAPTERS
 * - { type: "reels-choice", chapter, action }         chapter in CHAPTERS, action in REEL_ACTIONS
 * - { type: "reels-button", chapter: "farewell" }     chapter exactly "farewell"
 * - { type: "reels-timing", chapter: "reels", phase } chapter exactly "reels", phase in REEL_PHASES
 */
export function validateVisitEvent(payload) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return false

  const { type, chapter, action, phase } = payload

  switch (type) {
    case "chapter":
      return keysMatch(payload, ["type", "chapter"]) && CHAPTER_SET.has(chapter)
    case "reels-choice":
      return (
        keysMatch(payload, ["type", "chapter", "action"]) &&
        CHAPTER_SET.has(chapter) &&
        REEL_ACTION_SET.has(action)
      )
    case "reels-button":
      return keysMatch(payload, ["type", "chapter"]) && chapter === "farewell"
    case "reels-timing":
      return (
        keysMatch(payload, ["type", "chapter", "phase"]) &&
        chapter === "reels" &&
        REEL_PHASE_SET.has(phase)
      )
    default:
      return false
  }
}
