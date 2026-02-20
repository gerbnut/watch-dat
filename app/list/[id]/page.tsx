import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { formatDate, getInitials, getYearFromDate } from '@/lib/utils'
import { Globe, Lock, Film } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AddToListClient } from './AddToListClient'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const list = await prisma.list.findUnique({ where: { id: params.id }, select: { name: true } })
  return { title: list?.name ?? 'List' }
}

export default async function ListDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  const list = await prisma.list.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      items: {
        include: {
          movie: {
            select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true, directors: true, genres: true },
          },
        },
        orderBy: { order: 'asc' },
      },
      _count: { select: { items: true } },
    },
  })

  if (!list) notFound()

  const isOwner = session?.user?.id === list.user.id
  if (!list.isPublic && !isOwner) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {list.isPublic ? (
                <Globe className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <Badge variant="outline" className="text-xs">{list.isPublic ? 'Public' : 'Private'}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{list.name}</h1>
            {list.description && (
              <p className="text-muted-foreground leading-relaxed">{list.description}</p>
            )}
          </div>
          {isOwner && <AddToListClient listId={list.id} />}
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/user/${list.user.username}`} className="flex items-center gap-2 hover:opacity-80">
            <Avatar className="h-7 w-7">
              <AvatarImage src={list.user.avatar ?? undefined} />
              <AvatarFallback className="text-xs">{getInitials(list.user.displayName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{list.user.displayName}</span>
          </Link>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-sm text-muted-foreground">{list._count.items} film{list._count.items !== 1 ? 's' : ''}</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-sm text-muted-foreground">Updated {formatDate(list.updatedAt)}</span>
        </div>
      </div>

      {/* Film grid */}
      {list.items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <Film className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium">This list is empty</p>
          {isOwner && <p className="text-sm text-muted-foreground">Add some films to get started</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {list.items.map((item, i) => {
            const posterUrl = TMDB_IMAGE.poster(item.movie.poster, 'w185')
            const directors = (item.movie.directors as any[]) ?? []
            const genres = (item.movie.genres as any[]) ?? []

            return (
              <div key={item.id} className="flex items-center gap-4 rounded-lg border bg-card p-3 hover:bg-accent/30 transition-colors">
                <span className="text-muted-foreground text-sm w-6 text-right shrink-0">{i + 1}</span>

                <Link href={`/film/${item.movie.tmdbId}`}>
                  <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded">
                    {posterUrl ? (
                      <Image src={posterUrl} alt={item.movie.title} fill className="object-cover" sizes="44px" />
                    ) : (
                      <div className="h-full bg-muted rounded" />
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/film/${item.movie.tmdbId}`} className="font-semibold hover:underline line-clamp-1">
                    {item.movie.title}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    {getYearFromDate(item.movie.releaseDate) && <span>{getYearFromDate(item.movie.releaseDate)}</span>}
                    {directors[0] && <span>· {directors[0].name}</span>}
                    {genres.slice(0, 2).map((g: any) => (
                      <span key={g.id} className="text-muted-foreground/60">{g.name}</span>
                    ))}
                  </div>
                  {item.note && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">"{item.note}"</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
