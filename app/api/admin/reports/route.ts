export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

// GET  — list reports (optionally ?resolved=true)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const resolved = req.nextUrl.searchParams.get('resolved') === 'true'

  const reports = await prisma.report.findMany({
    where: { resolved },
    include: {
      reporter: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(reports)
}

// PATCH — resolve or dismiss a report
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { reportId, action } = await req.json()
  if (!reportId || !['resolve', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Both resolve and dismiss set resolved=true; "dismiss" could also delete the target
  await prisma.report.update({
    where: { id: reportId },
    data: { resolved: true },
  })

  // If action is "remove", delete the target content
  if (action === 'remove') {
    const report = await prisma.report.findUnique({ where: { id: reportId } })
    if (report) {
      if (report.targetType === 'REVIEW') {
        await prisma.review.deleteMany({ where: { id: report.targetId } }).catch(() => {})
      } else if (report.targetType === 'COMMENT') {
        await prisma.comment.updateMany({
          where: { id: report.targetId },
          data: { deleted: true, text: null },
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
