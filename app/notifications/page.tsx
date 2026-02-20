import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Heart, UserPlus, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { MarkReadClient } from './MarkReadClient'

export const metadata: Metadata = { title: 'Notifications' }

const ICONS = {
  NEW_FOLLOWER: UserPlus,
  LIKED_REVIEW: Heart,
  COMMENTED_REVIEW: MessageSquare,
}

const LABELS = {
  NEW_FOLLOWER: 'started following you',
  LIKED_REVIEW: 'liked your review',
  COMMENTED_REVIEW: 'commented on your review',
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      actor: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unread = notifications.filter((n) => !n.read)

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unread.length > 0 && <MarkReadClient />}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y divide-border">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell
            const label = LABELS[n.type] ?? n.type

            return (
              <div key={n.id} className={cn('flex items-start gap-3 p-4', !n.read && 'bg-cinema-500/5')}>
                <Link href={`/user/${n.actor.username}`}>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={n.actor.avatar ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(n.actor.displayName)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link href={`/user/${n.actor.username}`} className="font-semibold hover:underline">
                      {n.actor.displayName}
                    </Link>
                    {' '}{label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                </div>
                <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', !n.read ? 'text-cinema-400' : 'text-muted-foreground')} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
