import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import { ListCard } from '@/components/lists/ListCard'
import { CreateListButtonClient } from './CreateListButtonClient'
import { List, Lock, Globe } from 'lucide-react'

export const metadata: Metadata = { title: 'My Lists' }

export default async function ListsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const lists = await prisma.list.findMany({
    where: { userId: session.user.id },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Lists</h1>
          <p className="text-muted-foreground text-sm mt-1">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
        </div>
        <CreateListButtonClient />
      </div>

      {lists.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <List className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-medium">No lists yet</p>
          <p className="text-sm text-muted-foreground">Create a list to organize your favorite films</p>
          <CreateListButtonClient variant="cinema" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
