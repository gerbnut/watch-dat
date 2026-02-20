import { auth } from '@/auth'
import { getOrCacheMovie } from '@/lib/tmdb'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { ReviewCard } from '@/components/reviews/ReviewCard'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tmdbId = Number(params.id)
  if (isNaN(tmdbId)) return { title: 'Reviews' }
  try {
    const movie = await getOrCacheMovie(tmdbId)
    return { title: `Reviews · ${movie.title}` }
  } catch {
    return { title: 'Reviews' }
  }
}

export default async function FilmReviewsPage({ params }: { params: { id: string } }) {
  const tmdbId = Number(params.id)
  if (isNaN(tmdbId)) notFound()

  const session = await auth()

  let movie: any
  try {
    movie = await getOrCacheMovie(tmdbId)
  } catch {
    notFound()
  }

  const [reviews, likedData] = await Promise.all([
    prisma.review.findMany({
      where: { movieId: movie.id, text: { not: null } },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    session?.user?.id
      ? prisma.like.findMany({
          where: { userId: session.user.id },
          select: { reviewId: true },
        })
      : [],
  ])

  const likedSet = new Set(likedData.map((l) => l.reviewId))

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/film/${tmdbId}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">{movie.title}</p>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">{reviews.length}</span>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm text-muted-foreground">Be the first to review this film</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={{ ...review, isLiked: likedSet.has(review.id) } as any}
              currentUserId={session?.user?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
