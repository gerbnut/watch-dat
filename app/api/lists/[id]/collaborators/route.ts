import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const list = await prisma.list.findUnique({
    where: { id },
    select: {
      userId: true,
      collaborators: {
        include: { list: { select: { id: true, username: true, displayName: true, avatar: true } } },
      },
    },
  })
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const collaborators = list.collaborators.map((c) => c.list)
  return NextResponse.json({ collaborators })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } })
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { username } = await req.json()
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.id === session.user.id) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })

  await prisma.listCollaborator.upsert({
    where: { listId_userId: { listId: id, userId: user.id } },
    create: { listId: id, userId: user.id },
    update: {},
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } })
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (list.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await req.json()
  await prisma.listCollaborator.deleteMany({ where: { listId: id, userId } })

  return NextResponse.json({ success: true })
}
