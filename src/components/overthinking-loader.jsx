"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"

const PHRASE = "I am Overthinking..."

/**
 * The opening curtain. It holds for `duration` and then lifts, which is the
 * only moment on the site that deliberately makes someone wait - the joke
 * being that the wait is the point.
 */
export default function OverthinkingLoader({ duration = 5000, onDone }) {
  const reduceMotion = useReduceMotion()
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Reduced motion gets the same message without sitting through the sweep.
    const t = setTimeout(() => setShow(false), reduceMotion ? 1200 : duration)
    return () => clearTimeout(t)
  }, [duration, reduceMotion])

  useEffect(() => {
    if (!show) onDone?.()
  }, [show, onDone])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          className="loader-screen fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          initial={false}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
          transition={{ type: "spring", bounce: 0, duration: reduceMotion ? 0.2 : 0.9 }}
          role="status"
          aria-live="polite"
        >
          <p className="loader-apology">Sorry, give me a moment.</p>

          <div className="loader-wrapper" aria-hidden>
            <span className="loader" />
            {PHRASE.split("").map((ch, i) => (
              <span
                key={`${ch}-${i}`}
                className="loader-letter"
                style={{ animationDelay: `${0.1 + i * 0.105}s` }}
              >
                {ch === " " ? " " : ch}
              </span>
            ))}
          </div>

          {/* The animated letters are decorative; this is what a screen
              reader actually announces. */}
          <span className="sr-only">Sorry, give me a moment. {PHRASE}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
