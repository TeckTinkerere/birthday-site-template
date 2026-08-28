"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"
import ChapterLink from "@/components/chapter-link"
import CircularGallery from "@/components/circular-gallery"
import { MEMORY_PHOTOS, MEMORY_PHOTO_CAPTION } from "@/lib/content"

const LINES = [
  { text: "You knew a side of me that very few people ever did.", dwell: 3600, quiet: true },
  {
    text: "I trusted you with things I rarely let anyone see - some of my worst days. That was never easy for me, and I don't think I ever properly thanked you for it.",
    dwell: 5400,
    quiet: true,
  },
  {
    text: "Whatever has changed since, I'm not going to pretend that meant nothing. It was rare. I'm grateful I had it.",
    dwell: 4400,
  },
  { text: "I know I'll miss you.", dwell: 2800, quiet: true },
  { text: "The conversations, mostly. And the person who knew that side of me.", dwell: 3800 },
  {
    text: "But missing someone doesn't mean holding onto them. Sometimes it just means being glad they were there for part of your life.",
    dwell: 4600,
  },
]

const FINAL = "And I'm learning to be okay with that."
const PHASE = { QUIET: 0, TITLE: 1, PAUSE: 2, PHOTO: 3, LINES: 4, FINAL: 5, DONE: 6 }

export default function MemoryTrust({ onContinue }) {
  const reduceMotion = useReduceMotion()
  const [phase, setPhase] = useState(PHASE.QUIET)
  const [lineIndex, setLineIndex] = useState(-1)
  const [showAll, setShowAll] = useState(false)
  const still = reduceMotion || showAll
  const galleryItems = useMemo(
    () => MEMORY_PHOTOS.map((photo) => ({ image: photo.src, text: photo.text, description: photo.alt })),
    [],
  )

  useEffect(() => {
    if (still) return undefined

    const timers = []
    const at = (ms, callback) => timers.push(setTimeout(callback, ms))

    at(700, () => setPhase(PHASE.TITLE))
    at(2800, () => setPhase(PHASE.PAUSE))
    at(4200, () => setPhase(PHASE.PHOTO))
    at(galleryItems.length ? 8200 : 5600, () => {
      setPhase(PHASE.LINES)
      setLineIndex(0)
    })

    return () => timers.forEach(clearTimeout)
  }, [galleryItems.length, still])

  useEffect(() => {
    if (still || phase !== PHASE.LINES || lineIndex < 0) return undefined

    if (lineIndex >= LINES.length - 1) {
      const timer = setTimeout(() => setPhase(PHASE.FINAL), LINES[LINES.length - 1].dwell)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => setLineIndex((index) => index + 1), LINES[lineIndex].dwell)
    return () => clearTimeout(timer)
  }, [phase, lineIndex, still])

  useEffect(() => {
    if (still || phase !== PHASE.FINAL) return undefined
    const timer = setTimeout(() => setPhase(PHASE.DONE), 3200)
    return () => clearTimeout(timer)
  }, [phase, still])

  const revealAll = () => {
    setShowAll(true)
    setLineIndex(LINES.length - 1)
    setPhase(PHASE.DONE)
  }

  const showTitle = still || phase >= PHASE.TITLE
  const showGallery = galleryItems.length > 0 && (still || phase >= PHASE.PHOTO)
  const showFinal = still || phase >= PHASE.FINAL
  const linesVisible = still || phase <= PHASE.LINES
  const visibleLines = still ? LINES : LINES.slice(0, Math.max(0, lineIndex + 1))
  const sequenceRunning = !still && phase < PHASE.DONE

  return (
    <section
      className="memory-trust relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-20"
      aria-label="A memory, and the trust that came with it"
    >
      <motion.div
        className="memory-trust__veil pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: showTitle ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 1.6, ease: "easeOut" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        {showTitle && (
          <motion.h1
            className="font-display mb-10 text-center text-[1.75rem] leading-tight tracking-tight text-[var(--ink)] sm:mb-14 sm:text-4xl md:text-[2.5rem]"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 1.2 }}
          >
            Thank you, first.
          </motion.h1>
        )}

        <AnimatePresence>
          {showGallery && (
            <motion.figure
              key="gallery"
              className="mx-auto mb-12"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0.12, duration: 0.9 }}
            >
              <div className="mx-auto h-[340px] w-full max-w-3xl sm:h-[420px] md:h-[480px]">
                <CircularGallery
                  items={galleryItems}
                  bend={3}
                  textColor="#7d3a50"
                  borderRadius={0.045}
                  scrollSpeed={2}
                  scrollEase={0.02}
                  autoScrollSpeed={reduceMotion ? 0 : 0.018}
                  font="600 20px Georgia"
                />
              </div>
              <figcaption className="font-body mt-4 text-center text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {MEMORY_PHOTO_CAPTION}
              </figcaption>
              <p className="font-body mt-2 text-center text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                Drag, scroll, or use the arrow keys
              </p>
            </motion.figure>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {linesVisible && (
            <motion.div
              key="lines"
              className="mx-auto max-w-xl space-y-6 sm:space-y-7"
              exit={{ opacity: 0, transition: { duration: 1.4, ease: "easeInOut" } }}
            >
              {visibleLines.map((line, index) => (
                <motion.p
                  key={line.text}
                  className={`font-body text-pretty text-[1.05rem] leading-relaxed sm:text-lg ${
                    line.quiet ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"
                  }`}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    bounce: 0,
                    duration: line.quiet ? 2.2 : 1.3,
                    delay: still ? Math.min(index * 0.08, 0.5) : 0,
                  }}
                >
                  {line.text}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {showFinal && (
          <motion.p
            className={`font-display text-center text-xl tracking-wide text-[var(--ink)] sm:text-2xl ${
              still ? "mt-14 sm:mt-16" : ""
            }`}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 1.8, delay: still ? 0 : 1.2 }}
          >
            {FINAL}
          </motion.p>
        )}

        <div className="mt-14 flex flex-col items-center gap-8">
          {phase === PHASE.DONE || still ? (
            <ChapterLink onClick={onContinue}>Keep reading</ChapterLink>
          ) : (
            <button
              type="button"
              onClick={revealAll}
              className="font-body text-xs uppercase tracking-[0.16em] text-[var(--muted)] transition-colors hover:text-[var(--ink-soft)]"
            >
              Show it all at once
            </button>
          )}
          {sequenceRunning && null}
        </div>
      </div>
    </section>
  )
}
