export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // All relations have onDelete: Cascade — deleting the user row cascades everything
    await prisma.user.delete({ where: { id: session.user.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Account deletion error:', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
