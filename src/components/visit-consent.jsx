"use client"

import { motion } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"

export default function VisitConsent({ onAllow, onDecline }) {
  const reduceMotion = useReduceMotion()

  return (
    <motion.aside
      className="fixed bottom-5 left-5 right-16 z-30 max-w-md rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_50px_rgba(123,58,80,0.18)] backdrop-blur-md sm:left-1/2 sm:right-auto sm:w-[28rem] sm:-translate-x-1/2"
      role="dialog"
      aria-labelledby="visit-consent-title"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <p id="visit-consent-title" className="font-display text-lg text-[var(--ink)]">
        Keep a small record of this visit?
      </p>
      <p className="font-body mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">
        If you agree, this letter records the sections you open, the time, and broad browser and device details. It does not record your IP address or location.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={onAllow}
          className="font-body border-b border-[var(--accent)] pb-0.5 text-xs uppercase tracking-[0.14em] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
        >
          Allow anonymous logging
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="font-body text-xs uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
        >
          Continue without logging
        </button>
      </div>
    </motion.aside>
  )
}
