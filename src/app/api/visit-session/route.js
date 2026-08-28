import { createHmac, randomUUID } from "node:crypto"

export const runtime = "nodejs"

const COOKIE_NAME = "birthday_visit"
const MAX_SESSION_REQUESTS_PER_MINUTE = 5

function signedSession(secret) {
  const id = randomUUID()
  const signature = createHmac("sha256", secret).update(id).digest("hex")
  return `${id}.${signature}`
}

function visitorRateKey(request, secret) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
  return `birthday:session-rate:${createHmac("sha256", secret).update(forwardedFor).digest("hex")}`
}

export async function POST(request) {
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Cross-site requests are not allowed" }, { status: 403 })
  }

  const secret = process.env.TRACKING_SESSION_SECRET
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!secret || !redisUrl || !redisToken) {
    return Response.json({ error: "Visit logging is not configured" }, { status: 503 })
  }

  const { Redis } = await import("@upstash/redis")
  const redis = new Redis({ url: redisUrl, token: redisToken })
  const rateKey = visitorRateKey(request, secret)
  const count = await redis.incr(rateKey)
  if (count === 1) await redis.expire(rateKey, 60)
  if (count > MAX_SESSION_REQUESTS_PER_MINUTE) {
    return Response.json({ error: "Too many session requests" }, { status: 429 })
  }

  const cookie = signedSession(secret)
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": `${COOKIE_NAME}=${cookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
    },
  })
}
