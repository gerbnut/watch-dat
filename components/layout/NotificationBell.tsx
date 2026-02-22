'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, Heart, MessageSquare, UserPlus, AtSign, Loader2, X } from 'lucide-react'
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

  // Lock body scroll when panel open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on click outside (desktop only — mobile uses close button / backdrop)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
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
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
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
      {/* Bell button — 44px touch target for iPhone */}
      <button
        onClick={openPanel}
        className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-accent active:bg-accent/70 transition-colors -mr-1.5"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinema-500 px-1 text-[10px] font-bold text-black leading-none tabular-nums">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop — z-[58] sits above navbar (z-40) and BottomTabBar (z-50) */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-[58] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel:
              Mobile  — fixed sheet from top-14 to bottom, z-[60] above BottomTabBar
              Desktop — absolute dropdown, standard z-50 */}
          <div className={cn(
            // Mobile sheet
            'fixed inset-x-0 top-14 z-[60] flex flex-col bg-background',
            'md:hidden',
            // iOS safe area bottom
            'pb-[env(safe-area-inset-bottom)]',
          )}
            style={{ bottom: 0 }}
          >
            {/* Drag handle visual */}
            <div className="flex justify-center pt-2 pb-0 shrink-0">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={markAllRead}
                    disabled={markingRead}
                  >
                    {markingRead ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark read'}
                  </Button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent transition-colors ml-1"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Bell className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">You're all caught up</p>
                  <p className="text-xs opacity-60">No new notifications</p>
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
                        'flex items-start gap-3 px-4 py-3.5 hover:bg-accent/50 active:bg-accent/70 transition-colors',
                        !n.read && 'bg-cinema-500/5'
                      )}
                    >
                      {!n.read && (
                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-cinema-400 shrink-0" />
                      )}
                      {n.read && <div className="mt-2 h-1.5 w-1.5 shrink-0" />}
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={n.actor.avatar ?? undefined} />
                        <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                          {getInitials(n.actor.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">{n.actor.displayName}</span>
                          {' '}<span className="text-muted-foreground">{label}</span>
                          {n.review?.movie && (
                            <span className="text-muted-foreground"> — <span className="text-foreground font-medium">{n.review.movie.title}</span></span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      <Icon className={cn(
                        'h-4 w-4 shrink-0 mt-1',
                        !n.read ? 'text-cinema-400' : 'text-muted-foreground/40'
                      )} />
                    </Link>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t px-4 py-3">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-sm text-cinema-400 hover:text-cinema-300 transition-colors font-medium"
              >
                View all notifications →
              </Link>
            </div>
          </div>

          {/* Desktop dropdown — separate element, not affected by mobile styles */}
          <div className={cn(
            'hidden md:flex md:flex-col',
            'absolute right-0 top-full mt-2 w-80 max-h-[480px]',
            'rounded-xl border bg-popover shadow-2xl z-50 overflow-hidden'
          )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <h2 className="text-sm font-semibold">Notifications</h2>
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
