import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { Redis } from "@upstash/redis"

export const runtime = "nodejs"

const CHAPTERS = new Set(["opening", "memory", "wishes", "farewell", "reels"])
const EVENT_TYPES = new Set(["chapter", "reels-choice"])
const REEL_ACTIONS = new Set(["stay", "watch"])
const MAX_EVENT_BYTES = 1024
const MAX_EVENTS_PER_MINUTE = 20
const COOKIE_NAME = "birthday_visit"

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

function browserFromUserAgent(userAgent) {
  if (/edg\//i.test(userAgent)) return "Edge"
  if (/firefox\//i.test(userAgent)) return "Firefox"
  if (/chrome\//i.test(userAgent)) return "Chrome"
  if (/safari\//i.test(userAgent)) return "Safari"
  return "Other"
}

function deviceFromUserAgent(userAgent) {
  if (/ipad|tablet/i.test(userAgent)) return "tablet"
  if (/mobi|android|iphone|ipod/i.test(userAgent)) return "mobile"
  return "desktop"
}

function verifySession(value, secret) {
  const [id, signature] = value?.split(".") || []
  if (!id || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return null

  const expected = createHmac("sha256", secret).update(id).digest("hex")
  const received = Buffer.from(signature)
  const trusted = Buffer.from(expected)
  return received.length === trusted.length && timingSafeEqual(received, trusted) ? id : null
}

function visitorRateKey(request, secret) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
  return `birthday:visit-rate:${createHmac("sha256", secret).update(forwardedFor).digest("hex")}`
}

async function isRateLimited(redis, request, sessionId, secret) {
  const keys = [
    visitorRateKey(request, secret),
    `birthday:visit-session-rate:${createHmac("sha256", secret).update(sessionId).digest("hex")}`,
  ]

  const counts = await Promise.all(
    keys.map(async (key) => {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 60)
      return count
    }),
  )

  return counts.some((count) => count > MAX_EVENTS_PER_MINUTE)
}

export async function POST(request) {
  const origin = request.headers.get("origin")
  const siteOrigin = new URL(request.url).origin
  if (origin && origin !== siteOrigin) {
    return Response.json({ error: "Cross-site requests are not allowed" }, { status: 403 })
  }

  const redis = getRedis()
  const secret = process.env.TRACKING_SESSION_SECRET
  const sessionId = verifySession(request.cookies.get(COOKIE_NAME)?.value, secret || "")
  if (!redis || !secret || !sessionId) {
    return Response.json({ error: "Visit logging is unavailable" }, { status: 403 })
  }

  const contentLength = Number(request.headers.get("content-length") || 0)
  if (contentLength > MAX_EVENT_BYTES) {
    return Response.json({ error: "Visit event is too large" }, { status: 413 })
  }

  let payload
  try {
    const body = await request.text()
    if (body.length > MAX_EVENT_BYTES) {
      return Response.json({ error: "Visit event is too large" }, { status: 413 })
    }
    payload = JSON.parse(body)
  } catch {
    return Response.json({ error: "Invalid visit event" }, { status: 400 })
  }

  const { type, chapter, action } = payload
  if (
    !EVENT_TYPES.has(type) ||
    !CHAPTERS.has(chapter) ||
    (type === "reels-choice" && !REEL_ACTIONS.has(action)) ||
    (type === "chapter" && action !== undefined)
  ) {
    return Response.json({ error: "Invalid visit event" }, { status: 400 })
  }

  try {
    if (await isRateLimited(redis, request, sessionId, secret)) {
      return Response.json({ error: "Too many visit events" }, { status: 429 })
    }

    const userAgent = request.headers.get("user-agent") || ""
    const record = {
      id: randomUUID(),
      type,
      chapter,
      ...(type === "reels-choice" ? { action } : {}),
      timestamp: new Date().toISOString(),
      session: createHmac("sha256", secret).update(sessionId).digest("hex"),
      device: deviceFromUserAgent(userAgent),
      browser: browserFromUserAgent(userAgent),
    }

    await redis.lpush("birthday:visits", JSON.stringify(record))
    return Response.json({ logged: true }, { status: 201 })
  } catch {
    return Response.json({ error: "Unable to record visit" }, { status: 500 })
  }
}
