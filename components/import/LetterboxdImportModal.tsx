'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type ImportState = 'idle' | 'uploading' | 'success' | 'error'

interface ImportResult {
  totalItems: number
  matched: number
  skipped: number
  failed: number
}

export function LetterboxdImportModal({ open, onClose, onSuccess }: Props) {
  const [diaryFile, setDiaryFile] = useState<File | null>(null)
  const [watchlistFile, setWatchlistFile] = useState<File | null>(null)
  const [state, setState] = useState<ImportState>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const diaryRef = useRef<HTMLInputElement>(null)
  const watchlistRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    if (state === 'uploading') return
    setDiaryFile(null)
    setWatchlistFile(null)
    setState('idle')
    setResult(null)
    setErrorMsg('')
    onClose()
  }, [state, onClose])

  const handleDrop = useCallback(
    (e: React.DragEvent, type: 'diary' | 'watchlist') => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (!file) return
      if (!file.name.endsWith('.csv')) {
        toast({ title: 'Please drop a .csv file', variant: 'destructive' })
        return
      }
      if (type === 'diary') setDiaryFile(file)
      else setWatchlistFile(file)
    },
    []
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: 'diary' | 'watchlist') => {
      const file = e.target.files?.[0]
      if (!file) return
      if (type === 'diary') setDiaryFile(file)
      else setWatchlistFile(file)
    },
    []
  )

  const handleImport = async () => {
    if (!diaryFile) return

    setState('uploading')
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('diary', diaryFile)
      if (watchlistFile) formData.append('watchlist', watchlistFile)

      const res = await fetch('/api/import/letterboxd', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
      setState('success')
      toast({ title: 'Import complete!', variant: 'success' })
      onSuccess?.()
    } catch (err) {
      setState('error')
      const msg = (err as Error).message || 'Something went wrong'
      setErrorMsg(msg)
      toast({ title: 'Import failed', description: msg, variant: 'destructive' })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative w-full max-w-md backdrop-blur-xl bg-[hsl(225_14%_7%_/_0.95)] border border-white/[0.06] rounded-t-2xl sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(calc(100svh - 4rem), 600px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-base">Import from Letterboxd</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload your Letterboxd export CSV files
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {state === 'success' && result ? (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-10 w-10 text-cinema-400" />
                <div>
                  <p className="font-medium">Import complete</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Letterboxd data has been imported
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
                  <p className="text-lg font-semibold tabular-nums">{result.matched}</p>
                  <p className="text-xs text-muted-foreground">Matched</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
                  <p className="text-lg font-semibold tabular-nums">{result.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 text-center">
                  <p className="text-lg font-semibold tabular-nums">{result.failed}</p>
                  <p className="text-xs text-muted-foreground">Not found</p>
                </div>
              </div>
              <Button variant="cinema" className="w-full" onClick={handleClose}>
                Done
              </Button>
            </div>
          ) : state === 'error' ? (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <div>
                  <p className="font-medium">Import failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="cinema"
                  className="flex-1"
                  onClick={() => {
                    setState('idle')
                    setErrorMsg('')
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : state === 'uploading' ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-cinema-400" />
              <div className="text-center">
                <p className="font-medium">Importing your data...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This may take a while for large libraries
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Diary CSV (required) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Diary <span className="text-muted-foreground font-normal">(required)</span>
                </label>
                <input
                  ref={diaryRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'diary')}
                />
                <div
                  onClick={() => diaryRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'diary')}
                  className={cn(
                    'cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                    diaryFile
                      ? 'border-cinema-500/30 bg-cinema-500/5'
                      : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
                  )}
                >
                  {diaryFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4 text-cinema-400" />
                      <span className="text-sm font-medium">{diaryFile.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDiaryFile(null)
                        }}
                        className="rounded-full p-0.5 hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="h-5 w-5 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Drop <span className="font-medium text-foreground">diary.csv</span> here or
                        click to browse
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Watchlist CSV (optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Watchlist <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  ref={watchlistRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'watchlist')}
                />
                <div
                  onClick={() => watchlistRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'watchlist')}
                  className={cn(
                    'cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                    watchlistFile
                      ? 'border-cinema-500/30 bg-cinema-500/5'
                      : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
                  )}
                >
                  {watchlistFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4 text-cinema-400" />
                      <span className="text-sm font-medium">{watchlistFile.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setWatchlistFile(null)
                        }}
                        className="rounded-full p-0.5 hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="h-5 w-5 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Drop <span className="font-medium text-foreground">watchlist.csv</span> here
                        or click to browse
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* How to export */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To export from Letterboxd: go to{' '}
                  <span className="font-medium text-foreground">Settings &rarr; Import &amp; Export &rarr; Export Your Data</span>.
                  You'll get a ZIP containing diary.csv and watchlist.csv.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sticky footer — only in idle state */}
        {state === 'idle' && (
          <div className="shrink-0 border-t border-white/[0.04] px-5 py-4">
            <Button
              variant="cinema"
              className="w-full gap-2"
              onClick={handleImport}
              disabled={!diaryFile}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
