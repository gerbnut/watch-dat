/**
 * Simple in-process rate limiter.
 *
 * Works within a single serverless execution context. On Vercel / serverless
 * each lambda instance is independent, so this limits per-instance rather than
 * globally — sufficient for basic abuse prevention without external deps.
 *
 * For production at scale, swap for Upstash Redis + @upstash/ratelimit.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Prune stale entries every 5 minutes to prevent memory leaks
let lastPruned = Date.now()
function maybePrune() {
  const now = Date.now()
  if (now - lastPruned < 5 * 60 * 1000) return
  lastPruned = now
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key)
  })
}

interface RateLimitOptions {
  /** Unique key (e.g. `ip:${ip}:search`) */
  key: string
  /** Maximum requests per window */
  limit: number
  /** Window size in seconds */
  windowSec: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  headers: Record<string, string>
}

export function rateLimit({ key, limit, windowSec }: RateLimitOptions): RateLimitResult {
  maybePrune()
  const now = Date.now()
  const windowMs = windowSec * 1000

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs }
    store.set(key, newEntry)
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: newEntry.resetAt,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(limit - 1),
        'X-RateLimit-Reset': String(Math.ceil(newEntry.resetAt / 1000)),
      },
    }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  const allowed = entry.count <= limit

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    headers: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
      ...(allowed ? {} : { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) }),
    },
  }
}

/** Extract the caller's IP from a Next.js request */
export function getIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}
