"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Particles, { ParticlesProvider } from "@tsparticles/react"
import { loadBubblesPreset } from "@tsparticles/preset-bubbles"
import useReduceMotion from "@/lib/use-reduce-motion"
import { Volume2, VolumeX } from "lucide-react"
import Countdown from "@/components/countdown"
import LetterJourney from "@/components/letter-journey"
import { BIRTHDAY } from "@/lib/content"

const ATMOSPHERE_CLASS = {
  celebration: "atmosphere-celebration",
  quiet: "atmosphere-quiet",
  hope: "atmosphere-hope",
  light: "atmosphere-light",
}

const initBubbles = (engine) => loadBubblesPreset(engine)

/**
 * The bubbles preset ships loud — speed 15, random colours, an opaque white
 * background and emitters firing in bursts. Everything below tones it down to
 * a slow drift of soft pink over whatever gradient the chapter is using.
 */
const BUBBLE_OPTIONS = {
  preset: "bubbles",
  fullScreen: { enable: false },
  background: { color: "transparent" },
  emitters: [],
  detectRetina: true,
  fpsLimit: 60,
  particles: {
    number: { value: 26, density: { enable: true } },
    paint: { fill: { enable: true, color: { value: "#f2b8cd" } } },
    color: { value: ["#f7cede", "#efb3c9", "#ffffff", "#e9a7bf"] },
    opacity: { value: { min: 0.12, max: 0.4 } },
    size: { value: { min: 5, max: 20 } },
    move: {
      enable: true,
      speed: { min: 0.3, max: 0.9 },
      direction: "top",
      straight: false,
      outModes: { default: "out" },
    },
  },
}

const ATMOSPHERE_VOLUME = {
  celebration: 0.4,
  quiet: 0.22,
  hope: 0.42,
  light: 0.3,
}

export default function Home() {
  const reduceMotion = useReduceMotion()
  const [hasOpened, setHasOpened] = useState(false)
  const [canOpen, setCanOpen] = useState(false)
  const [atmosphere, setAtmosphere] = useState("celebration")
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef(null)

  // The letter unlocks on the day itself. ?preview=1 exists so the letter can
  // be proof-read beforehand. This has to run after mount: the server has no
  // URL query string and no reliable clock to check against the reader's.
  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).has("preview")
    if (isPreview || Date.now() >= BIRTHDAY.getTime()) setCanOpen(true)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : (ATMOSPHERE_VOLUME[atmosphere] ?? 0.3)
  }, [atmosphere, isMuted, hasOpened])

  const openLetter = useCallback(() => {
    setHasOpened(true)
    setAtmosphere("quiet")
    audioRef.current?.play().catch(() => {
      // Some browsers still refuse; the letter reads fine in silence.
    })
  }, [])

  return (
    <main
      className={`relative min-h-[100dvh] w-full overflow-x-hidden transition-[background] duration-[1200ms] ${ATMOSPHERE_CLASS[atmosphere]}`}
    >
      <div className="relative z-10 mx-auto w-full max-w-3xl px-0 sm:px-6">
        <AnimatePresence mode="wait">
          {hasOpened ? (
            <motion.div
              key="letter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 1 }}
              className="w-full"
            >
              <LetterJourney onAtmosphereChange={setAtmosphere} />
            </motion.div>
          ) : (
            <motion.div
              key="countdown"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.9 }}
              className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16"
            >
              <Countdown targetDate={BIRTHDAY} isUnlocked={canOpen} onOpen={openLetter} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <audio ref={audioRef} src="/birthday.mp3" preload="none" loop />

      {hasOpened && (
        <button
          type="button"
          onClick={() => setIsMuted((m) => !m)}
          aria-pressed={isMuted}
          className="fixed bottom-5 right-5 z-30 rounded-full border border-[var(--ink)]/15 bg-white/70 p-3 text-[var(--ink-soft)] backdrop-blur-sm transition-colors hover:text-[var(--ink)]"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span className="sr-only">{isMuted ? "Unmute music" : "Mute music"}</span>
        </button>
      )}

      {/* Ambient bubbles, from the tsparticles bubbles preset. Nothing is
          rendered at all when the visitor asks for reduced motion. */}
      {!reduceMotion && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <ParticlesProvider init={initBubbles}>
            <Particles id="bubbles" options={BUBBLE_OPTIONS} className="h-full w-full" />
          </ParticlesProvider>
        </div>
      )}
    </main>
  )
}

