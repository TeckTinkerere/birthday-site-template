"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import useReduceMotion from "@/lib/use-reduce-motion"
import Opening from "@/components/opening"
import MemoryTrust from "@/components/memory-trust"
import Wishes from "@/components/wishes"
import Farewell from "@/components/farewell"
import ReelOpener from "@/components/reel-opener"

const CHAPTERS = ["opening", "memory", "wishes", "farewell", "reels"]

const ATMOSPHERE = {
  opening: "celebration",
  memory: "quiet",
  wishes: "hope",
  farewell: "light",
  reels: "hope",
}

export default function LetterJourney({ onAtmosphereChange, onTrack }) {
  const reduceMotion = useReduceMotion()
  const [chapter, setChapter] = useState("opening")

  useEffect(() => {
    onAtmosphereChange?.(ATMOSPHERE[chapter])
    onTrack?.({ type: "chapter", chapter })
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  }, [chapter, onAtmosphereChange, onTrack, reduceMotion])

  const next = () => {
    const index = CHAPTERS.indexOf(chapter)
    if (index < CHAPTERS.length - 1) setChapter(CHAPTERS[index + 1])
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
          {chapter === "farewell" && <Farewell onContinue={next} onTrack={onTrack} />}
          {chapter === "reels" && <ReelOpener />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
