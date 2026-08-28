"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Particles, { ParticlesProvider } from "@tsparticles/react"
import { loadBubblesPreset } from "@tsparticles/preset-bubbles"
import { Volume2, VolumeX } from "lucide-react"
import useReduceMotion from "@/lib/use-reduce-motion"
import { BIRTHDAY } from "@/lib/content"
import Countdown from "@/components/countdown"
import LetterJourney from "@/components/letter-journey"
import OverthinkingLoader from "@/components/overthinking-loader"
import BackgroundGradientAnimation from "@/components/background-gradient-animation"
import VisitConsent from "@/components/visit-consent"

const ATMOSPHERE_CLASS = {
  celebration: "atmosphere-celebration",
  quiet: "atmosphere-quiet",
  hope: "atmosphere-hope",
  light: "atmosphere-light",
}

const initBubbles = (engine) => loadBubblesPreset(engine)

const BUBBLE_OPTIONS = {
  preset: "bubbles",
  fullScreen: { enable: false },
  background: { color: "transparent" },
  emitters: [],
  detectRetina: true,
  fpsLimit: 60,
  particles: {
    number: { value: 46, density: { enable: true } },
    paint: { fill: { enable: true, color: { value: "#f39abc" } } },
    color: { value: ["#f9b4cd", "#f58ab3", "#ffd1e1", "#fff1f6", "#e978a7"] },
    opacity: { value: { min: 0.18, max: 0.54 } },
    size: { value: { min: 6, max: 28 } },
    move: {
      enable: true,
      speed: { min: 0.35, max: 1.15 },
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
  const [trackingConsent, setTrackingConsent] = useState("loading")
  const [trackingReady, setTrackingReady] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const savedConsent = window.localStorage.getItem("birthday-visit-consent")
    setTrackingConsent(savedConsent === "granted" || savedConsent === "declined" ? savedConsent : "undecided")

    const isPreview = new URLSearchParams(window.location.search).has("preview")
    if (isPreview || Date.now() >= BIRTHDAY.getTime()) setCanOpen(true)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : (ATMOSPHERE_VOLUME[atmosphere] ?? 0.3)
  }, [atmosphere, isMuted, hasOpened])

  useEffect(() => {
    if (!hasOpened || trackingConsent !== "granted") {
      setTrackingReady(false)
      return undefined
    }

    let mounted = true
    fetch("/api/visit-session", { method: "POST", credentials: "same-origin" })
      .then((response) => {
        if (mounted) setTrackingReady(response.ok)
      })
      .catch(() => {
        if (mounted) setTrackingReady(false)
      })

    return () => {
      mounted = false
    }
  }, [hasOpened, trackingConsent])

  const trackVisit = useCallback(
    (event) => {
      if (trackingConsent !== "granted" || !trackingReady) return

      fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        credentials: "same-origin",
        body: JSON.stringify(event),
      }).catch(() => {})
    },
    [trackingConsent, trackingReady],
  )

  const saveTrackingConsent = (choice) => {
    window.localStorage.setItem("birthday-visit-consent", choice)
    setTrackingConsent(choice)
  }

  const openLetter = useCallback(() => {
    setHasOpened(true)
    setAtmosphere("quiet")
    audioRef.current?.play().catch(() => {})
  }, [])

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden">
      <OverthinkingLoader />
      <BackgroundGradientAnimation />
      <div
        className={`pointer-events-none fixed inset-0 z-[1] transition-[background] duration-[1200ms] ${ATMOSPHERE_CLASS[atmosphere]}`}
        aria-hidden
      />

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
              <LetterJourney onAtmosphereChange={setAtmosphere} onTrack={trackVisit} />
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

      {hasOpened && trackingConsent === "undecided" && (
        <VisitConsent
          onAllow={() => saveTrackingConsent("granted")}
          onDecline={() => saveTrackingConsent("declined")}
        />
      )}

      {hasOpened && (
        <button
          type="button"
          onClick={() => setIsMuted((muted) => !muted)}
          aria-pressed={isMuted}
          className="fixed bottom-5 right-5 z-30 rounded-full border border-[var(--ink)]/15 bg-white/70 p-3 text-[var(--ink-soft)] backdrop-blur-sm transition-colors hover:text-[var(--ink)]"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span className="sr-only">{isMuted ? "Unmute music" : "Mute music"}</span>
        </button>
      )}

      {!reduceMotion && (
        <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden" aria-hidden>
          <ParticlesProvider init={initBubbles}>
            <Particles id="bubbles" options={BUBBLE_OPTIONS} className="h-full w-full" />
          </ParticlesProvider>
        </div>
      )}
    </main>
  )
}
