'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Home, Film, BookOpen, Bookmark, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogFilmModal } from '@/components/reviews/LogFilmModal'

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/films', label: 'Films', icon: Film },
  { href: '/diary', label: 'Diary', icon: BookOpen },
  { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { href: '/lists', label: 'Lists', icon: List },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [logOpen, setLogOpen] = useState(false)

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-sm"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-14">
          {TABS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-cinema-400' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {session?.user && (
        <LogFilmModal open={logOpen} onClose={() => setLogOpen(false)} />
      )}
    </>
  )
}
