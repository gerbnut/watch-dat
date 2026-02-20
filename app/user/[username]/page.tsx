import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { formatDate, getInitials, formatRating } from '@/lib/utils'
import { BarChart2, Calendar, Film } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { MovieCard } from '@/components/movies/MovieCard'
import { ListCard } from '@/components/lists/ListCard'
import { ActivityFeedItem } from '@/components/feed/ActivityFeedItem'
import { FollowButtonClient } from './FollowButtonClient'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { displayName: true, username: true },
  })
  if (!user) return { title: 'User Not Found' }
  return { title: `${user.displayName} (@${user.username})` }
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    include: {
      _count: {
        select: {
          reviews: true,
          following: true,
          followers: true,
          diaryEntries: true,
          lists: { where: { isPublic: true } },
        },
      },
      favoriteMovies: {
        include: { movie: true },
        orderBy: { order: 'asc' },
        take: 5,
      },
    },
  })

  if (!user) notFound()

  const isOwnProfile = session?.user?.id === user.id
  const isFollowing = session?.user?.id && !isOwnProfile
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
      }))
    : false

  const [recentReviews, recentLists, recentActivities] = await Promise.all([
    prisma.review.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.list.findMany({
      where: { userId: user.id, ...(isOwnProfile ? {} : { isPublic: true }) },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        items: {
          include: { movie: { select: { poster: true, title: true } } },
          orderBy: { order: 'asc' },
          take: 4,
        },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.activity.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: { select: { id: true, tmdbId: true, title: true, poster: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
  ])

  const avgRating = await prisma.review.aggregate({
    where: { userId: user.id, rating: { not: null } },
    _avg: { rating: true },
  })

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Cover gradient */}
        <div className="h-24 bg-gradient-to-br from-cinema-900 via-film-900 to-cinema-950" />

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback className="text-2xl bg-cinema-900 text-cinema-300">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-2 pb-1">
              {isOwnProfile ? (
                <Link href="/settings">
                  <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                    Edit profile
                  </button>
                </Link>
              ) : session?.user && (
                <FollowButtonClient
                  username={user.username}
                  isFollowing={isFollowing}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <h1 className="text-xl font-bold">{user.displayName}</h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            {user.bio && (
              <p className="text-sm leading-relaxed max-w-lg">{user.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm pt-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {formatDate(user.joinDate, 'MMMM yyyy')}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { label: 'Films', value: user._count.diaryEntries, href: `/user/${user.username}/diary` },
                { label: 'Reviews', value: user._count.reviews, href: `/user/${user.username}` },
                { label: 'Lists', value: user._count.lists, href: `/user/${user.username}/lists` },
                { label: 'Following', value: user._count.following, href: `/user/${user.username}/following` },
                { label: 'Followers', value: user._count.followers, href: `/user/${user.username}/followers` },
              ].map(({ label, value, href }) => (
                <Link key={label} href={href} className="text-center hover:text-cinema-400 transition-colors">
                  <span className="block text-lg font-bold">{value.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </Link>
              ))}
              {avgRating._avg.rating && (
                <div className="text-center">
                  <span className="block text-lg font-bold text-cinema-400">
                    ★ {formatRating(avgRating._avg.rating)}
                  </span>
                  <span className="text-xs text-muted-foreground">Avg rating</span>
                </div>
              )}
              <Link href={`/user/${user.username}/stats`} className="text-center hover:text-cinema-400 transition-colors">
                <BarChart2 className="h-5 w-5 mx-auto mb-0.5" />
                <span className="text-xs text-muted-foreground">Stats</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Favorite films */}
      {user.favoriteMovies.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Favorite films</h2>
          <div className="flex gap-3">
            {user.favoriteMovies.map(({ movie }) => (
              <MovieCard
                key={movie.id}
                tmdbId={movie.tmdbId}
                title={movie.title}
                poster={movie.poster}
                releaseDate={movie.releaseDate}
                size="md"
                className="shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="activity">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="diary">Diary</TabsTrigger>
          <TabsTrigger value="lists">Lists</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          {recentActivities.length > 0 ? (
            <div className="rounded-xl border bg-card divide-y divide-border">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="px-4">
                  <ActivityFeedItem activity={activity as any} currentUserId={session?.user?.id} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">No activity yet.</p>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-3">
          {recentReviews.length > 0 ? (
            <>
              {recentReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review as any}
                  showMovie
                  currentUserId={session?.user?.id}
                />
              ))}
              <Link
                href={`/user/${user.username}/reviews`}
                className="block text-center text-sm text-cinema-400 hover:underline py-2"
              >
                View all reviews →
              </Link>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">No reviews yet.</p>
          )}
        </TabsContent>

        <TabsContent value="diary" className="mt-4">
          <Link href={`/user/${user.username}/diary`}>
            <div className="rounded-lg border bg-card p-6 text-center hover:bg-accent/50 transition-colors">
              <Film className="h-8 w-8 mx-auto mb-2 text-cinema-400" />
              <p className="font-medium">{user._count.diaryEntries} films watched</p>
              <p className="text-sm text-muted-foreground mt-1">View full diary →</p>
            </div>
          </Link>
        </TabsContent>

        <TabsContent value="lists" className="mt-4">
          {recentLists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentLists.map((list) => (
                <ListCard
                  key={list.id}
                  id={list.id}
                  name={list.name}
                  description={list.description}
                  isPublic={list.isPublic}
                  updatedAt={list.updatedAt}
                  user={list.user}
                  items={list.items}
                  itemCount={list._count.items}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">No lists yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
