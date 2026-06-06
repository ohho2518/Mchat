import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { hashPassword, verifyPassword } from '@/lib/utils/password'

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
}).refine(
  (d) => !(d.newPassword && !d.currentPassword),
  { message: 'กรุณาระบุรหัสผ่านปัจจุบัน', path: ['currentPassword'] }
)

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, currentPassword, newPassword } = parsed.data
    const updates: Record<string, unknown> = {}

    if (name) updates.name = name

    if (newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user?.passwordHash) {
        return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 404 })
      }
      const valid = await verifyPassword(currentPassword!, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 })
      }
      updates.passwordHash = await hashPassword(newPassword)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่ต้องการอัปเดต' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
