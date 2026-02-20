import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import { SettingsFormClient } from './SettingsFormClient'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, displayName: true, bio: true, avatar: true },
  })

  if (!user) redirect('/login')

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>
      <SettingsFormClient user={user} />
    </div>
  )
}
