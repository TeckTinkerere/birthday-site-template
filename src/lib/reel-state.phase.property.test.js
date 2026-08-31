// Feature: vertical-reels-and-burn-ending, Property 2: Phase decision is a total function of viewed state and motion preference
import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { nextPhase, allViewed } from "@/lib/reel-state"

// A reel list with unique src values, a viewed subset (sometimes all of them),
// and a reduced-motion flag.
const scenarioArb = fc
  .uniqueArray(fc.string({ minLength: 1, maxLength: 12 }), {
    minLength: 1,
    maxLength: 8,
  })
  .chain((srcs) => {
    const videos = srcs.map((src, i) => ({ name: `reel-${i}`, src, type: "video/mp4" }))
    // Pick a subset of srcs to mark as viewed; occasionally force "all viewed".
    const viewedSubset = fc.subarray(srcs).chain((subset) =>
      fc.boolean().map((forceAll) => (forceAll ? srcs : subset))
    )
    return fc.record({
      videos: fc.constant(videos),
      viewed: viewedSubset,
      reduceMotion: fc.boolean(),
    })
  })

describe("Property 2: Phase decision is a total function of viewed state and motion preference", () => {
  it("nextPhase returns playing/burning/closed exactly per the rule and never burning under reduced motion", () => {
    fc.assert(
      fc.property(scenarioArb, ({ videos, viewed, reduceMotion }) => {
        const viewedIds = new Set(viewed)
        const phase = nextPhase(viewedIds, videos, reduceMotion)

        // Total function: result is always one of the three phases.
        expect(["playing", "burning", "closed"]).toContain(phase)

        const done = allViewed(viewedIds, videos)

        if (!done) {
          expect(phase).toBe("playing")
        } else if (reduceMotion) {
          expect(phase).toBe("closed")
        } else {
          expect(phase).toBe("burning")
        }

        // Never "burning" under reduced motion.
        if (reduceMotion) {
          expect(phase).not.toBe("burning")
        }
      }),
      { numRuns: 100 }
    )
  })
})
