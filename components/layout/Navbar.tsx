'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

import { Film, Home, BookOpen, List, Plus, LogOut, Settings, User, Bookmark, Users } from 'lucide-react'
import { WatchDatLogoMark } from './WatchDatLogo'
import { NotificationBell } from './NotificationBell'
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
  { href: '/friends', label: 'Friends', icon: Users },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [logOpen, setLogOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [navAvatar, setNavAvatar] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch avatar from DB — session.user.image strips base64 data URLs to stay under 4KB cookie limit
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setNavAvatar(d.avatar ?? null))
      .catch(() => {})
  }, [session?.user?.id])

  // Instantly reflect avatar changes from the settings page without a full refresh
  useEffect(() => {
    function onAvatarUpdated(e: Event) {
      const detail = (e as CustomEvent<{ avatar: string }>).detail
      if (detail?.avatar) setNavAvatar(detail.avatar)
    }
    window.addEventListener('avatarUpdated', onAvatarUpdated)
    return () => window.removeEventListener('avatarUpdated', onAvatarUpdated)
  }, [])

  useEffect(() => {
    if (!userMenuOpen) return
    const close = (e: MouseEvent | Event) => {
      if (e instanceof MouseEvent && menuRef.current?.contains(e.target as Node)) return
      setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, { passive: true, capture: true })
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, { capture: true })
    }
  }, [userMenuOpen])

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <WatchDatLogoMark className="text-cinema-400 shrink-0 transition-opacity group-hover:opacity-80" />
            <span className="hidden sm:block font-black tracking-[0.12em] uppercase text-[14px] leading-none">
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
                  className="gap-1.5 flex"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Log</span>
                </Button>

                <NotificationBell />

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-cinema-500 transition-all">
                      <AvatarImage src={navAvatar ?? session.user.image ?? undefined} />
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

      </nav>

      <LogFilmModal open={logOpen} onClose={() => setLogOpen(false)} />
    </>
  )
}
