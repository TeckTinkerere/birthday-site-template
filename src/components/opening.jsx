"use client"

import { motion } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"
import ChapterLink from "@/components/chapter-link"
import { BIRTHDAY_LABEL, RECIPIENT } from "@/lib/content"

const LINES = [
  "That's the date, and I wanted to mark it properly. Just once.",
  "It's a short letter. Nothing in it needs a reply.",
]

export default function Opening({ onContinue }) {
  const reduceMotion = useReduceMotion()

  return (
    <section
      className="opening flex min-h-[100dvh] flex-col items-center justify-center px-6 py-20 text-center"
      aria-label="A birthday greeting"
    >
      <div className="w-full max-w-xl">
        <motion.p
          className="font-body text-xs uppercase tracking-[0.22em] text-[var(--muted)]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9 }}
        >
          {BIRTHDAY_LABEL}
        </motion.p>

        <motion.h1
          className="font-display mt-6 text-[2rem] leading-tight tracking-tight text-[var(--ink)] sm:text-4xl md:text-[2.75rem]"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          Happy birthday, {RECIPIENT}.
        </motion.h1>

        <div className="mt-10 space-y-5">
          {LINES.map((line, i) => (
            <motion.p
              key={line}
              className="font-body text-pretty text-[1.05rem] leading-relaxed text-[var(--ink-soft)] sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: reduceMotion ? 0 : 0.9 + i * 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.div
          className="mt-14"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: reduceMotion ? 0 : 2.2 }}
        >
          <ChapterLink onClick={onContinue}>Read it</ChapterLink>
        </motion.div>
      </div>
    </section>
  )
}
