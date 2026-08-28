"use client"

import { useEffect, useRef, useState } from "react"
import useReduceMotion from "@/lib/use-reduce-motion"

/**
 * Aceternity's BackgroundGradientAnimation, rewritten as plain JSX for this
 * project (no shadcn, no `cn`, no TypeScript) and repainted from the original
 * purple/navy to the letter's pink and pale blue.
 *
 * The original is a dark surface with white text on top. This site is the
 * opposite - light ground, dark text - so the blobs are pastel and blended
 * with `multiply`, which tints the ground instead of blowing it out to white.
 * That keeps the text contrast the palette was tuned for.
 *
 * Sits behind everything and never takes a pointer event; the cursor blob
 * follows a window-level listener instead of a hit-testing element.
 */
export default function BackgroundGradientAnimation({
  interactive = true,
  className = "",
}) {
  const reduceMotion = useReduceMotion()
  const interactiveRef = useRef(null)
  const [isSafari, setIsSafari] = useState(false)

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    if (!interactive || reduceMotion) return
    const el = interactiveRef.current
    if (!el) return

    // Target is where the pointer is; current eases toward it every frame.
    // The upstream version lerps inside an effect, so it only advances when a
    // new pointer event lands - it never actually glides. A rAF loop does.
    let curX = 0
    let curY = 0
    let tgX = 0
    let tgY = 0
    let frame = 0

    const onMove = (e) => {
      tgX = e.clientX - window.innerWidth / 2
      tgY = e.clientY - window.innerHeight / 2
    }

    const tick = () => {
      curX += (tgX - curX) / 20
      curY += (tgY - curY) / 20
      el.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(frame)
    }
  }, [interactive, reduceMotion])

  return (
    <div className={`gradient-bg ${className}`} aria-hidden>
      {/* Kept in the render tree rather than display:none - a filter defined
          inside a hidden subtree resolves in current browsers, but a zero-size
          SVG is the version that has never been ambiguous. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className={`gradients-container ${isSafari ? "is-safari" : ""}`}>
        <div className="g g-first" />
        <div className="g g-second" />
        <div className="g g-third" />
        <div className="g g-fourth" />
        <div className="g g-fifth" />
        {interactive && !reduceMotion && <div ref={interactiveRef} className="g g-pointer" />}
      </div>
    </div>
  )
}
