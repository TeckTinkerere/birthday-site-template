// Feature: vertical-reels-and-burn-ending, Property 1: Viewed-set completion and idempotence
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { addViewed, allViewed } from "@/lib/reel-state"

// A reel list with unique src values, paired with a random sequence of view
// events drawn from those srcs (repeats allowed to exercise idempotence).
const scenarioArb = fc
  .uniqueArray(fc.string({ minLength: 1, maxLength: 12 }), {
    minLength: 1,
    maxLength: 8,
  })
  .chain((srcs) => {
    const videos = srcs.map((src, i) => ({ name: `reel-${i}`, src, type: "video/mp4" }))
    const events = fc.array(fc.constantFrom(...srcs), { minLength: 0, maxLength: 30 })
    return fc.record({ videos: fc.constant(videos), events })
  })

describe("Property 1: Viewed-set completion and idempotence", () => {
  it("addViewed adds without removing others, re-adding is a no-op, allViewed iff all present", () => {
    fc.assert(
      fc.property(scenarioArb, ({ videos, events }) => {
        const srcs = videos.map((v) => v.src)
        let viewed = new Set()

        for (const src of events) {
          const before = new Set(viewed)

          const after = addViewed(viewed, src)

          // addViewed adds the src.
          expect(after.has(src)).toBe(true)

          // Does not remove other existing entries.
          for (const prev of before) {
            expect(after.has(prev)).toBe(true)
          }

          // Re-adding an already-present src is a no-op (contents unchanged).
          if (before.has(src)) {
            expect(after.size).toBe(before.size)
          } else {
            expect(after.size).toBe(before.size + 1)
          }

          // Input Set is not mutated.
          expect(viewed.size).toBe(before.size)

          viewed = after
        }

        // allViewed is true iff every src is present in the viewed set.
        const everyPresent = srcs.every((src) => viewed.has(src))
        expect(allViewed(viewed, videos)).toBe(everyPresent)

        // Adding every src makes allViewed true.
        let full = viewed
        for (const src of srcs) full = addViewed(full, src)
        expect(allViewed(full, videos)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
