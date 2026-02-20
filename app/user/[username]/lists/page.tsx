import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, List } from 'lucide-react'
import { ListCard } from '@/components/lists/ListCard'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return { title: `Lists · @${params.username}` }
}

export default async function UserListsPage({ params }: { params: { username: string } }) {
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true, username: true, displayName: true },
  })
  if (!user) notFound()

  const isOwnProfile = session?.user?.id === user.id

  const lists = await prisma.list.findMany({
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
  })

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
          <h1 className="text-xl font-bold">Lists</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">{lists.length}</span>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <List className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium">No lists yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists.map((list) => (
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
      )}
    </div>
  )
}
