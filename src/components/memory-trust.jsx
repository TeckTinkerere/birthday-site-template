"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"
import ChapterLink from "@/components/chapter-link"
import { MEMORY_PHOTOS, MEMORY_PHOTO_CAPTION } from "@/lib/content"

/** dwell = how long this line sits alone before the next one arrives. */
const LINES = [
  { text: "You knew a side of me that very few people ever did.", dwell: 3600, quiet: true },
  {
    text: "I trusted you with things I rarely let anyone see — some of my worst days. That was never easy for me, and I don't think I ever properly thanked you for it.",
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

/** The filename, so a saved copy isn't called something like "memory-2". */
function downloadName(src) {
  return `aneeqa-${src.replace(/^\//, "")}`
}

export default function MemoryTrust({ onContinue }) {
  const reduceMotion = useReduceMotion()
  const [phase, setPhase] = useState(PHASE.QUIET)
  const [lineIndex, setLineIndex] = useState(-1)
  const [showAll, setShowAll] = useState(false)

  // Deck order, front of the stack first.
  const [order, setOrder] = useState(() => MEMORY_PHOTOS.map((p) => p.src))
  // Files that aren't there yet simply leave the deck instead of showing a
  // broken image, so content.js can list photos before they've been added.
  const [missing, setMissing] = useState([])

  const cards = useMemo(
    () =>
      order
        .filter((src) => !missing.includes(src))
        .map((src) => MEMORY_PHOTOS.find((p) => p.src === src))
        .filter(Boolean),
    [order, missing],
  )

  const front = cards[0]
  const still = reduceMotion || showAll

  useEffect(() => {
    if (still) return

    const timers = []
    const at = (ms, fn) => timers.push(setTimeout(fn, ms))

    at(700, () => setPhase(PHASE.TITLE))
    at(2800, () => setPhase(PHASE.PAUSE))
    at(4200, () => setPhase(PHASE.PHOTO))
    at(MEMORY_PHOTOS.length ? 8200 : 5600, () => {
      setPhase(PHASE.LINES)
      setLineIndex(0)
    })

    return () => timers.forEach(clearTimeout)
  }, [still])

  useEffect(() => {
    if (still || phase !== PHASE.LINES || lineIndex < 0) return

    if (lineIndex >= LINES.length - 1) {
      const t = setTimeout(() => setPhase(PHASE.FINAL), LINES[LINES.length - 1].dwell)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => setLineIndex((i) => i + 1), LINES[lineIndex].dwell)
    return () => clearTimeout(t)
  }, [phase, lineIndex, still])

  useEffect(() => {
    if (still || phase !== PHASE.FINAL) return
    const t = setTimeout(() => setPhase(PHASE.DONE), 3200)
    return () => clearTimeout(t)
  }, [phase, still])

  const revealAll = () => {
    setShowAll(true)
    setLineIndex(LINES.length - 1)
    setPhase(PHASE.DONE)
  }

  /** Front card goes to the back; any other card comes to the front. */
  const flip = (src) =>
    setOrder((prev) =>
      prev[0] === src ? [...prev.slice(1), prev[0]] : [src, ...prev.filter((s) => s !== src)],
    )

  const showTitle = still || phase >= PHASE.TITLE
  const showDeck = cards.length > 0 && (still || phase >= PHASE.PHOTO)
  const showFinal = still || phase >= PHASE.FINAL
  // In the paced reading the earlier lines step back so the last sentence stands alone.
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

      <div className="relative z-10 mx-auto w-full max-w-xl">
        {showTitle && (
          <motion.h1
            className="font-display mb-10 text-center text-[1.75rem] leading-tight tracking-tight text-[var(--ink)] sm:mb-14 sm:text-4xl md:text-[2.5rem]"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Thank you, first.
          </motion.h1>
        )}

        <AnimatePresence>
          {showDeck && (
            <motion.figure
              key="deck"
              className="mx-auto mb-12 w-fit"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 1.4, ease: "easeInOut" }}
            >
              <div
                className="memory-deck aspect-[3/4] w-44 sm:w-52"
                role="group"
                aria-label={`${cards.length} photograph${cards.length === 1 ? "" : "s"}`}
                style={{ marginRight: `${(cards.length - 1) * 7}px` }}
              >
                {/* Painted back to front so the deck stacks without fighting z-index. */}
                {cards
                  .map((photo, i) => ({ photo, i }))
                  .reverse()
                  .map(({ photo, i }) => (
                    <button
                      key={photo.src}
                      type="button"
                      onClick={() => flip(photo.src)}
                      data-front={i === 0}
                      className="memory-deck__card memory-photo rounded-sm p-2"
                      style={{ "--i": i, zIndex: cards.length - i }}
                      aria-label={
                        i === 0
                          ? `Photograph 1 of ${cards.length}. Show the next one.`
                          : `Bring photograph ${i + 1} of ${cards.length} to the front.`
                      }
                    >
                      <span className="relative block h-full w-full">
                        <Image
                          src={photo.src}
                          alt={i === 0 ? photo.alt : ""}
                          fill
                          sizes="(max-width: 640px) 176px, 208px"
                          // Eager: they're four small prints, and a lazy image
                          // that never enters the viewport never fires onError,
                          // which is what prunes photos that aren't there yet.
                          loading="eager"
                          className="object-contain"
                          onError={() =>
                            setMissing((m) => (m.includes(photo.src) ? m : [...m, photo.src]))
                          }
                        />
                      </span>
                    </button>
                  ))}
              </div>

              <figcaption className="font-body mt-4 text-center text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {MEMORY_PHOTO_CAPTION}
              </figcaption>

              <div className="mt-3 flex flex-col items-center gap-1">
                {cards.length > 1 && (
                  <p className="font-body text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted)]">
                    Tap to look through them
                  </p>
                )}
                {front && (
                  <a
                    href={front.src}
                    download={downloadName(front.src)}
                    className="font-body border-b border-[var(--accent)]/40 pb-0.5 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
                  >
                    Yours to keep — save this one
                  </a>
                )}
              </div>
            </motion.figure>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {linesVisible && (
            <motion.div
              key="lines"
              className="space-y-6 sm:space-y-7"
              exit={{ opacity: 0, transition: { duration: 1.4, ease: "easeInOut" } }}
            >
              {visibleLines.map((line, i) => (
                <motion.p
                  key={line.text}
                  className={`font-body text-pretty text-[1.05rem] leading-relaxed sm:text-lg ${
                    line.quiet ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"
                  }`}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: line.quiet ? 2.2 : 1.3,
                    ease: [0.22, 1, 0.36, 1],
                    delay: still ? Math.min(i * 0.08, 0.5) : 0,
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
            transition={{ duration: 1.8, delay: still ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {FINAL}
          </motion.p>
        )}

        <div className="mt-14 flex flex-col items-center gap-6">
          {(still || phase >= PHASE.DONE) && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: reduceMotion ? 0 : 0.4 }}
            >
              <ChapterLink onClick={onContinue}>What I wish for you</ChapterLink>
            </motion.div>
          )}

          {sequenceRunning && (
            <button
              type="button"
              onClick={revealAll}
              className="font-body text-xs uppercase tracking-[0.16em] text-[var(--muted)] transition-colors hover:text-[var(--ink-soft)]"
            >
              Show it all at once
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
