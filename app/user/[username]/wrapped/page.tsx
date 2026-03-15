import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getWrappedData } from '@/lib/wrapped'
import { WrappedClient } from '@/components/wrapped/WrappedClient'

const MIN_FILMS = 10

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: `Film Wrapped · @${username}` }
}

export default async function WrappedPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, _count: { select: { diaryEntries: true } } },
  })

  if (!user) notFound()

  if (session?.user?.id !== user.id) {
    redirect(`/user/${user.username}`)
  }

  if (user._count.diaryEntries < MIN_FILMS) {
    redirect(`/user/${user.username}`)
  }

  const data = await getWrappedData(user.id)

  return <WrappedClient data={data} />
}
