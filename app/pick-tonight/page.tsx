import { auth } from '@/auth'
import { Metadata } from 'next'
import { PickTonightClient } from './PickTonightClient'

export const metadata: Metadata = { title: 'Pick Tonight' }

export default async function PickTonightPage() {
  const session = await auth()
  return <PickTonightClient currentUserId={session?.user?.id ?? null} />
}
