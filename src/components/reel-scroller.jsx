"use client"

import { useEffect, useRef, useState } from "react"

import useReduceMotion from "@/lib/use-reduce-motion"
import styles from "@/components/reel-scroller.module.css"

/* Matches the `.burn`/`.burnFlames` keyframe duration in the stylesheet. */
const BURN_DURATION_MS = 2600

/* ---------------------------------------------------------------------------
   PlaybackBar

   A labelled native range input bound to the active reel. `value` tracks the
   video's current time, `max` tracks its duration, and changing the value seeks
   the active video through `onSeek`. The bar is keyboard-operable by default
   (native range input) and carries an accessible label plus a current-position
   aria-valuetext.
--------------------------------------------------------------------------- */

function formatClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function PlaybackBar({ currentTime, duration, onSeek }) {
  const hasDuration = Number.isFinite(duration) && duration > 0
  const max = hasDuration ? duration : 0
  const value = Math.min(Math.max(currentTime || 0, 0), max)
  const valueText = hasDuration
    ? `${formatClock(value)} of ${formatClock(duration)}`
    : formatClock(value)

  return (
    <input
      type="range"
      className={styles.playbackBar}
      min={0}
      max={max}
      step="any"
      value={value}
      onChange={(event) => onSeek(Number(event.target.value))}
      aria-label="Video progress"
      aria-valuetext={valueText}
    />
  )
}

/* ---------------------------------------------------------------------------
   BurnOverlay

   Full-motion only. Renders the rising fire gradient over the feed and reports
   completion once. The blackening layer's `animationend` is the primary signal;
   a duration-matched timeout guards against browsers that never fire the event.
   Both paths call `onComplete` at most once.
--------------------------------------------------------------------------- */

function BurnOverlay({ onComplete }) {
  const completedRef = useRef(false)

  const finish = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete?.()
  }

  useEffect(() => {
    const timer = window.setTimeout(finish, BURN_DURATION_MS)
    return () => window.clearTimeout(timer)
    // finish is stable for the lifetime of this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={styles.burn}
      role="presentation"
      aria-hidden="true"
      onAnimationEnd={finish}
    >
      <div className={styles.burnFlames} />
    </div>
  )
}

/* ---------------------------------------------------------------------------
   ClosingScreen

   Terminal state. A fixed full-screen black background with a single centered
   line and no controls or navigation.
--------------------------------------------------------------------------- */

function ClosingScreen() {
  return (
    <div className={styles.closing}>
      <p className={styles.closingText}>Have a happy day ahead. I&apos;ll miss you.</p>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   ReelScroller

   Full-screen vertical scroll-snap feed of portrait reels. Fetches the reel
   list once, snaps one reel per 100dvh, and plays whichever reel is centered
   while pausing the rest. The active reel's progress drives the PlaybackBar.

   The viewed tracking and burn/close state machine (task 5.2) are not wired in
   yet. The phase state field and the BurnOverlay/ClosingScreen render seams are
   present but left inert here so task 5.2 can complete them without reshaping
   this component.
--------------------------------------------------------------------------- */

export default function ReelScroller({ onTrack }) {
  const reduceMotion = useReduceMotion()

  const [status, setStatus] = useState("loading")
  const [videos, setVideos] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Active-reel playback progress, surfaced through the PlaybackBar.
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Burn/close state machine seam for task 5.2. Kept present but inert here.
  const [viewedIds, setViewedIds] = useState(() => new Set())
  const [phase, setPhase] = useState("playing")

  const videoRefs = useRef([])
  const slideRefs = useRef([])

  // Fetch the reel list once and emit the enter timing event a single time.
  useEffect(() => {
    let mounted = true

    fetch("/api/videos")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load reels")
        return response.json()
      })
      .then(({ videos: items }) => {
        if (!mounted) return
        setVideos(Array.isArray(items) ? items : [])
        setStatus("ready")
      })
      .catch(() => {
        if (mounted) setStatus("error")
      })

    onTrack?.({ type: "reels-timing", chapter: "reels", phase: "enter" })

    return () => {
      mounted = false
    }
    // Emit enter once on mount; onTrack is treated as stable for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track which slide is centered so it becomes the active, playing reel.
  useEffect(() => {
    if (status !== "ready" || videos.length === 0) return

    const slides = slideRefs.current.filter(Boolean)
    if (slides.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const index = slideRefs.current.indexOf(entry.target)
          if (index !== -1) setActiveIndex(index)
        })
      },
      { threshold: 0.6 },
    )

    slides.forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [status, videos])

  // Play the active reel muted under full motion; pause every other reel.
  // Rejected play() promises (autoplay blocked) are caught and ignored.
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return
      if (index === activeIndex && !reduceMotion) {
        const played = video.play()
        if (played && typeof played.catch === "function") played.catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [activeIndex, reduceMotion, videos])

  // Bind the PlaybackBar to the active reel via timeupdate/durationchange.
  useEffect(() => {
    const video = videoRefs.current[activeIndex]
    if (!video) return

    const syncTime = () => setCurrentTime(video.currentTime || 0)
    const syncDuration = () =>
      setDuration(Number.isFinite(video.duration) ? video.duration : 0)

    syncTime()
    syncDuration()

    video.addEventListener("timeupdate", syncTime)
    video.addEventListener("durationchange", syncDuration)
    video.addEventListener("loadedmetadata", syncDuration)

    return () => {
      video.removeEventListener("timeupdate", syncTime)
      video.removeEventListener("durationchange", syncDuration)
      video.removeEventListener("loadedmetadata", syncDuration)
    }
  }, [activeIndex, videos])

  const seekActive = (seconds) => {
    const video = videoRefs.current[activeIndex]
    if (!video) return
    video.currentTime = seconds
    setCurrentTime(seconds)
  }

  if (status === "error") {
    return (
      <div className={styles.message} role="status">
        The reels could not be loaded right now.
      </div>
    )
  }

  if (status === "ready" && videos.length === 0) {
    return (
      <div className={styles.message} role="status">
        The next memories are still on their way.
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div className={styles.message} role="status">
        Preparing the reels...
      </div>
    )
  }

  return (
    <>
      <div className={styles.scroller} aria-label="A few moments in motion">
        {videos.map((video, index) => (
          <section
            key={video.src}
            className={styles.slide}
            ref={(element) => {
              slideRefs.current[index] = element
            }}
          >
            <video
              ref={(element) => {
                videoRefs.current[index] = element
              }}
              className={styles.video}
              muted
              playsInline
              preload={index === activeIndex ? "metadata" : "none"}
            >
              <source src={video.src} type={video.type} />
              Your browser cannot play this video.
            </video>
            {index === activeIndex && (
              <PlaybackBar
                currentTime={currentTime}
                duration={duration}
                onSeek={seekActive}
              />
            )}
          </section>
        ))}
      </div>

      {/* Burn/close render seam for task 5.2. Inert while phase stays "playing". */}
      {phase === "burning" && <BurnOverlay onComplete={() => setPhase("closed")} />}
      {phase === "closed" && <ClosingScreen />}
    </>
  )
}

export { PlaybackBar, BurnOverlay, ClosingScreen }
