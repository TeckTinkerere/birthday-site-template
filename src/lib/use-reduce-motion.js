"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"

/**
 * framer-motion's own hook reports `null` while rendering on the server and the
 * real preference on the client, so every `reduceMotion ? a : b` prop hydrates
 * with a different value than it was rendered with. Staying `false` until after
 * mount keeps the first client paint identical to the server markup; the real
 * preference takes over one frame later.
 */
export default function useReduceMotion() {
  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  // The whole point is to flip *after* the first client paint, once
  // hydration is safely behind us - so this genuinely can't move into render.
  useEffect(() => setMounted(true), [])

  return mounted && Boolean(prefersReduced)
}
