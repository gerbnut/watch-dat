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

  const tabs = [
    { href: '/', label: 'Home', icon: Home, active: pathname === '/' },
    { href: '/films', label: 'Films', icon: Film, active: pathname.startsWith('/films') },
    { href: '/friends', label: 'Friends', icon: Users, active: pathname.startsWith('/friends') },
    { href: meHref, label: 'Me', icon: User, active: meActive },
  ]

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 backdrop-blur-xl bg-[hsl(225_14%_5%_/_0.85)] border-t border-white/[0.04] shadow-[0_-2px_10px_rgba(0,0,0,0.3)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-16 items-center">
          {/* Home + Films */}
          {tabs.slice(0, 2).map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all duration-200',
                active ? 'text-cinema-400' : 'text-muted-foreground/60'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]')} />
              {label}
              {active && <span className="h-1 w-1 rounded-full bg-cinema-400 mt-0.5" />}
            </Link>
          ))}

          {/* Center Log button — floating action */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <button
              onClick={() => {
                if (session?.user) {
                  setLogOpen(true)
                } else {
                  window.location.href = '/login'
                }
              }}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-cinema-500 text-black -mt-5 ring-4 ring-[hsl(225_15%_4%)] shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] hover:bg-cinema-400 hover:shadow-[0_0_30px_-3px_rgba(16,185,129,0.5)] active:scale-90 active:bg-cinema-600 transition-all duration-200"
              aria-label="Log film"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {/* Friends + Me */}
          {tabs.slice(2).map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all duration-200',
                active ? 'text-cinema-400' : 'text-muted-foreground/60'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]')} />
              {label}
              {active && <span className="h-1 w-1 rounded-full bg-cinema-400 mt-0.5" />}
            </Link>
          ))}
        </div>
      </nav>

      <LogFilmModal open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  )
}
