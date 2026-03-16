'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'

import { Film, Home, LogOut, Settings, User, Users, Shuffle } from 'lucide-react'
import { WatchDatLogoMark } from './WatchDatLogo'
import { NotificationBell } from './NotificationBell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { cn, getInitials } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/films', label: 'Films', icon: Film },
  { href: '/friends', label: 'Members', icon: Users },
  { href: '/pick-tonight', label: 'Pick', icon: Shuffle },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [navAvatar, setNavAvatar] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const avatarBtnRef = useRef<HTMLButtonElement>(null)

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
    const close = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      if (avatarBtnRef.current?.contains(e.target as Node)) return
      setUserMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [userMenuOpen])

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[hsl(225_14%_6%_/_0.8)] border-b border-white/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">

        {/* Logo + Wordmark */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <WatchDatLogoMark className="text-cinema-400 shrink-0 transition-all group-hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
          <span className="hidden sm:block font-black text-[15px] leading-none tracking-tight">
            Watch <span className="text-cinema-400">DAT</span>
          </span>
        </Link>

        {/* Search — fills available space, max 400px on desktop */}
        <div className="flex-1 min-w-0 max-w-[400px]">
          <MovieSearch className="w-full" placeholder="Search films, people..." showPeople />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/[0.06] text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:block">{label}</span>
                {isActive && (
                  <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-cinema-400" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Right — notification bell + avatar */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {session?.user ? (
            <>
              <NotificationBell />

              <div className="relative">
                {/* Avatar button — 44px tap target for iPhone */}
                <button
                  ref={avatarBtnRef}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-cinema-500/40 transition-all">
                    <AvatarImage src={navAvatar ?? session.user.image ?? undefined} />
                    <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                      {getInitials(session.user.displayName ?? '')}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {userMenuOpen && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl backdrop-blur-xl bg-[hsl(225_14%_7%_/_0.95)] border border-white/[0.06] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] py-1 overflow-hidden"
                  >
                    <div className="px-3 py-2.5 border-b border-white/[0.06]">
                      <p className="text-sm font-semibold leading-tight">{session.user.displayName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">@{session.user.username}</p>
                    </div>
                    <Link
                      href={`/user/${session.user.username}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/[0.05] transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" /> Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/[0.05] transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                    </Link>
                    <div className="border-t border-white/[0.06] mt-1 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </motion.div>
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
  )
}
