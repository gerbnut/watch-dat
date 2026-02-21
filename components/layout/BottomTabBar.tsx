'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, Film, Plus, Users, User } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LogFilmModal } from '@/components/reviews/LogFilmModal'

export function BottomTabBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [logOpen, setLogOpen] = useState(false)

  const username = session?.user?.username
  const meHref = username ? `/user/${username}` : '/login'
  const meActive = username
    ? pathname.startsWith(`/user/${username}`) || pathname === '/settings'
    : false

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-sm"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-14 items-center">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              pathname === '/' ? 'text-cinema-400' : 'text-muted-foreground'
            )}
          >
            <Home className="h-5 w-5" />
            Home
          </Link>

          {/* Films */}
          <Link
            href="/films"
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              pathname.startsWith('/films') ? 'text-cinema-400' : 'text-muted-foreground'
            )}
          >
            <Film className="h-5 w-5" />
            Films
          </Link>

          {/* Center Log button */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <button
              onClick={() => {
                if (session?.user) {
                  setLogOpen(true)
                } else {
                  window.location.href = '/login'
                }
              }}
              className="h-12 w-12 rounded-full bg-cinema-500 text-black shadow-lg -mt-3 flex items-center justify-center"
              aria-label="Log film"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {/* Friends */}
          <Link
            href="/friends"
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              pathname.startsWith('/friends') ? 'text-cinema-400' : 'text-muted-foreground'
            )}
          >
            <Users className="h-5 w-5" />
            Friends
          </Link>

          {/* Me */}
          <Link
            href={meHref}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              meActive ? 'text-cinema-400' : 'text-muted-foreground'
            )}
          >
            <User className="h-5 w-5" />
            Me
          </Link>
        </div>
      </nav>

      <LogFilmModal open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  )
}
