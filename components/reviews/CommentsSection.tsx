'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

interface Comment {
  id: string
  text: string
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatar: string | null
  }
}

interface CommentsSectionProps {
  reviewId: string
  initialCount: number
  currentUserId?: string
  defaultExpanded?: boolean
}

export function CommentsSection({
  reviewId,
  initialCount,
  currentUserId,
  defaultExpanded = false,
}: CommentsSectionProps) {
  const [open, setOpen] = useState(defaultExpanded)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (open && !loaded) {
      fetchComments()
    }
  }, [open])

  async function fetchComments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`)
      const data = await res.json()
      setComments(Array.isArray(data) ? data : [])
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments((prev) => [...prev, comment])
        setCount((c) => c + 1)
        setText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 text-sm transition-colors',
          open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <MessageSquare className="h-4 w-4" />
        <span>{count}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 && !currentUserId ? (
            <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5 animate-fade-in">
                  <Link href={`/user/${comment.user.username}`} className="shrink-0">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={comment.user.avatar ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-cinema-900 text-cinema-300">
                        {getInitials(comment.user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <Link href={`/user/${comment.user.username}`} className="text-xs font-semibold hover:underline">
                        {comment.user.displayName}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(new Date(comment.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentUserId && (
            <form onSubmit={submitComment} className="flex items-end gap-2 pt-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submitComment(e as any)
                  }
                }}
                placeholder="Add a comment…"
                rows={1}
                className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cinema-500 hover:bg-cinema-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
