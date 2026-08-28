"use client"

import { motion } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"

export default function ChapterLink({ children, onClick }) {
  const reduceMotion = useReduceMotion()

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="font-body border-b border-[var(--accent)]/40 pb-1 text-sm uppercase tracking-[0.14em] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
      // Feedback lives on the press, not the release - the button answers
      // the instant it's touched, the way a physical control would.
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
    >
      {children}
    </motion.button>
  )
}
