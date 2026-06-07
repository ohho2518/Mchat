import { prisma } from '@/lib/db/prisma'

/**
 * Persistent rate limiter backed by DB — works across all Vercel instances.
 * Falls back to allowing the request on DB error.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date()
  try {
    const record = await prisma.rateLimit.findUnique({ where: { key } })

    if (!record || record.resetAt < now) {
      await prisma.rateLimit.upsert({
        where:  { key },
        create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
        update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
      })
      return true
    }

    if (record.count >= max) return false

    await prisma.rateLimit.update({
      where: { key },
      data:  { count: { increment: 1 } },
    })
    return true
  } catch {
    return true // allow on DB error — don't block users due to rate limit store failure
  }
}
