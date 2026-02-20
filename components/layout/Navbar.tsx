'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Film, Home, BookOpen, List, Bell, Plus, LogOut, Settings, User, Bookmark } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { LogFilmModal } from '@/components/reviews/LogFilmModal'
import { cn, getInitials } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/films', label: 'Films', icon: Film },
  { href: '/diary', label: 'Diary', icon: BookOpen },
  { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { href: '/lists', label: 'Lists', icon: List },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [logOpen, setLogOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-cinema-400 shrink-0">
              <path d="M1 8V2.5A1.5 1.5 0 0 1 2.5 1H8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              <path d="M14 1h5.5A1.5 1.5 0 0 1 21 2.5V8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              <path d="M21 14v5.5A1.5 1.5 0 0 1 19.5 21H14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              <path d="M8 21H2.5A1.5 1.5 0 0 1 1 19.5V14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              <circle cx="11" cy="11" r="2" fill="currentColor"/>
            </svg>
            <span className="hidden sm:block font-black tracking-[0.1em] uppercase text-[15px] leading-none">
              WATCH<span className="text-cinema-400">DAT</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <MovieSearch className="w-full" placeholder="Search films..." />
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:block">{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {session?.user ? (
              <>
                <Button
                  variant="cinema"
                  size="sm"
                  onClick={() => setLogOpen(true)}
                  className="gap-1.5 hidden sm:flex"
                >
                  <Plus className="h-4 w-4" />
                  Log
                </Button>

                <Link
                  href="/notifications"
                  className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent transition-colors"
                >
                  <Bell className="h-4 w-4" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                  >
                    <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-cinema-500 transition-all">
                      <AvatarImage src={session.user.image ?? undefined} />
                      <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                        {getInitials(session.user.displayName ?? '')}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-popover shadow-xl py-1">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium">{session.user.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{session.user.username}</p>
                      </div>
                      <Link
                        href={`/user/${session.user.username}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      >
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button variant="cinema" size="sm">Join</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex border-t border-border/50">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                pathname === href ? 'text-cinema-400' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          {session?.user && (
            <button
              onClick={() => setLogOpen(true)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-cinema-400"
            >
              <Plus className="h-5 w-5" />
              Log
            </button>
          )}
        </div>
      </nav>

      <LogFilmModal open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  )
}
