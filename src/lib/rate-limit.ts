import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './db-prisma'

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 100, // max requests per window
  blockDurationMs: 5 * 60 * 1000, // 5 minutes block
}

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; windowStart: number; blocked?: boolean; blockedUntil?: number }>()

// Clean up memory store periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of memoryStore.entries()) {
      if (now - value.windowStart > RATE_LIMIT_CONFIG.windowMs * 2) {
        memoryStore.delete(key)
      }
    }
  }, 60000)
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: Date
  blocked: boolean
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string
): Promise<RateLimitResult> {
  const key = `${identifier}:${endpoint}`
  const now = Date.now()
  const windowStart = new Date(now - (now % RATE_LIMIT_CONFIG.windowMs))

  // Try database-based rate limiting in production
  if (process.env.DATABASE_URL?.includes('postgres')) {
    try {
      const existing = await prisma.rateLimit.findUnique({
        where: { identifier: key },
      })

      if (existing) {
        // Check if blocked
        if (existing.blocked && existing.blockedUntil && existing.blockedUntil > new Date()) {
          return {
            success: false,
            remaining: 0,
            resetAt: existing.blockedUntil,
            blocked: true,
          }
        }

        // Check if window has reset
        if (existing.windowStart < windowStart) {
          await prisma.rateLimit.update({
            where: { identifier: key },
            data: {
              requestCount: 1,
              windowStart,
              blocked: false,
              blockedUntil: null,
            },
          })
          return {
            success: true,
            remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
            resetAt: new Date(now + RATE_LIMIT_CONFIG.windowMs),
            blocked: false,
          }
        }

        // Check if over limit
        if (existing.requestCount >= RATE_LIMIT_CONFIG.maxRequests) {
          const blockedUntil = new Date(now + RATE_LIMIT_CONFIG.blockDurationMs)
          await prisma.rateLimit.update({
            where: { identifier: key },
            data: { blocked: true, blockedUntil },
          })
          return {
            success: false,
            remaining: 0,
            resetAt: blockedUntil,
            blocked: true,
          }
        }

        // Increment count
        await prisma.rateLimit.update({
          where: { identifier: key },
          data: { requestCount: { increment: 1 } },
        })
        return {
          success: true,
          remaining: RATE_LIMIT_CONFIG.maxRequests - existing.requestCount - 1,
          resetAt: new Date(now + RATE_LIMIT_CONFIG.windowMs),
          blocked: false,
        }
      }

      // Create new record
      await prisma.rateLimit.create({
        data: {
          identifier: key,
          endpoint,
          requestCount: 1,
          windowStart,
        },
      })
      return {
        success: true,
        remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
        resetAt: new Date(now + RATE_LIMIT_CONFIG.windowMs),
        blocked: false,
      }
    } catch (error) {
      console.error('Rate limit database error:', error)
      // Fall back to memory store
    }
  }

  // Memory-based rate limiting (fallback)
  const existing = memoryStore.get(key)

  if (existing) {
    // Check if blocked
    if (existing.blocked && existing.blockedUntil && existing.blockedUntil > now) {
      return {
        success: false,
        remaining: 0,
        resetAt: new Date(existing.blockedUntil),
        blocked: true,
      }
    }

    // Check if window has reset
    if (now - existing.windowStart > RATE_LIMIT_CONFIG.windowMs) {
      memoryStore.set(key, { count: 1, windowStart: now })
      return {
        success: true,
        remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
        resetAt: new Date(now + RATE_LIMIT_CONFIG.windowMs),
        blocked: false,
      }
    }

    // Check if over limit
    if (existing.count >= RATE_LIMIT_CONFIG.maxRequests) {
      const blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs
      memoryStore.set(key, { ...existing, blocked: true, blockedUntil })
      return {
        success: false,
        remaining: 0,
        resetAt: new Date(blockedUntil),
        blocked: true,
      }
    }

    // Increment count
    memoryStore.set(key, { ...existing, count: existing.count + 1 })
    return {
      success: true,
      remaining: RATE_LIMIT_CONFIG.maxRequests - existing.count - 1,
      resetAt: new Date(existing.windowStart + RATE_LIMIT_CONFIG.windowMs),
      blocked: false,
    }
  }

  // Create new record
  memoryStore.set(key, { count: 1, windowStart: now })
  return {
    success: true,
    remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
    resetAt: new Date(now + RATE_LIMIT_CONFIG.windowMs),
    blocked: false,
  }
}

// Higher-order function to wrap API handlers with rate limiting
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options?: { maxRequests?: number; windowMs?: number }
) {
  return async (req: NextRequest, context?: any) => {
    // Get identifier (IP or user ID)
    const identifier =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const endpoint = new URL(req.url).pathname

    const result = await checkRateLimit(identifier, endpoint)

    // Add rate limit headers
    const response = result.success
      ? await handler(req, context)
      : NextResponse.json(
          { error: 'Too many requests', retryAfter: result.resetAt },
          { status: 429 }
        )

    response.headers.set('X-RateLimit-Limit', String(options?.maxRequests || RATE_LIMIT_CONFIG.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString())

    if (result.blocked) {
      response.headers.set('Retry-After', String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)))
    }

    return response
  }
}

// Get client IP from request
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
