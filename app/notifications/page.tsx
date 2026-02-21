import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Heart, UserPlus, MessageSquare, AtSign } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { MarkReadClient } from './MarkReadClient'

export const metadata: Metadata = { title: 'Notifications' }

const ICONS = {
  NEW_FOLLOWER: UserPlus,
  LIKED_REVIEW: Heart,
  COMMENTED_REVIEW: MessageSquare,
  REPLIED_COMMENT: MessageSquare,
  MENTION: AtSign,
}

const LABELS: Record<string, string> = {
  NEW_FOLLOWER: 'started following you',
  LIKED_REVIEW: 'liked your review',
  COMMENTED_REVIEW: 'commented on your review',
  REPLIED_COMMENT: 'replied to your comment',
  MENTION: 'mentioned you',
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      actor: { select: { id: true, username: true, displayName: true, avatar: true } },
      review: {
        include: { movie: { select: { title: true, tmdbId: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unread = notifications.filter((n) => !n.read)

  function notificationHref(n: (typeof notifications)[0]): string {
    if (n.reviewId) return `/review/${n.reviewId}`
    if (n.type === 'NEW_FOLLOWER') return `/user/${n.actor.username}`
    return '#'
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unread.length > 0 && <MarkReadClient />}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <div className="space-y-1.5">
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              You'll get notified when someone follows you, likes a review, or leaves a comment
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y divide-border">
          {notifications.map((n) => {
            const Icon = ICONS[n.type as keyof typeof ICONS] ?? Bell
            const label = LABELS[n.type] ?? n.type
            const href = notificationHref(n)

            return (
              <Link
                key={n.id}
                href={href}
                className={cn('flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors', !n.read && 'bg-cinema-500/5')}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={n.actor.avatar ?? undefined} />
                  <AvatarFallback className="text-xs">{getInitials(n.actor.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{n.actor.displayName}</span>
                    {' '}{label}
                    {n.review?.movie && (
                      <span className="text-muted-foreground"> of <span className="text-foreground font-medium">{n.review.movie.title}</span></span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                </div>
                <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', !n.read ? 'text-cinema-400' : 'text-muted-foreground')} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
