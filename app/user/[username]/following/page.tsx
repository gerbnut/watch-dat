import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { FollowButtonClient } from '../FollowButtonClient'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return { title: `Following · @${params.username}` }
}

export default async function FollowingPage({ params }: { params: { username: string } }) {
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true, username: true, displayName: true },
  })
  if (!user) notFound()

  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: {
      following: {
        select: { id: true, username: true, displayName: true, avatar: true, bio: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const myFollowingIds = session?.user?.id
    ? (
        await prisma.follow.findMany({
          where: {
            followerId: session.user.id,
            followingId: { in: follows.map((f) => f.following.id) },
          },
          select: { followingId: true },
        })
      ).map((f) => f.followingId)
    : []

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/user/${user.username}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Following</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">{follows.length}</span>
      </div>

      {follows.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">Not following anyone yet.</p>
      ) : (
        <div className="space-y-1">
          {follows.map(({ following }) => (
            <div
              key={following.id}
              className="flex items-center justify-between gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors"
            >
              <Link href={`/user/${following.username}`} className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={following.avatar ?? undefined} />
                  <AvatarFallback className="text-sm bg-cinema-900 text-cinema-300">
                    {getInitials(following.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{following.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{following.username}</p>
                  {following.bio && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{following.bio}</p>
                  )}
                </div>
              </Link>
              {session?.user && session.user.id !== following.id && (
                <FollowButtonClient
                  username={following.username}
                  isFollowing={myFollowingIds.includes(following.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
