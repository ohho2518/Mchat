import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

interface AuditParams {
  actorId?: string
  actorEmail?: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Prisma.InputJsonValue
  ip?: string
}

export function logAudit(params: AuditParams): void {
  prisma.auditLog.create({ data: params }).catch((err) => {
    console.error('[audit] Failed to write:', err)
  })
}
