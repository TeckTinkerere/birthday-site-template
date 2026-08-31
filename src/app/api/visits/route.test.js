// Unit test for the visits API record shape (task 2.3).
// Asserts a stored reels-timing record includes `phase` and a server-generated
// `timestamp`, and that no stored record includes an IP or location field.
// Validates: Requirements 6.4
import { describe, it, expect, vi, beforeEach } from "vitest"

const SECRET = "test-tracking-session-secret"
const SESSION_ID = "session-abc-123"

// Capture every payload pushed to redis so we can inspect the stored record.
const lpushCalls = []

// Mock @upstash/redis so the route uses an in-memory fake with no network.
vi.mock("@upstash/redis", () => {
  class Redis {
    async lpush(key, value) {
      lpushCalls.push({ key, value })
      return lpushCalls.length
    }
    async incr() {
      return 1
    }
    async expire() {
      return 1
    }
  }
  return { Redis }
})

// Build a real, valid signed session cookie value using the same HMAC scheme
// the route verifies with, rather than mocking crypto.
async function signedSessionValue(id = SESSION_ID, secret = SECRET) {
  const { createHmac } = await import("node:crypto")
  const signature = createHmac("sha256", secret).update(id).digest("hex")
  return `${id}.${signature}`
}

// Minimal Request-like object matching what the route reads: cookies.get(),
// headers.get(), url, and text().
function makeRequest(body, { cookieValue, headers = {} } = {}) {
  const headerMap = new Map(
    Object.entries({ "content-length": String(Buffer.byteLength(body)), ...headers }).map(
      ([k, v]) => [k.toLowerCase(), v],
    ),
  )
  return {
    url: "https://birthday.example/api/visits",
    headers: { get: (name) => headerMap.get(name.toLowerCase()) ?? null },
    cookies: { get: (name) => (name === "birthday_visit" ? { value: cookieValue } : undefined) },
    text: async () => body,
  }
}

beforeEach(() => {
  lpushCalls.length = 0
  vi.resetModules()
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.example"
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token"
  process.env.TRACKING_SESSION_SECRET = SECRET
})

async function postEvent(event, options) {
  const { POST } = await import("./route.js")
  return POST(makeRequest(JSON.stringify(event), options))
}

describe("visits API record shape", () => {
  it("stores a reels-timing record with phase and a server-generated ISO timestamp", async () => {
    const cookieValue = await signedSessionValue()
    const before = Date.now()

    const response = await postEvent(
      { type: "reels-timing", chapter: "reels", phase: "enter" },
      { cookieValue, headers: { "user-agent": "Mozilla/5.0 Chrome/120" } },
    )
    const after = Date.now()

    expect(response.status).toBe(201)
    expect(lpushCalls).toHaveLength(1)

    const record = JSON.parse(lpushCalls[0].value)

    // reels-timing records carry the phase.
    expect(record.type).toBe("reels-timing")
    expect(record.chapter).toBe("reels")
    expect(record.phase).toBe("enter")

    // timestamp is server-generated (not from the client payload) and is a
    // valid ISO string produced during handling.
    expect(typeof record.timestamp).toBe("string")
    const stamp = Date.parse(record.timestamp)
    expect(Number.isNaN(stamp)).toBe(false)
    expect(stamp).toBeGreaterThanOrEqual(before)
    expect(stamp).toBeLessThanOrEqual(after)
  })

  it("stores no IP address or location fields on any record", async () => {
    const cookieValue = await signedSessionValue()

    await postEvent(
      { type: "reels-timing", chapter: "reels", phase: "exit" },
      {
        cookieValue,
        headers: {
          "user-agent": "Mozilla/5.0 Chrome/120",
          // Provide an IP header to prove it is never persisted in the record.
          "x-forwarded-for": "203.0.113.7",
        },
      },
    )

    expect(lpushCalls).toHaveLength(1)
    const record = JSON.parse(lpushCalls[0].value)

    const forbiddenKeys = ["ip", "ipAddress", "ip_address", "location", "geo", "city", "country", "region", "lat", "lng", "longitude", "latitude"]
    for (const key of forbiddenKeys) {
      expect(record).not.toHaveProperty(key)
    }

    // Defensive: no stored value equals the incoming IP.
    const serialized = JSON.stringify(record)
    expect(serialized).not.toContain("203.0.113.7")

    // The record only exposes the privacy-preserving fields.
    expect(Object.keys(record).sort()).toEqual(
      ["browser", "chapter", "device", "id", "phase", "session", "timestamp", "type"].sort(),
    )
  })
})
