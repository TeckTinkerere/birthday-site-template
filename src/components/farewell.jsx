"use client"

import { motion } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"
import { RECIPIENT } from "@/lib/content"

const GIFT = [
  "If we ever run into each other, I have something small to give you. Nothing important, and nothing that needs a conversation. I'll just hand it over, and that will be that.",
]

const CLOSING = [
  "That's the whole letter. I remember it, I'm grateful for it, and I'm not asking for any of it back.",
  "I hope you're happy — in the ordinary, everyday way that actually lasts.",
  `Take care of yourself, ${RECIPIENT}.`,
]

const EXAMS = [
  "And good luck with your exams. I know how much work you've put in — I hope it comes back to you when you need it.",
  "Go easy on yourself in the middle of it. You're more prepared than you'll feel on the day.",
]

export default function Farewell() {
  const reduceMotion = useReduceMotion()
  const delay = (i) => (reduceMotion ? 0 : i)

  return (
    <section
      className="farewell relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-20 text-center"
      aria-label="A last thing, and goodbye"
    >
      <div className="mx-auto w-full max-w-xl">
        <motion.p
          className="font-body text-xs uppercase tracking-[0.22em] text-[var(--wish-muted)]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9 }}
        >
          Before you go
        </motion.p>

        <motion.h1
          className="font-display mt-5 text-[1.75rem] leading-tight text-[var(--wish-ink)] sm:text-4xl"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: delay(0.2) }}
        >
          One last little thing
        </motion.h1>

        {GIFT.map((line, i) => (
          <motion.p
            key={line}
            className="font-body mt-8 text-pretty text-[1.05rem] leading-relaxed text-[var(--wish-ink-soft)] sm:text-lg"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 1, delay: delay(0.7 + i * 0.5), }}
          >
            {line}
          </motion.p>
        ))}

        <div className="mt-12 space-y-6 border-t border-[var(--wish-accent)]/20 pt-10">
          {CLOSING.map((line, i) => (
            <motion.p
              key={line}
              className="font-body text-pretty text-[1.05rem] leading-relaxed text-[var(--wish-ink-soft)] sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 1, delay: delay(1.6 + i * 0.6), }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.p
          className="font-display mt-14 text-2xl tracking-wide text-[var(--wish-ink)] sm:text-[1.75rem]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: delay(3.6) }}
        >
          Happy birthday.
        </motion.p>

        <div className="mt-12 space-y-5">
          {EXAMS.map((line, i) => (
            <motion.p
              key={line}
              className="font-body text-pretty text-[1.05rem] leading-relaxed text-[var(--wish-ink-soft)] sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 1, delay: delay(4.4 + i * 0.6), }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.p
          className="font-body mt-12 text-xs uppercase tracking-[0.16em] text-[var(--wish-muted)]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: delay(6.2) }}
        >
          You can close this whenever you like.
        </motion.p>
      </div>
    </section>
  )
}
