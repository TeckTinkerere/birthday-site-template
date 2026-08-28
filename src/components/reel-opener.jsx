"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Keyboard, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import useReduceMotion from "@/lib/use-reduce-motion"

function reelLabel(name, index) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[-_ ]*/, "")
    .replace(/[-_]+/g, " ")
    .trim() || `Reel ${index + 1}`
}

export default function ReelOpener() {
  const reduceMotion = useReduceMotion()
  const [videos, setVideos] = useState([])
  const [status, setStatus] = useState("loading")
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRefs = useRef([])

  useEffect(() => {
    let mounted = true

    fetch("/api/videos")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load reels")
        return response.json()
      })
      .then(({ videos: items }) => {
        if (!mounted) return
        setVideos(items)
        setStatus("ready")
      })
      .catch(() => {
        if (mounted) setStatus("error")
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return
      if (index === activeIndex && !reduceMotion) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [activeIndex, reduceMotion, videos])

  return (
    <section
      className="reel-opener relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-14 sm:px-6"
      aria-label="A few more memories in motion"
    >
      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <motion.p
          className="font-body text-xs uppercase tracking-[0.22em] text-[var(--wish-muted)]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.7 }}
        >
          If you would like to stay
        </motion.p>
        <motion.h1
          className="font-display mt-4 text-[1.9rem] leading-tight text-[var(--wish-ink)] sm:text-4xl"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.12 }}
        >
          A few moments in motion
        </motion.h1>
        <p className="font-body mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--wish-ink-soft)]">
          Swipe through whenever you are ready.
        </p>

        {status === "loading" && (
          <p className="font-body mt-12 text-sm text-[var(--wish-muted)]">Preparing the reels...</p>
        )}

        {status === "error" && (
          <p className="font-body mt-12 text-sm text-[var(--wish-muted)]">
            The reels could not be loaded right now.
          </p>
        )}

        {status === "ready" && videos.length === 0 && (
          <div className="mx-auto mt-12 max-w-sm rounded-[2rem] border border-white/70 bg-white/45 px-8 py-12 shadow-[0_20px_50px_rgba(123,58,80,0.12)]">
            <p className="font-display text-xl text-[var(--wish-ink)]">The next memories are still on their way.</p>
            <p className="font-body mt-3 text-sm leading-relaxed text-[var(--wish-ink-soft)]">
              Add portrait .mp4 or .webm files to public/videos to show them here.
            </p>
          </div>
        )}

        {status === "ready" && videos.length > 0 && (
          <Swiper
            className="reel-swiper mt-9"
            modules={[Keyboard, Pagination]}
            slidesPerView="auto"
            centeredSlides
            spaceBetween={20}
            keyboard={{ enabled: true }}
            pagination={{ clickable: true }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          >
            {videos.map((video, index) => (
              <SwiperSlide key={video.src} className="reel-swiper__slide">
                <article className="reel-card">
                  <video
                    ref={(element) => {
                      videoRefs.current[index] = element
                    }}
                    className="reel-card__video"
                    controls
                    muted
                    playsInline
                    preload={index === activeIndex ? "metadata" : "none"}
                    aria-label={reelLabel(video.name, index)}
                    onPlay={() => {
                      setActiveIndex(index)
                      videoRefs.current.forEach((otherVideo, otherIndex) => {
                        if (otherVideo && otherIndex !== index) otherVideo.pause()
                      })
                    }}
                  >
                    <source src={video.src} type={video.type} />
                    Your browser cannot play this video.
                  </video>
                  <p className="font-body reel-card__label">{reelLabel(video.name, index)}</p>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  )
}
