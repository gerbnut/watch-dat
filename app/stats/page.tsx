import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatsTab } from '@/components/profile/StatsTab'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { BarChart3, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Stats',
}

export default async function StatsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      _count: { select: { diaryEntries: true } },
      favoriteMovies: {
        include: { movie: { select: { poster: true } } },
        orderBy: { order: 'asc' },
        take: 5,
      },
    },
  })

  if (!user?.username) redirect('/login')

  const favoritePosterUrls = user.favoriteMovies
    .map((fm) => fm.movie.poster)
    .filter((p): p is string => !!p)
    .map((p) => TMDB_IMAGE.poster(p, 'w154'))
    .filter((url): url is string => !!url)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cinema-400" />
          <h1 className="text-2xl font-bold">Stats</h1>
        </div>
        <Link
          href={`/user/${user.username}/stats`}
          className="flex items-center gap-1 text-sm text-cinema-400 hover:underline"
        >
          Detailed charts <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <StatsTab
        username={user.username}
        wrappedEligible={user._count.diaryEntries >= 10}
        isOwnProfile={true}
        favoritePosterUrls={favoritePosterUrls}
      />
    </div>
  )
}
