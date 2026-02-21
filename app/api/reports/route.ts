export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  targetType: z.enum(['USER', 'REVIEW', 'COMMENT']),
  targetId: z.string().min(1),
  reason: z.enum(['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'INAPPROPRIATE_CONTENT', 'OTHER']),
  details: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { targetType, targetId, reason, details } = parsed.data

  try {
    await prisma.report.upsert({
      where: {
        reporterId_targetType_targetId: {
          reporterId: session.user.id,
          targetType,
          targetId,
        },
      },
      create: {
        reporterId: session.user.id,
        targetType,
        targetId,
        reason,
        details: details?.trim() || null,
      },
      update: {
        reason,
        details: details?.trim() || null,
        resolved: false,
      },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}
