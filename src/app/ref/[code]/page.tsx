import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { RefRedirect } from './RefRedirect'

interface Props {
  params: Promise<{ code: string }>
}

export default async function RefPage({ params }: Props) {
  const { code } = await params
  const upper = code.toUpperCase()

  const referralCode = await prisma.referralCode.findFirst({
    where: { code: upper, status: 'active' },
  })

  // Invalid code — send to login anyway (no error shown)
  if (!referralCode) redirect('/login?mode=register')

  return <RefRedirect code={upper} />
}
