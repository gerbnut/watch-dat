import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { ReviewCard } from '@/components/reviews/ReviewCard'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return { title: `Reviews · @${params.username}` }
}

export default async function UserReviewsPage({ params }: { params: { username: string } }) {
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true, username: true, displayName: true },
  })
  if (!user) notFound()

  const [reviews, likedData] = await Promise.all([
    prisma.review.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
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
          href={`/user/${user.username}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">{reviews.length}</span>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={{ ...review, isLiked: likedSet.has(review.id) } as any}
              showMovie
              currentUserId={session?.user?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
