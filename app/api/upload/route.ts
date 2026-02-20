export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err) {
    console.error('Upload: failed to parse form data', err)
    return NextResponse.json({ error: 'Could not read file — check body size' }, { status: 400 })
  }

  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  // Client-side compression should keep this well under 2MB
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    // Use image/jpeg since the client-side Canvas always outputs JPEG
    const mimeType = file.type.startsWith('image/') ? file.type : 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Persist directly to the DB — no filesystem required (works on Vercel)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: dataUrl },
    })

    return NextResponse.json({ url: dataUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to save image' }, { status: 500 })
  }
}
