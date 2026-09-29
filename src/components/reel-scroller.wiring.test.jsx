/**
 * Unit tests for ReelScroller wiring (task 5.3).
 * Requirements: 2.3, 2.4, 2.5, 2.6, 6.2, 6.3, 6.6
 *
 * No @testing-library/react — uses react-dom/client directly with jsdom.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createRoot } from "react-dom/client"
import { act } from "react"
import React from "react"

// ---------------------------------------------------------------------------
// Module-level mocks — declared BEFORE any import of the component so that
// vi.mock hoisting fires before the component module is evaluated.
// ---------------------------------------------------------------------------

vi.mock("@/lib/use-reduce-motion", () => ({
  default: () => false,
}))

vi.mock("@/components/reel-scroller.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}))

// Import AFTER mocks are registered.
import ReelScroller from "@/components/reel-scroller.jsx"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIDEO_A = { name: "a.mp4", src: "/videos/a.mp4", type: "video/mp4" }
const VIDEO_B = { name: "b.mp4", src: "/videos/b.mp4", type: "video/mp4" }

function mockFetch(videos = [VIDEO_A, VIDEO_B]) {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ videos }),
    }),
  )
}

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------

let _ioInstances = []

function setupIO() {
  _ioInstances = []
  globalThis.IntersectionObserver = vi.fn(function (callback) {
    this.observed = []
    this.callback = callback
    this.observe = vi.fn((el) => this.observed.push(el))
    this.unobserve = vi.fn()
    this.disconnect = vi.fn()
    _ioInstances.push(this)
  })
}

function triggerIntersection(slideIndex) {
  if (!_ioInstances.length) return
  const io = _ioInstances[_ioInstances.length - 1]
  if (!io.observed[slideIndex]) return
  act(() => {
    io.callback([{ isIntersecting: true, target: io.observed[slideIndex] }])
  })
}

// ---------------------------------------------------------------------------
// Per-test container / root lifecycle
// ---------------------------------------------------------------------------

let container
let root

beforeEach(() => {
  setupIO()
  HTMLVideoElement.prototype.play = vi.fn(() => Promise.resolve())
  HTMLVideoElement.prototype.pause = vi.fn()
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Shared render helper
// ---------------------------------------------------------------------------

async function render(props = {}) {
  await act(async () => {
    root.render(<ReelScroller {...props} />)
  })
  // Let fetch microtasks (json() promise) resolve.
  await act(async () => {})
}

// ---------------------------------------------------------------------------
// Helpers to stub scrollIntoView on all slide <section> elements.
// Must be called AFTER render so slides exist in the DOM.
// ---------------------------------------------------------------------------

function stubScrollIntoView() {
  const slides = container.querySelectorAll("section")
  const mocks = []
  slides.forEach((slide) => {
    const m = vi.fn()
    slide.scrollIntoView = m
    mocks.push(m)
  })
  return mocks
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("reels-timing enter event (Req 6.2)", () => {
  it("emits enter timing event exactly once on mount", async () => {
    const onTrack = vi.fn()
    globalThis.fetch = mockFetch()

    await render({ onTrack })

    const enterCalls = onTrack.mock.calls.filter(
      ([e]) => e.type === "reels-timing" && e.phase === "enter",
    )
    expect(enterCalls).toHaveLength(1)
    expect(enterCalls[0][0]).toEqual({
      type: "reels-timing",
      chapter: "reels",
      phase: "enter",
    })
  })
})

describe("active slide plays; others pause (Req 2.3, 2.4)", () => {
  it("calls play() on the first video after videos load", async () => {
    globalThis.fetch = mockFetch([VIDEO_A, VIDEO_B])

    await render({})

    expect(HTMLVideoElement.prototype.play).toHaveBeenCalled()
  })

  it("calls pause() on non-active videos", async () => {
    globalThis.fetch = mockFetch([VIDEO_A, VIDEO_B])

    await render({})

    // At least the second video must have been paused when index-0 is active.
    expect(HTMLVideoElement.prototype.pause).toHaveBeenCalled()
  })
})

describe("ended scrolls next slide; last reel does not advance (Req 2.5, 2.6)", () => {
  it("scrolls next slide into view when active reel ends", async () => {
    globalThis.fetch = mockFetch([VIDEO_A, VIDEO_B])

    await render({})

    const scrollMocks = stubScrollIntoView()
    const videos = container.querySelectorAll("video")
    expect(videos).toHaveLength(2)

    await act(async () => {
      videos[0].dispatchEvent(new Event("ended"))
    })

    // Slide 1 should have been scrolled into view.
    expect(scrollMocks[1]).toHaveBeenCalledOnce()
    // Slide 0 should not.
    expect(scrollMocks[0]).not.toHaveBeenCalled()
  })

  it("does NOT scroll past the last reel when the only reel ends", async () => {
    globalThis.fetch = mockFetch([VIDEO_A])

    await render({})

    const scrollMocks = stubScrollIntoView()
    const videos = container.querySelectorAll("video")
    expect(videos).toHaveLength(1)

    await act(async () => {
      videos[0].dispatchEvent(new Event("ended"))
    })

    expect(scrollMocks[0]).not.toHaveBeenCalled()
  })

  it("does NOT advance when the last reel (index 1) fires ended", async () => {
    globalThis.fetch = mockFetch([VIDEO_A, VIDEO_B])

    await render({})

    // Simulate scrolling to slide 1 via IntersectionObserver.
    triggerIntersection(1)
    await act(async () => {})

    const scrollMocks = stubScrollIntoView()
    const videos = container.querySelectorAll("video")

    await act(async () => {
      videos[1].dispatchEvent(new Event("ended"))
    })

    // Neither slide should have been scrolled into view.
    expect(scrollMocks[0]).not.toHaveBeenCalled()
    expect(scrollMocks[1]).not.toHaveBeenCalled()
  })
})

/**
 * Helper: mark all videos as viewed by firing the `play` DOM event on each
 * one while it is the active slide.
 *
 * The component attaches the `play` listener only to videoRefs.current[activeIndex].
 * So to mark video[i] viewed we must first make it active (via IntersectionObserver),
 * then dispatch the `play` event on it.
 */
async function markAllViewed(videos) {
  // Video 0 is already active at index 0 — fire play immediately.
  await act(async () => {
    videos[0].dispatchEvent(new Event("play"))
  })
  await act(async () => {})

  // For each remaining video: advance the active index via IO, then fire play.
  for (let i = 1; i < videos.length; i++) {
    triggerIntersection(i)
    await act(async () => {})
    await act(async () => {
      videos[i].dispatchEvent(new Event("play"))
    })
    await act(async () => {})
  }
}

describe("all-viewed emits reels-timing/exit exactly once; no burn/close event (Req 2.5, 6.3, 6.6)", () => {
  it("emits reels-timing/exit exactly once when all reels have played", async () => {
    const onTrack = vi.fn()
    globalThis.fetch = mockFetch([VIDEO_A, VIDEO_B])

    await render({ onTrack })

    const videos = container.querySelectorAll("video")
    expect(videos).toHaveLength(2)

    await markAllViewed(videos)

    const exitCalls = onTrack.mock.calls.filter(
      ([e]) => e.type === "reels-timing" && e.phase === "exit",
    )
    expect(exitCalls).toHaveLength(1)
    expect(exitCalls[0][0]).toEqual({
      type: "reels-timing",
      chapter: "reels",
      phase: "exit",
    })
  })

  it("emits exit only once even if play fires again after all-viewed", async () => {
    const onTrack = vi.fn()
    globalThis.fetch = mockFetch([VIDEO_A, VIDEO_B])

    await render({ onTrack })

    const videos = container.querySelectorAll("video")

    await markAllViewed(videos)

    // Re-fire play on the currently active video (last one) — should not add a second exit call.
    await act(async () => {
      videos[videos.length - 1].dispatchEvent(new Event("play"))
    })
    await act(async () => {})

    const exitCalls = onTrack.mock.calls.filter(
      ([e]) => e.type === "reels-timing" && e.phase === "exit",
    )
    expect(exitCalls).toHaveLength(1)
  })

  it("never emits a burn or closing-screen tracking event", async () => {
    const onTrack = vi.fn()
    globalThis.fetch = mockFetch([VIDEO_A, VIDEO_B])

    await render({ onTrack })

    const videos = container.querySelectorAll("video")

    await markAllViewed(videos)

    // No call should be for a burn / closing / complete event type.
    const invalid = onTrack.mock.calls.filter(([e]) =>
      ["burn", "burning", "close", "closing", "complete"].includes(e.type),
    )
    expect(invalid).toHaveLength(0)

    // Only valid timing phases appear for reels-timing events.
    const timingCalls = onTrack.mock.calls.filter(([e]) => e.type === "reels-timing")
    for (const [e] of timingCalls) {
      expect(["enter", "exit"]).toContain(e.phase)
    }
  })
})

describe("onTrack is optional (no crash)", () => {
  it("renders without crashing when onTrack is not provided", async () => {
    globalThis.fetch = mockFetch()
    await expect(render({})).resolves.not.toThrow()
  })
})
