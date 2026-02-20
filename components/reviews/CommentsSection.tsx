'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Send, Loader2, Trash2, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getInitials, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommentUser {
  id: string
  username: string
  displayName: string
  avatar: string | null
}

interface FlatComment {
  id: string
  text: string
  parentId: string | null
  deleted: boolean
  createdAt: string
  user: CommentUser
}

interface Comment extends FlatComment {
  replies: Comment[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTree(flat: FlatComment[]): Comment[] {
  const map = new Map<string, Comment>(flat.map((c) => [c.id, { ...c, replies: [] }]))
  const roots: Comment[] = []
  for (const c of flat) {
    const node = map.get(c.id)!
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

/** Render text with @mention links highlighted in cinema green. */
function renderText(text: string) {
  const parts = text.split(/(@\w+)/g)
  return parts.map((part, i) => {
    if (/^@\w+$/.test(part)) {
      return (
        <Link key={i} href={`/user/${part.slice(1)}`} className="text-cinema-400 font-medium hover:underline">
          {part}
        </Link>
      )
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

// ─── CommentInput ─────────────────────────────────────────────────────────────

interface CommentInputProps {
  onSubmit: (text: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
  compact?: boolean
}

function CommentInput({ onSubmit, placeholder = 'Add a comment…', autoFocus, compact }: CommentInputProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<any[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length === 0) {
      setMentionResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`)
        const data = await res.json()
        setMentionResults(Array.isArray(data) ? data.slice(0, 5) : [])
      } catch {
        setMentionResults([])
      }
    }, 200)
    return () => clearTimeout(t)
  }, [mentionQuery])

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    if (val.length > 500) return
    setText(val)
    const cursor = e.target.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const match = before.match(/@(\w*)$/)
    setMentionQuery(match ? match[1] : null)
    if (!match) setMentionResults([])
  }

  function selectMention(username: string) {
    const cursor = textareaRef.current?.selectionStart ?? text.length
    const before = text.slice(0, cursor).replace(/@\w*$/, `@${username} `)
    const after = text.slice(cursor)
    setText(before + after)
    setMentionQuery(null)
    setMentionResults([])
    textareaRef.current?.focus()
  }

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || submitting || text.length > 500) return
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
      setText('')
      setMentionQuery(null)
      setMentionResults([])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      {/* @mention dropdown */}
      {mentionResults.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg">
          {mentionResults.map((u: any) => (
            <button
              key={u.id}
              type="button"
              onClick={() => selectMention(u.username)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
            >
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarFallback className="text-[9px]">{getInitials(u.displayName)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-cinema-400">@{u.username}</span>
              <span className="text-muted-foreground truncate">{u.displayName}</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && mentionResults.length === 0) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={placeholder}
          rows={compact ? 1 : 2}
          autoFocus={autoFocus}
          className={cn(
            'flex-1 min-h-[44px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          )}
        />
        <div className="flex flex-col items-end gap-1 shrink-0">
          {text.length > 0 && (
            <span className={cn('text-[10px]', text.length > 450 ? 'text-amber-400' : 'text-muted-foreground')}>
              {text.length}/500
            </span>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !text.trim() || text.length > 500}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-md bg-cinema-500 hover:bg-cinema-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: Comment
  reviewId: string
  currentUserId?: string
  depth?: number
  onReply: (parentId: string, text: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

function CommentItem({ comment, reviewId, currentUserId, depth = 0, onReply, onDelete }: CommentItemProps) {
  const [replying, setReplying] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isOwn = currentUserId === comment.user.id
  const hasReplies = comment.replies.length > 0

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      await onDelete(comment.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={cn('flex gap-2 animate-fade-in', depth > 0 && 'border-l-2 border-cinema-500/30 pl-3')}>
      {!comment.deleted && (
        <Link href={`/user/${comment.user.username}`} className="shrink-0 mt-0.5">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-cinema-900 text-cinema-300">
              {getInitials(comment.user.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
      )}
      <div className={cn('flex-1 min-w-0', comment.deleted && 'pl-8')}>
        {comment.deleted ? (
          <p className="text-xs text-muted-foreground italic">[deleted]</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2 flex-wrap">
              <Link href={`/user/${comment.user.username}`} className="text-xs font-semibold hover:underline">
                {comment.user.displayName}
              </Link>
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(new Date(comment.createdAt))}
              </span>
            </div>
            <p className="text-sm mt-0.5 leading-relaxed break-words">{renderText(comment.text)}</p>

            <div className="flex items-center gap-3 mt-1">
              {currentUserId && depth < 4 && (
                <button
                  onClick={() => setReplying(!replying)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-cinema-400 transition-colors"
                >
                  <CornerDownRight className="h-3 w-3" />
                  Reply
                </button>
              )}
              {isOwn && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </button>
              )}
            </div>
          </>
        )}

        {/* Inline reply input */}
        {replying && (
          <div className="mt-2">
            <CommentInput
              placeholder={`Reply to @${comment.user.username}…`}
              autoFocus
              compact
              onSubmit={async (text) => {
                await onReply(comment.id, text)
                setReplying(false)
                setShowReplies(true)
              }}
            />
          </div>
        )}

        {/* Replies */}
        {hasReplies && (
          <div className="mt-2 space-y-2">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-[11px] text-cinema-400 hover:text-cinema-300 transition-colors"
            >
              {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showReplies ? 'Hide' : `View ${comment.replies.length}`} repl{comment.replies.length === 1 ? 'y' : 'ies'}
            </button>
            {showReplies && (
              <div className="space-y-2">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    reviewId={reviewId}
                    currentUserId={currentUserId}
                    depth={depth + 1}
                    onReply={onReply}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CommentsSection ──────────────────────────────────────────────────────────

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
  const [flat, setFlat] = useState<FlatComment[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (open && !loaded) {
      fetchComments()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchComments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`)
      const data = await res.json()
      setFlat(Array.isArray(data) ? data : [])
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const tree = buildTree(flat)
  const topLevel = tree.filter((c) => !c.parentId || !flat.find((f) => f.id === c.parentId))
  const visibleTopLevel = showAll ? topLevel : topLevel.slice(-2)
  const hiddenCount = topLevel.length - visibleTopLevel.length

  const submitComment = useCallback(async (text: string) => {
    const res = await fetch(`/api/reviews/${reviewId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('Failed to post comment')
    const comment = await res.json()
    setFlat((prev) => [...prev, { ...comment, deleted: false }])
    setCount((c) => c + 1)
  }, [reviewId])

  const submitReply = useCallback(async (parentId: string, text: string) => {
    const res = await fetch(`/api/reviews/${reviewId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, parentId }),
    })
    if (!res.ok) throw new Error('Failed to post reply')
    const comment = await res.json()
    setFlat((prev) => [...prev, { ...comment, deleted: false }])
    setCount((c) => c + 1)
  }, [reviewId])

  const deleteComment = useCallback(async (commentId: string) => {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete')
    const data = await res.json()
    if (data.softDelete) {
      // Mark as deleted in local state (thread preserved)
      setFlat((prev) => prev.map((c) => c.id === commentId ? { ...c, deleted: true, text: '' } : c))
    } else {
      // Hard delete: remove entirely
      setFlat((prev) => prev.filter((c) => c.id !== commentId))
    }
    setCount((c) => Math.max(0, c - 1))
  }, [])

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 text-sm transition-colors',
          open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <MessageSquare className="h-4 w-4" />
        {count > 0 && <span>{count}</span>}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Show all / show less toggle */}
              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs text-cinema-400 hover:text-cinema-300 transition-colors"
                >
                  View all {topLevel.length} comments
                </button>
              )}
              {showAll && topLevel.length > 2 && (
                <button
                  onClick={() => setShowAll(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Show less
                </button>
              )}

              {/* Comment list */}
              <div className="space-y-3 group">
                {visibleTopLevel.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    reviewId={reviewId}
                    currentUserId={currentUserId}
                    onReply={submitReply}
                    onDelete={deleteComment}
                  />
                ))}
              </div>

              {flat.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  {currentUserId ? 'Be the first to comment.' : 'No comments yet.'}
                </p>
              )}
            </>
          )}

          {/* Input or sign-in prompt */}
          {currentUserId ? (
            <CommentInput onSubmit={submitComment} />
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              <Link href="/login" className="text-cinema-400 hover:underline">Sign in</Link> to join the conversation
            </p>
          )}
        </div>
      )}
    </div>
  )
}
