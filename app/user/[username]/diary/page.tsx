import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CalendarDays, RefreshCw } from 'lucide-react'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { formatDate } from '@/lib/utils'
import { StarRating } from '@/components/movies/StarRating'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return { title: `Diary · @${params.username}` }
}

function groupByMonth(entries: any[]) {
  const groups: Record<string, any[]> = {}
  for (const entry of entries) {
    const key = formatDate(entry.watchedDate, 'MMMM yyyy')
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  }
  return groups
}

export default async function UserDiaryPage({ params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true, username: true, displayName: true },
  })
  if (!user) notFound()

  const entries = await prisma.diaryEntry.findMany({
    where: { userId: user.id },
    include: {
      movie: {
        select: {
          id: true,
          tmdbId: true,
          title: true,
          poster: true,
          releaseDate: true,
          genres: true,
        },
      },
    },
    orderBy: { watchedDate: 'desc' },
    take: 200,
  })

  const grouped = groupByMonth(entries)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/user/${user.username}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Film Diary</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          {entries.length} films
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium">No films logged yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, monthEntries]) => (
            <section key={month}>
              <div className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border/50 mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {month}
                  <span className="ml-2 text-xs font-normal">({monthEntries.length})</span>
                </h2>
              </div>

              <div className="space-y-1">
                {monthEntries.map((entry) => {
                  const posterUrl = TMDB_IMAGE.poster(entry.movie.poster, 'w185')
                  const genres = (entry.movie.genres as any[]) ?? []

                  return (
                    <div key={entry.id} className="flex items-center gap-3 rounded-lg hover:bg-accent/30 transition-colors p-2 -mx-2">
                      <div className="w-16 shrink-0 text-right">
                        <p className="text-xs font-medium">{formatDate(entry.watchedDate, 'EEE')}</p>
                        <p className="text-lg font-bold leading-none text-muted-foreground">
                          {formatDate(entry.watchedDate, 'd')}
                        </p>
                      </div>

                      <Link href={`/film/${entry.movie.tmdbId}`}>
                        <div className="relative h-16 w-10 shrink-0 overflow-hidden rounded bg-muted">
                          {posterUrl ? (
                            <Image src={posterUrl} alt={entry.movie.title} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="h-full bg-muted" />
                          )}
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/film/${entry.movie.tmdbId}`} className="font-medium hover:underline line-clamp-1">
                          {entry.movie.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          {entry.movie.releaseDate && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.movie.releaseDate).getFullYear()}
                            </span>
                          )}
                          {genres.slice(0, 2).map((g: any) => (
                            <span key={g.id} className="text-xs text-muted-foreground/60">{g.name}</span>
                          ))}
                          {entry.rewatch && (
                            <span className="flex items-center gap-0.5 text-xs text-blue-400">
                              <RefreshCw className="h-3 w-3" /> rewatch
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {entry.rating ? (
                          <StarRating value={entry.rating} readOnly size="sm" showValue />
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
