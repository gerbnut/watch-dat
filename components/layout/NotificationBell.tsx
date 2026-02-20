'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, Heart, MessageSquare, UserPlus, AtSign, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn, getInitials, formatRelativeTime } from '@/lib/utils'

const TYPE_ICONS = {
  NEW_FOLLOWER: UserPlus,
  LIKED_REVIEW: Heart,
  COMMENTED_REVIEW: MessageSquare,
  REPLIED_COMMENT: MessageSquare,
  MENTION: AtSign,
}

const TYPE_LABELS: Record<string, string> = {
  NEW_FOLLOWER: 'started following you',
  LIKED_REVIEW: 'liked your review',
  COMMENTED_REVIEW: 'commented on your review',
  REPLIED_COMMENT: 'replied to your comment',
  MENTION: 'mentioned you',
}

function notificationHref(n: any): string {
  if (n.review?.id) return `/review/${n.review.id}`
  if (n.reviewId) return `/review/${n.reviewId}`
  if (n.type === 'NEW_FOLLOWER') return `/user/${n.actor.username}`
  return '/notifications'
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Poll unread count (lightweight)
  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close on click outside / scroll
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | Event) => {
      if (e instanceof MouseEvent && containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, { passive: true, capture: true })
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, { capture: true })
    }
  }, [open])

  async function fetchUnread() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {}
  }

  async function openPanel() {
    setOpen((v) => !v)
    if (!open) {
      setLoading(true)
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications ?? [])
          setUnreadCount(data.unreadCount ?? 0)
        }
      } finally {
        setLoading(false)
      }
    }
  }

  async function markAllRead() {
    if (markingRead) return
    setMarkingRead(true)
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } finally {
      setMarkingRead(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={openPanel}
        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cinema-500 px-0.5 text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel — full-screen on mobile, dropdown on desktop */}
          <div className={cn(
            'fixed inset-x-0 top-14 bottom-0 z-50 flex flex-col bg-background overflow-hidden',
            'md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-80 md:max-h-[480px] md:bottom-auto',
            'md:rounded-xl md:border md:shadow-xl'
          )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={markAllRead}
                    disabled={markingRead}
                  >
                    {markingRead ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark all read'}
                  </Button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type as keyof typeof TYPE_ICONS] ?? Bell
                  const label = TYPE_LABELS[n.type] ?? n.type
                  const href = notificationHref(n)
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors',
                        !n.read && 'bg-cinema-500/5'
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={n.actor.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(n.actor.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug">
                          <span className="font-semibold">{n.actor.displayName}</span>
                          {' '}{label}
                          {n.review?.movie && (
                            <span className="text-muted-foreground"> of <span className="text-foreground">{n.review.movie.title}</span></span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', !n.read ? 'text-cinema-400' : 'text-muted-foreground')} />
                    </Link>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t px-4 py-2">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-cinema-400 hover:underline"
              >
                View all notifications →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
