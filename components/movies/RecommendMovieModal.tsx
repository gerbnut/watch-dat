'use client'

import { useState, useEffect } from 'react'
import { Loader2, Send, Search, Check } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'

interface Friend {
  id: string
  username: string
  displayName: string
  avatar: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  movieTitle: string
  tmdbId: number
}

export function RecommendMovieModal({ open, onClose, movieTitle, tmdbId }: Props) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [filtered, setFiltered] = useState<Friend[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Friend | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingFriends(true)
    fetch('/api/friends')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setFriends(list)
        setFiltered(list)
      })
      .catch(() => {})
      .finally(() => setLoadingFriends(false))
  }, [open])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    setFiltered(
      q
        ? friends.filter(
            (f) =>
              f.username.toLowerCase().includes(q) ||
              f.displayName.toLowerCase().includes(q)
          )
        : friends
    )
  }, [query, friends])

  function handleClose() {
    setSelected(null)
    setMessage('')
    setQuery('')
    setSent(false)
    onClose()
  }

  async function handleSend() {
    if (!selected) return
    setSending(true)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUsername: selected.username,
          tmdbId,
          message: message.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send')
      }
      setSent(true)
      toast({ title: `Recommended to ${selected.displayName}!`, variant: 'success' })
      setTimeout(handleClose, 1200)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    // z-[60] beats BottomTabBar (z-50) so modal covers it on iOS
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      {/* max-h uses dvh so it respects the keyboard-reduced visual viewport on iOS */}
      <div
        className="relative w-full max-w-md backdrop-blur-xl bg-[hsl(225_14%_7%_/_0.95)] border border-white/[0.06] rounded-t-2xl sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(calc(100dvh - env(keyboard-inset-height, 0px) - 4rem), 600px)' }}
      >
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 pb-2 space-y-4 flex flex-col min-h-0">
          <div>
            <h2 className="font-semibold text-base">Recommend a film</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">"{movieTitle}"</p>
          </div>

          {/* Friend picker */}
          {!selected ? (
            <div className="flex-1 overflow-hidden flex flex-col gap-2 min-h-0">
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search following…"
                  className="pl-8 h-8 text-sm"
                />
              </div>

              <div className="overflow-y-auto flex-1 rounded-xl border border-white/[0.04] bg-white/[0.02] divide-y divide-white/[0.03]">
                {loadingFriends ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {friends.length === 0 ? 'Follow people to recommend films to them' : 'No matches'}
                  </p>
                ) : (
                  filtered.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => setSelected(friend)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={friend.avatar ?? undefined} />
                        <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                          {getInitials(friend.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{friend.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{friend.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected friend */}
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={selected.avatar ?? undefined} />
                  <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                    {getInitials(selected.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{selected.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{selected.username}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Change
                </button>
              </div>

              {/* Optional message */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Add a note (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="You'd love this one…"
                  maxLength={300}
                  rows={3}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2 text-sm resize-none placeholder:text-muted-foreground/40 focus:outline-none focus:border-cinema-500/30 focus:ring-2 focus:ring-cinema-500/10"
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/300</p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer — cancel always visible, send shown after selecting */}
        <div className="shrink-0 border-t border-white/[0.04] px-5 py-4 flex gap-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <Button variant="ghost" size="sm" onClick={handleClose} className={selected ? 'flex-1' : 'w-full'}>
            Cancel
          </Button>
          {selected && (
            <Button
              variant="cinema"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleSend}
              disabled={sending || sent}
            >
              {sent ? (
                <><Check className="h-4 w-4" /> Sent!</>
              ) : sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Send className="h-4 w-4" /> Send</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
