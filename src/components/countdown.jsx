"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"
import { BIRTHDAY_LABEL, RECIPIENT } from "@/lib/content"

function getTimeLeft(targetDate) {
  const diff = targetDate.getTime() - Date.now()
  if (diff <= 0) return null

  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function Countdown({ targetDate, isUnlocked, onOpen }) {
  const reduceMotion = useReduceMotion()
  // Left null on the server so the first client paint matches the markup.
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate))
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="w-full max-w-md text-center">
      <motion.p
        className="font-body text-xs uppercase tracking-[0.22em] text-[var(--muted)]"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        For {RECIPIENT}
      </motion.p>

      <motion.h1
        className="font-display mt-5 text-3xl leading-tight tracking-tight text-[var(--ink)] sm:text-4xl"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: reduceMotion ? 0 : 0.15 }}
      >
        {isUnlocked ? "It's the day." : "A letter, waiting."}
      </motion.h1>

      <motion.p
        className="font-body mx-auto mt-4 max-w-xs text-base leading-relaxed text-[var(--ink-soft)]"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: reduceMotion ? 0 : 0.35 }}
      >
        {isUnlocked
          ? "Whenever you're ready. It's short, and it asks nothing of you."
          : `It opens on ${BIRTHDAY_LABEL}.`}
      </motion.p>

      {!isUnlocked && (
        <div className="mt-10 grid grid-cols-4 gap-2 sm:gap-3" aria-live="off">
          {timeLeft ? (
            Object.entries(timeLeft).map(([unit, value], index) => (
              <motion.div
                key={unit}
                className="rounded-2xl border border-white/60 bg-white/55 px-1 py-4 backdrop-blur-sm"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : index * 0.08 }}
              >
                <div className="font-display text-2xl tabular-nums text-[var(--ink)] sm:text-3xl">
                  {value}
                </div>
                <div className="font-body mt-1 text-[0.65rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {unit}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 h-[6.5rem]" />
          )}
        </div>
      )}

      {isUnlocked && (
        <motion.div
          className="mt-12"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: reduceMotion ? 0 : 0.6 }}
        >
          <button
            type="button"
            onClick={onOpen}
            className="font-body rounded-full border border-[var(--ink)]/15 bg-white/70 px-8 py-3 text-sm uppercase tracking-[0.14em] text-[var(--ink)] backdrop-blur-sm transition-colors hover:bg-white/90"
          >
            Open the letter
          </button>
        </motion.div>
      )}
    </div>
  )
}
