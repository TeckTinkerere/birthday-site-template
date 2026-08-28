"use client"

import { useEffect, useState } from "react"
import useReduceMotion from "@/lib/use-reduce-motion"

/**
 * The face is driven by CSS animations with a negative animation-delay, so the
 * hands start already rotated to the real time and then sweep on their own -
 * no re-render per tick.
 *
 * When the visitor asks for reduced motion the sweep is replaced by a plain
 * rotation that updates once a second, which is the same cadence the digital
 * counter below already uses.
 */
export default function AnalogClock() {
  const reduceMotion = useReduceMotion()
  // null until mount: the server has no clock that matches the reader's.
  const [now, setNow] = useState(null)

  useEffect(() => {
    setNow(new Date())
    if (!reduceMotion) return
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [reduceMotion])

  const seconds = now ? now.getSeconds() : 0
  const minutes = now ? now.getMinutes() : 0
  const hours = now ? now.getHours() % 12 : 0

  // Seconds elapsed into each hand's full revolution.
  const intoMinute = seconds
  const intoHour = minutes * 60 + seconds
  const intoHalfDay = hours * 3600 + intoHour

  const handStyle = (elapsed, period) =>
    reduceMotion
      ? { animation: "none", transform: `rotate(${(elapsed / period) * 360}deg)` }
      : { animationDelay: `-${elapsed}s` }

  return (
    <div className="clock-wrap" role="img" aria-label="An analogue clock showing the current time">
      <div className="face" aria-hidden>
        <div className="v-index">|</div>
        <div className="h-index">|</div>
        <div className="hour" style={handStyle(intoHalfDay, 43200)} />
        <div className="minute" style={handStyle(intoHour, 3600)} />
        <div className="second" style={handStyle(intoMinute, 60)} />
      </div>
    </div>
  )
}
