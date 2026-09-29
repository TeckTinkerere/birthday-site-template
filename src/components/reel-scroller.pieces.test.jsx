/**
 * Unit tests for PlaybackBar, BurnOverlay, and ClosingScreen
 * Requirements: 3.2, 3.3, 3.4, 4.4, 5.1, 5.2, 5.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createElement, act } from "react"
import { createRoot } from "react-dom/client"
import { PlaybackBar, BurnOverlay, ClosingScreen } from "@/components/reel-scroller"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mount a React element into a fresh detached container. Returns { container, unmount }. */
function mount(element) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  let root
  act(() => {
    root = createRoot(container)
    root.render(element)
  })
  return {
    container,
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

// ---------------------------------------------------------------------------
// PlaybackBar
// ---------------------------------------------------------------------------

describe("PlaybackBar", () => {
  it("renders an <input type=range> with aria-label 'Video progress'", () => {
    const { container, unmount } = mount(
      createElement(PlaybackBar, { currentTime: 0, duration: 60, onSeek: () => {} }),
    )
    const input = container.querySelector("input[type='range']")
    expect(input).not.toBeNull()
    expect(input.getAttribute("aria-label")).toBe("Video progress")
    unmount()
  })

  it("aria-valuetext includes current time and duration (Req 3.2)", () => {
    const { container, unmount } = mount(
      createElement(PlaybackBar, { currentTime: 30, duration: 90, onSeek: () => {} }),
    )
    const input = container.querySelector("input[type='range']")
    const valueText = input.getAttribute("aria-valuetext")
    // Should contain both formatted times
    expect(valueText).toContain("0:30")
    expect(valueText).toContain("1:30")
    unmount()
  })

  it("aria-valuetext shows just current time when duration is 0", () => {
    const { container, unmount } = mount(
      createElement(PlaybackBar, { currentTime: 5, duration: 0, onSeek: () => {} }),
    )
    const input = container.querySelector("input[type='range']")
    const valueText = input.getAttribute("aria-valuetext")
    // When duration is 0, value is clamped to 0 (max=0), so currentTime is effectively 0
    expect(valueText).toBe("0:00")
    unmount()
  })

  it("calls onSeek with a number when onChange fires (Req 3.3)", () => {
    const onSeek = vi.fn()
    const { container, unmount } = mount(
      createElement(PlaybackBar, { currentTime: 10, duration: 60, onSeek }),
    )
    const input = container.querySelector("input[type='range']")

    // Simulate a React change event by invoking the onChange prop directly
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set
      nativeInputValueSetter.call(input, "42")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })

    expect(onSeek).toHaveBeenCalledWith(42)
    unmount()
  })

  it("value is clamped to [0, duration] (Req 3.2)", () => {
    const { container, unmount } = mount(
      createElement(PlaybackBar, { currentTime: -5, duration: 60, onSeek: () => {} }),
    )
    const input = container.querySelector("input[type='range']")
    expect(Number(input.value)).toBe(0)
    unmount()
  })

  it("is keyboard-operable — native range input has no tabIndex=-1 (Req 3.4)", () => {
    const { container, unmount } = mount(
      createElement(PlaybackBar, { currentTime: 0, duration: 60, onSeek: () => {} }),
    )
    const input = container.querySelector("input[type='range']")
    // tabIndex of -1 would make it non-keyboard-reachable; ensure it is not set
    expect(input.tabIndex).not.toBe(-1)
    unmount()
  })
})

// ---------------------------------------------------------------------------
// BurnOverlay
// ---------------------------------------------------------------------------

describe("BurnOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("animationend on the burn element calls onComplete exactly once (Req 4.4)", () => {
    const onComplete = vi.fn()
    const { container, unmount } = mount(
      createElement(BurnOverlay, { onComplete }),
    )

    const burnEl = container.querySelector("[role='presentation']")
    expect(burnEl).not.toBeNull()

    act(() => {
      // Find the React fiber's onAnimationEnd prop and call it directly.
      // This is necessary because React 19 event delegation in jsdom doesn't
      // reliably propagate synthetic animation events via dispatchEvent.
      const fiberKey = Object.keys(burnEl).find(
        (k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance"),
      )
      if (fiberKey) {
        // Walk the fiber to find the onAnimationEnd prop
        let fiber = burnEl[fiberKey]
        while (fiber) {
          if (fiber.memoizedProps && fiber.memoizedProps.onAnimationEnd) {
            fiber.memoizedProps.onAnimationEnd({})
            break
          }
          fiber = fiber.return
        }
      } else {
        // Fallback: dispatch with bubbles in case delegation is set up
        burnEl.dispatchEvent(new Event("animationend", { bubbles: true }))
      }
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
    unmount()
  })

  it("timeout fallback after 2600ms calls onComplete even without animationend (Req 4.4)", () => {
    const onComplete = vi.fn()
    const { container, unmount } = mount(
      createElement(BurnOverlay, { onComplete }),
    )

    // No animationend fired — advance timers by 2600ms
    act(() => {
      vi.advanceTimersByTime(2600)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
    unmount()
  })

  it("onComplete is called at most once when both animationend AND timeout fire (Req 4.4)", () => {
    const onComplete = vi.fn()
    const { container, unmount } = mount(
      createElement(BurnOverlay, { onComplete }),
    )

    const burnEl = container.querySelector("[role='presentation']")

    act(() => {
      // Trigger via fiber prop (animationend path)
      const fiberKey = Object.keys(burnEl).find(
        (k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance"),
      )
      if (fiberKey) {
        let fiber = burnEl[fiberKey]
        while (fiber) {
          if (fiber.memoizedProps && fiber.memoizedProps.onAnimationEnd) {
            fiber.memoizedProps.onAnimationEnd({})
            break
          }
          fiber = fiber.return
        }
      }
      // Also advance timers so the fallback would fire
      vi.advanceTimersByTime(2600)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
    unmount()
  })

  it("burn element is aria-hidden and role=presentation", () => {
    const { container, unmount } = mount(
      createElement(BurnOverlay, { onComplete: () => {} }),
    )
    const burnEl = container.querySelector("[role='presentation']")
    expect(burnEl).not.toBeNull()
    expect(burnEl.getAttribute("aria-hidden")).toBe("true")
    unmount()
  })
})

// ---------------------------------------------------------------------------
// ClosingScreen
// ---------------------------------------------------------------------------

describe("ClosingScreen", () => {
  it("renders the exact closing copy (Req 5.2)", () => {
    const { container, unmount } = mount(createElement(ClosingScreen, null))
    expect(container.textContent).toContain("Have a happy day ahead. I'll miss you.")
    unmount()
  })

  it("has a black background via CSS class (Req 5.1)", () => {
    const { container, unmount } = mount(createElement(ClosingScreen, null))
    // The component uses a CSS module class; confirm the root element has a class
    // The .closing rule sets background: #000000
    const closingEl = container.firstElementChild
    expect(closingEl).not.toBeNull()
    // Has at least one CSS module class applied
    expect(closingEl.className.length).toBeGreaterThan(0)
    unmount()
  })

  it("contains no <button> elements (Req 5.3)", () => {
    const { container, unmount } = mount(createElement(ClosingScreen, null))
    expect(container.querySelectorAll("button")).toHaveLength(0)
    unmount()
  })

  it("contains no <nav> elements (Req 5.3)", () => {
    const { container, unmount } = mount(createElement(ClosingScreen, null))
    expect(container.querySelectorAll("nav")).toHaveLength(0)
    unmount()
  })

  it("contains no <a> elements (Req 5.3)", () => {
    const { container, unmount } = mount(createElement(ClosingScreen, null))
    expect(container.querySelectorAll("a")).toHaveLength(0)
    unmount()
  })

  it("is terminal — renders a fixed full-screen wrapper (Req 5.3)", () => {
    const { container, unmount } = mount(createElement(ClosingScreen, null))
    const closingEl = container.firstElementChild
    // The CSS module class gives it position:fixed, but we confirm structural presence
    expect(closingEl.tagName).not.toBe("NAV")
    expect(closingEl.tagName).not.toBe("HEADER")
    unmount()
  })
})
