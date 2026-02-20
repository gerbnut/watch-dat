import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { TMDB_IMAGE } from '@/lib/tmdb'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const review = await prisma.review.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { displayName: true } },
      movie: { select: { title: true } },
    },
  })
  if (!review) return { title: 'Review' }
  return { title: `${review.user.displayName}'s review of ${review.movie.title}` }
}

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  const review = await prisma.review.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      movie: { select: { id: true, tmdbId: true, title: true, poster: true, backdrop: true, releaseDate: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  if (!review) notFound()

  const isLiked = session?.user?.id
    ? !!(await prisma.like.findUnique({
        where: { userId_reviewId: { userId: session.user.id, reviewId: review.id } },
      }))
    : false

  const backdropUrl = TMDB_IMAGE.backdrop((review.movie as any).backdrop ?? null, 'w1280')

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back link with movie context */}
      <div className="flex items-center gap-3">
        <Link
          href={`/film/${review.movie.tmdbId}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {review.movie.poster && (
          <Link href={`/film/${review.movie.tmdbId}`} className="shrink-0">
            <div className="relative h-12 w-8 overflow-hidden rounded shadow-md">
              <Image
                src={TMDB_IMAGE.poster(review.movie.poster, 'w185')!}
                alt={review.movie.title}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          </Link>
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Review of</p>
          <Link href={`/film/${review.movie.tmdbId}`} className="font-semibold hover:underline truncate block">
            {review.movie.title}
          </Link>
        </div>
      </div>

      {/* Review card with comments auto-expanded */}
      <ReviewCard
        review={{ ...review, isLiked } as any}
        showMovie={false}
        currentUserId={session?.user?.id}
        expandComments
      />
    </div>
  )
}
