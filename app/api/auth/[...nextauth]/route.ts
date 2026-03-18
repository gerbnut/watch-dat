export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { handlers } from '@/auth'
import { NextRequest } from 'next/server'

export const GET = async (req: NextRequest) => {
  try {
    console.log('[auth route] GET', req.url)
    const res = await handlers.GET(req)
    console.log('[auth route] GET response status:', res.status, 'location:', res.headers.get('location'))
    return res
  } catch (err) {
    console.error('[auth route] GET CAUGHT ERROR:', err)
    throw err
  }
}

export const POST = async (req: NextRequest) => {
  try {
    console.log('[auth route] POST', req.url)
    const res = await handlers.POST(req)
    console.log('[auth route] POST response status:', res.status)
    return res
  } catch (err) {
    console.error('[auth route] POST CAUGHT ERROR:', err)
    throw err
  }
}
