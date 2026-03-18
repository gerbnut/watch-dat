import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { validateUsernameFormat, validateDisplayName } from '@/lib/form-validation'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { username, displayName } = await req.json()

  const usernameErr = validateUsernameFormat(username)
  if (usernameErr) {
    return NextResponse.json({ error: usernameErr }, { status: 400 })
  }

  const displayNameErr = validateDisplayName(displayName)
  if (displayNameErr) {
    return NextResponse.json({ error: displayNameErr }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username taken' }, { status: 409 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { username, displayName },
  })

  return NextResponse.json({ success: true })
}
