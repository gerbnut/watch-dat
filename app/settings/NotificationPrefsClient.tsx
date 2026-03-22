'use client'

import { useState, useEffect } from 'react'
import { Bell, Heart, MessageSquare, UserPlus, AtSign, Send } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const NOTIFICATION_TYPES = [
  { key: 'NEW_FOLLOWER', label: 'New followers', description: 'When someone follows you', icon: UserPlus },
  { key: 'LIKED_REVIEW', label: 'Review likes', description: 'When someone likes your review', icon: Heart },
  { key: 'COMMENTED_REVIEW', label: 'Comments', description: 'When someone comments on your review', icon: MessageSquare },
  { key: 'REPLIED_COMMENT', label: 'Replies', description: 'When someone replies to your comment', icon: MessageSquare },
  { key: 'MENTION', label: 'Mentions', description: 'When someone @mentions you', icon: AtSign },
  { key: 'RECOMMENDED_MOVIE', label: 'Recommendations', description: 'When a friend recommends a film', icon: Send },
] as const

export function NotificationPrefsClient() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((d) => { setPrefs(d.prefs ?? {}); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  async function toggle(key: string) {
    const current = prefs[key] ?? true
    const updated = { ...prefs, [key]: !current }
    setPrefs(updated)
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch {
      setPrefs(prefs)
      toast({ title: 'Failed to update', variant: 'destructive' })
    }
  }

  if (!loaded) return null

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-cinema-400" />
        <h2 className="font-semibold text-sm">Notification Preferences</h2>
      </div>
      <div className="space-y-1">
        {NOTIFICATION_TYPES.map(({ key, label, description, icon: Icon }) => {
          const enabled = prefs[key] ?? true
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div
                className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-cinema-500' : 'bg-white/[0.08]'}`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
