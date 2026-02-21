export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rateLimit'

const ALLOWED_FIELDS = ['avatar', 'bannerUrl'] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed, headers } = rateLimit({
    key: `user:${session.user.id}:upload`,
    limit: 10,
    windowSec: 600, // 10 uploads per 10 minutes per user
  })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many uploads. Please wait.' }, { status: 429, headers })
  }

  // Determine which DB field to write — defaults to 'avatar' for backward compat
  const rawField = new URL(req.url).searchParams.get('field') ?? 'avatar'
  const field: AllowedField = (ALLOWED_FIELDS as readonly string[]).includes(rawField)
    ? (rawField as AllowedField)
    : 'avatar'

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err) {
    console.error('Upload: failed to parse form data', err)
    return NextResponse.json({ error: 'Could not read file — check body size' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })

  try {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type.startsWith('image/') ? file.type : 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Write ONLY to the specified field — never touch the other
    await prisma.user.update({
      where: { id: session.user.id },
      data: { [field]: dataUrl },
    })

    return NextResponse.json({ url: dataUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to save image' }, { status: 500 })
  }
}
