'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LogOut, User, Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  if (status === 'loading') {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (!session) {
    return (
      <div className="p-4 text-center space-y-4">
        <p className="text-sm text-gray-600">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
        <Button onClick={() => router.push('/login')}>เข้าสู่ระบบ</Button>
      </div>
    )
  }

  const initial = session.user.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Profile */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>
        </div>
      </Card>

      {/* App info */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <User className="h-4 w-4 text-gray-400" />
            <span>บัญชีของฉัน</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Info className="h-4 w-4 text-gray-400" />
            <span>MChat v1.0.0 — บันทึกรายรับรายจ่ายด้วยแชท</span>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        size="lg"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        ออกจากระบบ
      </Button>
    </div>
  )
}
