/**
 * Unit tests for Farewell and orchestration wiring (task 7.3).
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.8, 6.5
 *
 * No @testing-library/react — uses react-dom/client directly with jsdom.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createRoot } from "react-dom/client"
import { act } from "react"
import React from "react"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

// ---------------------------------------------------------------------------
// Module-level mocks — declared BEFORE any component import so vi.mock
// hoisting fires before module evaluation.
// ---------------------------------------------------------------------------

vi.mock("@/lib/use-reduce-motion", () => ({
  default: () => false,
}))

// framer-motion: render children without animation so jsdom doesn't trip on
// unsupported WAAPI.
vi.mock("framer-motion", () => {
  const React = require("react")
  const Forward = ({ children, ...rest }) => {
    // Strip framer-motion-specific props before passing to DOM element.
    const {
      initial, animate, exit, transition, whileHover, whileTap,
      whileFocus, whileInView, variants, layout, layoutId,
      ...domProps
    } = rest
    return React.createElement(React.Fragment, null, children)
  }
  const motion = new Proxy({}, {
    get: (_, tag) => Forward,
  })
  return { motion, AnimatePresence: ({ children }) => children }
})

// Import AFTER mocks are registered.
import Farewell from "@/components/farewell.jsx"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VIDEO_A = { name: "a.mp4", src: "/videos/a.mp4", type: "video/mp4" }

function mockFetchWithVideos(videos = [VIDEO_A]) {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ videos }),
    }),
  )
}

function mockFetchEmpty() {
  return mockFetchWithVideos([])
}

// ---------------------------------------------------------------------------
// Per-test container / root lifecycle
// ---------------------------------------------------------------------------

let container
let root

beforeEach(() => {
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
    root.render(<Farewell {...props} />)
  })
  // Let fetch microtasks (json() promise) resolve.
  await act(async () => {})
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("entry button visibility (Req 1.1, 1.3)", () => {
  it("shows the entry button when at least one reel is available", async () => {
    globalThis.fetch = mockFetchWithVideos([VIDEO_A])

    await render({})

    const btn = container.querySelector('[aria-label="Watch a few moments in motion"]')
    expect(btn).not.toBeNull()
  })

  it("hides the entry button when no reels are available", async () => {
    globalThis.fetch = mockFetchEmpty()

    await render({})

    const btn = container.querySelector('[aria-label="Watch a few moments in motion"]')
    expect(btn).toBeNull()
  })
})

describe("old link is removed (Req 1.2)", () => {
  it("has no <a> element with text 'Watch a little more'", async () => {
    globalThis.fetch = mockFetchWithVideos([VIDEO_A])

    await render({})

    const links = Array.from(container.querySelectorAll("a"))
    const watchLink = links.find((el) => el.textContent.includes("Watch a little more"))
    expect(watchLink).toBeUndefined()
  })

  it("has no <a> anchor (text link) anywhere in the component", async () => {
    globalThis.fetch = mockFetchWithVideos([VIDEO_A])

    await render({})

    // The old experience used a ChapterLink (<a>) — make sure no anchor exists.
    const links = container.querySelectorAll("a")
    expect(links).toHaveLength(0)
  })
})

describe("entry button activates correctly (Req 1.4, 6.1)", () => {
  it("calls onContinue and emits reels-button tracking when button is clicked", async () => {
    const onContinue = vi.fn()
    const onTrack = vi.fn()
    globalThis.fetch = mockFetchWithVideos([VIDEO_A])

    await render({ onContinue, onTrack })

    const btn = container.querySelector('[aria-label="Watch a few moments in motion"]')
    expect(btn).not.toBeNull()

    await act(async () => {
      btn.click()
    })

    expect(onTrack).toHaveBeenCalledWith({
      type: "reels-button",
      chapter: "farewell",
    })
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it("calls onContinue before or after onTrack but both happen", async () => {
    const callOrder = []
    const onContinue = vi.fn(() => callOrder.push("continue"))
    const onTrack = vi.fn(() => callOrder.push("track"))
    globalThis.fetch = mockFetchWithVideos([VIDEO_A])

    await render({ onContinue, onTrack })

    const btn = container.querySelector('[aria-label="Watch a few moments in motion"]')
    await act(async () => {
      btn.click()
    })

    expect(callOrder).toContain("continue")
    expect(callOrder).toContain("track")
  })
})

describe("consent declined — no crash and no tracking (Req 6.5)", () => {
  it("does not crash and calls onContinue when onTrack is not provided", async () => {
    const onContinue = vi.fn()
    globalThis.fetch = mockFetchWithVideos([VIDEO_A])

    await render({ onContinue })

    const btn = container.querySelector('[aria-label="Watch a few moments in motion"]')
    expect(btn).not.toBeNull()

    await expect(
      act(async () => {
        btn.click()
      }),
    ).resolves.not.toThrow()

    expect(onContinue).toHaveBeenCalledOnce()
  })

  it("sends no tracking events when onTrack is undefined", async () => {
    // There is no onTrack — any call would throw if the component tried to call
    // a non-function. Verify that the optional-chaining guard means no crash occurs.
    const onContinue = vi.fn()
    globalThis.fetch = mockFetchWithVideos([VIDEO_A])

    await render({ onContinue })

    const btn = container.querySelector('[aria-label="Watch a few moments in motion"]')
    await expect(
      act(async () => {
        btn.click()
      }),
    ).resolves.not.toThrow()

    // onContinue still fires even without onTrack.
    expect(onContinue).toHaveBeenCalledOnce()
  })
})

describe("LetterJourney renders ReelScroller not ReelOpener (Req 2.8)", () => {
  it("letter-journey.jsx imports ReelScroller", () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const src = readFileSync(
      path.resolve(__dirname, "letter-journey.jsx"),
      "utf-8",
    )

    expect(src).toMatch(/import\s+ReelScroller/)
    expect(src).not.toMatch(/import\s+ReelOpener/)
  })

  it("letter-journey.jsx renders ReelScroller for the reels chapter", () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const src = readFileSync(
      path.resolve(__dirname, "letter-journey.jsx"),
      "utf-8",
    )

    // Must render <ReelScroller in the reels branch.
    expect(src).toMatch(/<ReelScroller/)
    // Must not render <ReelOpener anywhere.
    expect(src).not.toMatch(/<ReelOpener/)
  })
})
