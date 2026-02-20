'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { cn, getInitials, formatRelativeTime } from '@/lib/utils'

interface ListCardProps {
  id: string
  name: string
  description?: string | null
  isPublic: boolean
  updatedAt: Date | string
  user: {
    username: string
    displayName: string
    avatar?: string | null
  }
  items: Array<{
    movie: {
      poster: string | null
      title: string
    }
  }>
  itemCount: number
  className?: string
}

export function ListCard({ id, name, description, isPublic, updatedAt, user, items, itemCount, className }: ListCardProps) {
  const previewPosters = items.slice(0, 4)

  return (
    <Link href={`/list/${id}`}>
      <div className={cn('group rounded-lg border bg-card hover:bg-card/80 transition-colors overflow-hidden', className)}>
        {/* Poster strip */}
        <div className="flex h-28 bg-muted">
          {previewPosters.length > 0 ? (
            previewPosters.map((item, i) => (
              <div key={i} className="relative flex-1 overflow-hidden">
                {item.movie.poster ? (
                  <Image
                    src={TMDB_IMAGE.poster(item.movie.poster, 'w185')!}
                    alt={item.movie.title}
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    sizes="100px"
                  />
                ) : (
                  <div className="h-full bg-muted/50" />
                )}
              </div>
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30 text-sm">
              No films yet
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1 group-hover:text-cinema-400 transition-colors">
              {name}
            </h3>
            {!isPublic && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback className="text-[9px]">{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{user.displayName}</span>
            </div>
            <span className="text-xs text-muted-foreground">{itemCount} film{itemCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
