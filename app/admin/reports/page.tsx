import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import { ShieldAlert } from 'lucide-react'
import { ReportsClient } from './ReportsClient'

export const metadata: Metadata = { title: 'Admin — Reports' }

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminReportsPage() {
  const session = await auth()
  if (!session?.user?.email || !isAdmin(session.user.email)) redirect('/')

  const reports = await prisma.report.findMany({
    where: { resolved: false },
    include: {
      reporter: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-destructive" />
        <div>
          <h1 className="text-xl font-bold">Content Reports</h1>
          <p className="text-sm text-muted-foreground">{reports.length} pending</p>
        </div>
      </div>

      <ReportsClient initialReports={reports as any} />
    </div>
  )
}
