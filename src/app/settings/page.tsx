'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogOut, Pencil, X, Check, Info, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'

const ProfileSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อ').max(50),
})

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
  newPassword: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'รหัสผ่านใหม่ไม่ตรงกัน',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof ProfileSchema>
type PasswordForm = z.infer<typeof PasswordSchema>

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [editName, setEditName] = useState(false)
  const [editPass, setEditPass] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [passSuccess, setPassSuccess] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  const nameForm = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: session?.user?.name ?? '' },
  })

  const passForm = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema),
  })

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const submitName = async (data: ProfileForm) => {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name }),
    })
    if (!res.ok) {
      const err = await res.json()
      nameForm.setError('name', { message: err.error ?? 'เกิดข้อผิดพลาด' })
      return
    }
    await update({ name: data.name })
    setEditName(false)
    setNameSuccess(true)
    setTimeout(() => setNameSuccess(false), 3000)
  }

  const submitPassword = async (data: PasswordForm) => {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      passForm.setError('currentPassword', { message: err.error ?? 'เกิดข้อผิดพลาด' })
      return
    }
    passForm.reset()
    setEditPass(false)
    setPassSuccess(true)
    setTimeout(() => setPassSuccess(false), 3000)
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
      {/* Avatar + info */}
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

      {/* Edit name */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</p>
            {!editName && (
              <button onClick={() => { setEditName(true); nameForm.setValue('name', session.user.name ?? '') }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Pencil className="h-3 w-3" /> แก้ไข
              </button>
            )}
          </div>

          {editName ? (
            <form onSubmit={nameForm.handleSubmit(submitName)} className="space-y-3">
              <Input
                {...nameForm.register('name')}
                error={nameForm.formState.errors.name?.message}
                placeholder="ชื่อของคุณ"
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={nameForm.formState.isSubmitting}>
                  <Check className="h-3 w-3" /> บันทึก
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditName(false)}>
                  <X className="h-3 w-3" /> ยกเลิก
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-600">{session.user.name}</p>
          )}
          {nameSuccess && <p className="text-xs text-green-600">✓ อัปเดตชื่อเรียบร้อย</p>}
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">รหัสผ่าน</p>
            {!editPass && (
              <button onClick={() => setEditPass(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Pencil className="h-3 w-3" /> เปลี่ยน
              </button>
            )}
          </div>

          {editPass ? (
            <form onSubmit={passForm.handleSubmit(submitPassword)} className="space-y-3">
              <Input
                {...passForm.register('currentPassword')}
                type="password"
                label="รหัสผ่านปัจจุบัน"
                error={passForm.formState.errors.currentPassword?.message}
                placeholder="••••••"
              />
              <Input
                {...passForm.register('newPassword')}
                type="password"
                label="รหัสผ่านใหม่"
                error={passForm.formState.errors.newPassword?.message}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
              <Input
                {...passForm.register('confirmPassword')}
                type="password"
                label="ยืนยันรหัสผ่านใหม่"
                error={passForm.formState.errors.confirmPassword?.message}
                placeholder="••••••"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={passForm.formState.isSubmitting}>
                  <Check className="h-3 w-3" /> บันทึก
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setEditPass(false); passForm.reset() }}>
                  <X className="h-3 w-3" /> ยกเลิก
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400">••••••••</p>
          )}
          {passSuccess && <p className="text-xs text-green-600">✓ เปลี่ยนรหัสผ่านเรียบร้อย</p>}
        </div>
      </Card>

      {/* App info */}
      <Card>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Info className="h-4 w-4 text-gray-400" />
          <span>MChat v1.0.0 — บันทึกรายรับรายจ่ายด้วยแชท</span>
        </div>
      </Card>

      {/* Install PWA */}
      {!isInstalled && installPrompt && (
        <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={handleInstall}>
          <Download className="h-4 w-4" />
          ติดตั้งแอปบนมือถือ
        </Button>
      )}
      {isInstalled && (
        <p className="text-center text-sm text-green-600">✓ ติดตั้งแอปแล้ว</p>
      )}

      {/* Logout */}
      <Button variant="danger" size="lg" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        ออกจากระบบ
      </Button>
    </div>
  )
}
