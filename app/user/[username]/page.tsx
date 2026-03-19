import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { formatDate, getInitials, formatRating } from '@/lib/utils'
import { Calendar, Film } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { MovieCard } from '@/components/movies/MovieCard'
import { ListCard } from '@/components/lists/ListCard'
import { ActivityFeedItem } from '@/components/feed/ActivityFeedItem'
import { FollowButtonClient } from './FollowButtonClient'
import { BlockButtonClient } from './BlockButtonClient'
import { BannerSection } from './BannerSection'
import { ShareButton } from '@/components/ui/ShareButton'
import { ReportButton } from '@/components/ui/ReportButton'
import { RankedFilmsTab } from '@/components/profile/RankedFilmsTab'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      displayName: true,
      username: true,
      bio: true,
      _count: { select: { reviews: true, diaryEntries: true } },
    },
  })
  if (!user) return { title: 'User Not Found' }
  const pageTitle = `${user.displayName} (@${user.username})`
  const description =
    user.bio ??
    `${user.displayName} has logged ${user._count.diaryEntries} film${user._count.diaryEntries === 1 ? '' : 's'} and written ${user._count.reviews} review${user._count.reviews === 1 ? '' : 's'} on Watch Dat.`
  return {
    title: pageTitle,
    description,
    openGraph: {
      title: `${pageTitle} — Watch Dat`,
      description,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${pageTitle} — Watch Dat`,
      description,
    },
  }
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await auth()
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
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
    ? prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
      }).then((r) => !!r)
    : false
  const isBlocked = session?.user?.id && !isOwnProfile
    ? prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: user.id } },
      }).then((r) => !!r)
    : false
  const [resolvedFollowing, resolvedBlocked] = await Promise.all([isFollowing, isBlocked])

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

  const stats = [
    { label: 'Films', value: user._count.diaryEntries, href: `/user/${user.username}/diary` },
    { label: 'Reviews', value: user._count.reviews, href: `/user/${user.username}/reviews` },
    { label: 'Lists', value: user._count.lists, href: `/user/${user.username}/lists` },
    { label: 'Followers', value: user._count.followers, href: `/user/${user.username}/followers` },
    { label: 'Following', value: user._count.following, href: `/user/${user.username}/following` },
  ]

  return (
    <div className="-mt-6">
      {/* ── Banner ── */}
      <div className="relative -mx-4">
        <BannerSection
          bannerUrl={(user as any).bannerUrl ?? null}
          isOwnProfile={isOwnProfile}
          username={user.username ?? ''}
        />
      </div>

      {/* ── Avatar + Info ── */}
      <div className="relative -mt-12 sm:-mt-16 z-10">
        <div className="flex items-end justify-between gap-3">
          {/* Avatar */}
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-background shadow-[0_8px_25px_-8px_rgba(0,0,0,0.4)] ml-4 sm:ml-6 shrink-0">
            <AvatarImage src={user.avatar ?? undefined} />
            <AvatarFallback className="text-2xl sm:text-3xl bg-cinema-900 text-cinema-300 ring-1 ring-white/[0.06]">
              {getInitials(user.displayName ?? '')}
            </AvatarFallback>
          </Avatar>

          {/* Action buttons — top-right of profile area */}
          <div className="flex items-center gap-2 pb-1 mr-1 shrink-0">
            {isOwnProfile ? (
              <>
                <ShareButton
                  url={`/user/${user.username}`}
                  title={`${user.displayName} on Watch Dat`}
                  text={user.bio ?? `Check out ${user.displayName}'s film diary on Watch Dat`}
                />
                <Link href="/settings">
                  <button className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm font-medium hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors">
                    Edit profile
                  </button>
                </Link>
              </>
            ) : session?.user ? (
              <>
                <FollowButtonClient
                  username={user.username ?? ''}
                  isFollowing={!!resolvedFollowing}
                />
                <div className="flex items-center gap-1">
                  <ShareButton
                    url={`/user/${user.username}`}
                    title={`${user.displayName} on Watch Dat`}
                    text={user.bio ?? `Check out ${user.displayName}'s film diary on Watch Dat`}
                  />
                  <BlockButtonClient username={user.username ?? ''} isBlocked={!!resolvedBlocked} />
                  <ReportButton targetType="USER" targetId={user.id} targetLabel={user.displayName ?? ''} />
                </div>
              </>
            ) : (
              <ShareButton
                url={`/user/${user.username}`}
                title={`${user.displayName} on Watch Dat`}
                text={user.bio ?? `Check out ${user.displayName}'s film diary on Watch Dat`}
              />
            )}
          </div>
        </div>

        {/* Name + bio */}
        <div className="mt-3 px-1 space-y-1.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user.displayName}</h1>
            <p className="text-sm text-muted-foreground/70">@{user.username}</p>
          </div>

          {user.bio && (
            <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-md line-clamp-3">{user.bio}</p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <Calendar className="h-3 w-3" />
            <span>Joined {formatDate(user.joinDate, 'MMMM yyyy')}</span>
          </div>
        </div>
      </div>

      {/* ── Stats Pills ── */}
      <div className="flex items-center gap-3 sm:gap-4 py-4 mt-2 overflow-x-auto scrollbar-hide">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center px-3 sm:px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.03] min-w-fit hover:bg-white/[0.04] transition-colors"
          >
            <span className="text-lg sm:text-xl font-bold tracking-tight tabular-nums">{value.toLocaleString()}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-wider">{label}</span>
          </Link>
        ))}
        {avgRating._avg.rating && (
          <div className="flex flex-col items-center px-3 sm:px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.03] min-w-fit">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-cinema-400 tabular-nums">
              ★ {formatRating(avgRating._avg.rating)}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-wider">Avg</span>
          </div>
        )}
      </div>

      {/* ── Favorite Films ── */}
      {user.favoriteMovies.length > 0 && (
        <div className="mt-2 mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground/40 mb-2">Favorites</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {user.favoriteMovies.map(({ movie }) => (
              <MovieCard
                key={movie.id}
                tmdbId={movie.tmdbId}
                title={movie.title}
                poster={movie.poster}
                releaseDate={movie.releaseDate}
                size="xs"
                showYear={false}
                className="shrink-0 snap-start !w-16 sm:!w-20"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <Tabs defaultValue="ranked">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto scrollbar-hide bg-transparent rounded-none border-b border-white/[0.04] p-0 pb-px h-auto">
          <TabsTrigger value="ranked" className="rounded-none rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.02] data-[state=active]:bg-white/[0.04] data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cinema-400 data-[state=active]:-mb-px transition-all duration-200">
            Ranked
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.02] data-[state=active]:bg-white/[0.04] data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cinema-400 data-[state=active]:-mb-px transition-all duration-200">
            Activity
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-none rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.02] data-[state=active]:bg-white/[0.04] data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cinema-400 data-[state=active]:-mb-px transition-all duration-200">
            Reviews
          </TabsTrigger>
          <TabsTrigger value="diary" className="rounded-none rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.02] data-[state=active]:bg-white/[0.04] data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cinema-400 data-[state=active]:-mb-px transition-all duration-200">
            Diary
          </TabsTrigger>
          <TabsTrigger value="lists" className="rounded-none rounded-t-lg px-4 py-2.5 text-sm font-medium text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.02] data-[state=active]:bg-white/[0.04] data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cinema-400 data-[state=active]:-mb-px transition-all duration-200">
            Lists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranked" className="mt-4">
          <RankedFilmsTab username={user.username ?? ''} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id}>
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
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 text-center hover:bg-white/[0.03] transition-colors">
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
