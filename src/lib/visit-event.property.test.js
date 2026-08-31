import { describe, it, expect } from "vitest"
import fc from "fast-check"
import {
  validateVisitEvent,
  CHAPTERS,
  REEL_ACTIONS,
  REEL_PHASES,
} from "@/lib/reel-state"

// Feature: vertical-reels-and-burn-ending, Property 3: Visits API accepts an event if and only if it conforms to its schema

// Reference oracle: independently decides whether a payload matches exactly one
// allowed shape. Kept deliberately explicit so it is not just a copy of the
// implementation under test.
function conformsToSchema(payload) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return false
  const keys = Object.keys(payload)
  const has = (k) => Object.prototype.hasOwnProperty.call(payload, k)
  const exactly = (allowed) =>
    keys.length === allowed.length && allowed.every(has)

  switch (payload.type) {
    case "chapter":
      return exactly(["type", "chapter"]) && CHAPTERS.includes(payload.chapter)
    case "reels-choice":
      return (
        exactly(["type", "chapter", "action"]) &&
        CHAPTERS.includes(payload.chapter) &&
        REEL_ACTIONS.includes(payload.action)
      )
    case "reels-button":
      return exactly(["type", "chapter"]) && payload.chapter === "farewell"
    case "reels-timing":
      return (
        exactly(["type", "chapter", "phase"]) &&
        payload.chapter === "reels" &&
        REEL_PHASES.includes(payload.phase)
      )
    default:
      return false
  }
}

// Small pools that mix valid and invalid tokens so generation covers both
// conforming and malformed payloads (unknown type, wrong chapter, bad
// action/phase).
const typePool = ["chapter", "reels-choice", "reels-button", "reels-timing", "unknown", "", "REELS"]
const chapterPool = [...CHAPTERS, "farewell", "reels", "bogus", "", "Opening"]
const actionPool = [...REEL_ACTIONS, "leave", "", "Stay"]
const phasePool = [...REEL_PHASES, "middle", "", "Enter"]
const extraKeyPool = ["extra", "id", "timestamp", "session"]
const scalarPool = ["x", 1, true, null]

describe("validateVisitEvent (Property 3)", () => {
  it("accepts a payload iff it conforms to exactly one allowed shape", () => {
    // Arbitrary that builds an object out of an arbitrary subset of known keys
    // plus optional extra keys, so missing fields, extra fields, and wrong
    // values all occur across iterations.
    const payloadArb = fc.record(
      {
        type: fc.constantFrom(...typePool),
        chapter: fc.constantFrom(...chapterPool),
        action: fc.constantFrom(...actionPool),
        phase: fc.constantFrom(...phasePool),
        [extraKeyPool[0]]: fc.constantFrom(...scalarPool),
        [extraKeyPool[1]]: fc.constantFrom(...scalarPool),
        [extraKeyPool[2]]: fc.constantFrom(...scalarPool),
        [extraKeyPool[3]]: fc.constantFrom(...scalarPool),
      },
      { requiredKeys: [] },
    )

    fc.assert(
      fc.property(payloadArb, (payload) => {
        expect(validateVisitEvent(payload)).toBe(conformsToSchema(payload))
      }),
      { numRuns: 300 },
    )
  })

  it("rejects non-object payloads", () => {
    const nonObjectArb = fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.constant(undefined),
      fc.array(fc.anything()),
    )

    fc.assert(
      fc.property(nonObjectArb, (payload) => {
        expect(validateVisitEvent(payload)).toBe(false)
      }),
      { numRuns: 100 },
    )
  })

  it("accepts every canonical valid shape", () => {
    const validArb = fc.oneof(
      fc.record({ type: fc.constant("chapter"), chapter: fc.constantFrom(...CHAPTERS) }),
      fc.record({
        type: fc.constant("reels-choice"),
        chapter: fc.constantFrom(...CHAPTERS),
        action: fc.constantFrom(...REEL_ACTIONS),
      }),
      fc.record({ type: fc.constant("reels-button"), chapter: fc.constant("farewell") }),
      fc.record({
        type: fc.constant("reels-timing"),
        chapter: fc.constant("reels"),
        phase: fc.constantFrom(...REEL_PHASES),
      }),
    )

    fc.assert(
      fc.property(validArb, (payload) => {
        expect(validateVisitEvent(payload)).toBe(true)
      }),
      { numRuns: 100 },
    )
  })
})
