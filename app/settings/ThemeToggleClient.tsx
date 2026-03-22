'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggleClient() {
  const { theme, toggle } = useTheme()

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {theme === 'dark' ? (
            <Moon className="h-4 w-4 text-cinema-400" />
          ) : (
            <Sun className="h-4 w-4 text-cinema-400" />
          )}
          <div>
            <p className="text-sm font-medium">Appearance</p>
            <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
          </div>
        </div>
        <button
          onClick={toggle}
          className={`relative w-9 h-5 rounded-full transition-colors ${theme === 'light' ? 'bg-cinema-500' : 'bg-white/[0.08]'}`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${theme === 'light' ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
      </div>
    </div>
  )
}
