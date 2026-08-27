"use client"

import { motion } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"
import ChapterLink from "@/components/chapter-link"

const WISHES = [
  "I hope your days ahead are gentle, and that good things reach you without you having to fight for them.",
  "I hope you keep becoming whoever it is you actually want to be.",
  "I hope you're surrounded by people who are kind to you.",
]

const FOR_SOMEONE = [
  "And I hope you meet the person who is genuinely right for you — someone who sees you clearly, understands you without needing it explained, and is steady about it.",
  "I hope being loved by them feels easy. You deserve that, plainly and without conditions.",
]

export default function Wishes({ onContinue }) {
  const reduceMotion = useReduceMotion()
  const delay = (i) => (reduceMotion ? 0 : i)

  return (
    <section
      className="wishes relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-20"
      aria-label="What I wish for you"
    >
      <motion.div
        className="wishes__glow pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.8 }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        <motion.p
          className="font-body text-xs uppercase tracking-[0.22em] text-[var(--wish-muted)]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9 }}
        >
          Looking forward
        </motion.p>

        <motion.h1
          className="font-display mt-5 text-[1.75rem] leading-tight text-[var(--wish-ink)] sm:text-4xl md:text-[2.5rem]"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: delay(0.2) }}
        >
          What I wish for you
        </motion.h1>

        <div className="mt-10 space-y-6 sm:mt-12 sm:space-y-7">
          {WISHES.map((wish, i) => (
            <motion.p
              key={wish}
              className="font-body text-pretty text-[1.05rem] leading-relaxed text-[var(--wish-ink-soft)] sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 1, delay: delay(0.6 + i * 0.5), }}
            >
              {wish}
            </motion.p>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-lg space-y-6 border-t border-[var(--wish-accent)]/20 pt-10 sm:space-y-7">
          {FOR_SOMEONE.map((line, i) => (
            <motion.p
              key={line}
              className="font-body text-pretty text-[1.05rem] leading-relaxed text-[var(--wish-ink-soft)] sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 1, delay: delay(2.3 + i * 0.6), }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.p
          className="font-display mt-14 text-xl text-[var(--wish-ink)] sm:text-2xl"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: delay(3.6) }}
        >
          More than anything, I hope you&apos;re happy.
        </motion.p>

        <motion.div
          className="mt-14"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: delay(4.4) }}
        >
          <ChapterLink onClick={onContinue}>One last thing</ChapterLink>
        </motion.div>
      </div>
    </section>
  )
}
