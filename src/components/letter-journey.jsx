"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"
import Opening from "@/components/opening"
import MemoryTrust from "@/components/memory-trust"
import Wishes from "@/components/wishes"
import Farewell from "@/components/farewell"

const CHAPTERS = ["opening", "memory", "wishes", "farewell"]

const ATMOSPHERE = {
  opening: "celebration",
  memory: "quiet",
  wishes: "hope",
  farewell: "light",
}

/**
 * The letter, in order:
 * greeting → memory and trust → acceptance → wishes → parting gift → goodbye
 */
export default function LetterJourney({ onAtmosphereChange }) {
  const reduceMotion = useReduceMotion()
  const [chapter, setChapter] = useState("opening")

  useEffect(() => {
    onAtmosphereChange?.(ATMOSPHERE[chapter])
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  }, [chapter, onAtmosphereChange, reduceMotion])

  const next = () => {
    const i = CHAPTERS.indexOf(chapter)
    if (i < CHAPTERS.length - 1) setChapter(CHAPTERS[i + 1])
  }

  return (
    <div className="letter-journey w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={chapter}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {chapter === "opening" && <Opening onContinue={next} />}
          {chapter === "memory" && <MemoryTrust onContinue={next} />}
          {chapter === "wishes" && <Wishes onContinue={next} />}
          {chapter === "farewell" && <Farewell />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
