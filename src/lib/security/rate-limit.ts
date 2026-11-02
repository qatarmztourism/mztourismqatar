/**
 * Rate Limiting Utility for MZ Tourism Qatar
 *
 * Implements an in-memory sliding window rate limiter for public-facing Server Actions
 * and API endpoints (guest booking submission, token lookup, deposit proof verification).
 *
 * ARCHITECTURAL LIMITATION NOTICE:
 * This in-memory implementation tracks state per running Node.js process. In single-server
 * or containerized deployments, it provides immediate protection against automated spam
 * and brute-force token enumeration.
 *
 * In a distributed, multi-region, or serverless deployment (e.g. Vercel multi-region Lambdas),
 * requests hit independent server instances. For distributed production environments,
 * connect a persistent centralized store (such as Upstash Redis or Supabase RPC rate-limiting).
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in ms
}

interface RateLimitRecord {
  timestamps: number[];
}

export class MemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private lastPruneTime: number = Date.now();

  /**
   * @param maxRequests Maximum number of requests allowed within the window
   * @param windowMs Time window in milliseconds
   */
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Periodically remove expired timestamps and stale IP entries
   */
  private prune(now: number): void {
    if (now - this.lastPruneTime < 30000) return; // Prune at most every 30 seconds
    this.lastPruneTime = now;

    const threshold = now - this.windowMs;
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((t) => t > threshold);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check whether an action by the given identifier is within rate limits.
   */
  public check(identifier: string): RateLimitResult {
    const now = Date.now();
    this.prune(now);

    const windowStart = now - this.windowMs;
    let record = this.store.get(identifier);

    if (!record) {
      record = { timestamps: [] };
      this.store.set(identifier, record);
    }

    // Keep only timestamps within current sliding window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetTime = oldestInWindow + this.windowMs;
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime,
      };
    }

    // Record this request
    record.timestamps.push(now);
    const resetTime = record.timestamps[0] + this.windowMs;

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.timestamps.length,
      resetTime,
    };
  }

  /**
   * Reset store (useful for testing)
   */
  public reset(): void {
    this.store.clear();
    this.lastPruneTime = Date.now();
  }
}

// -----------------------------------------------------------------------------
// Preconfigured Limiters for Guest Operations
// -----------------------------------------------------------------------------

/**
 * Guest booking creation limiter:
 * Limits guest booking creation to 5 submissions per hour per IP.
 */
export const guestBookingLimiter = new MemoryRateLimiter(5, 60 * 60 * 1000);

/**
 * Token lookup limiter:
 * Limits booking status checks by token to 10 requests per minute per IP.
 */
export const tokenLookupLimiter = new MemoryRateLimiter(10, 60 * 1000);

/**
 * Deposit proof verification limiter:
 * Limits receipt upload submissions to 10 requests per minute per IP.
 */
export const depositProofLimiter = new MemoryRateLimiter(10, 60 * 1000);

/**
 * Custom trip request limiter:
 * Limits bespoke itinerary inquiries to 6 submissions per hour per IP.
 */
export const customTripLimiter = new MemoryRateLimiter(6, 60 * 60 * 1000);

/**
 * Authentication and password recovery limiter:
 * Limits authentication attempts and password reset requests to 10 requests per 15 minutes per IP.
 */
export const authLimiter = new MemoryRateLimiter(10, 15 * 60 * 1000);

/**
 * Customer proposal access & action limiter:
 * Limits proposal token lookups and customer feedback to 20 requests per minute per IP.
 */
export const proposalAccessLimiter = new MemoryRateLimiter(20, 60 * 1000);

/**
 * Contact form inquiry limiter:
 * Limits concierge contact inquiries to 5 requests per 15 minutes per IP.
 */
export const contactFormLimiter = new MemoryRateLimiter(5, 15 * 60 * 1000);

/**
 * Newsletter subscription limiter:
 * Limits email newsletter signups to 5 requests per hour per IP.
 */
export const newsletterLimiter = new MemoryRateLimiter(5, 60 * 60 * 1000);

/**
 * Extracts a best-effort client IP from incoming headers or fallback.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs; first is original client
    const clientIp = forwardedFor.split(",")[0]?.trim();
    if (clientIp) return clientIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}
