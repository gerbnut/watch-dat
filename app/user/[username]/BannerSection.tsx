'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

/** Compress an image file client-side to stay under maxSizeKB using Canvas. */
async function compressImage(file: File, maxSizeKB = 800): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      let { width, height } = img

      const maxDim = 1920
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.85
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed')); return }
            if (blob.size <= maxSizeKB * 1024 || quality <= 0.25) {
              resolve(new File([blob], 'banner.jpg', { type: 'image/jpeg' }))
            } else {
              quality = Math.max(0.25, quality - 0.1)
              tryCompress()
            }
          },
          'image/jpeg',
          quality,
        )
      }
      tryCompress()
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

interface BannerSectionProps {
  bannerUrl: string | null
  isOwnProfile: boolean
  username: string
}

export function BannerSection({ bannerUrl: initialUrl, isOwnProfile, username }: BannerSectionProps) {
  const [bannerUrl, setBannerUrl] = useState(initialUrl)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      const compressed = await compressImage(file, 800)

      const formData = new FormData()
      formData.append('file', compressed)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(err.error ?? 'Upload failed')
      }
      const uploadData = await uploadRes.json()

      const patchRes = await fetch(`/api/users/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerUrl: uploadData.url }),
      })
      if (!patchRes.ok) throw new Error('Failed to save banner')

      URL.revokeObjectURL(objectUrl)
      setBannerUrl(uploadData.url)
      setPreview(null)
      toast({ title: 'Banner updated!' })
    } catch (err: any) {
      URL.revokeObjectURL(objectUrl)
      setPreview(null)
      toast({
        title: 'Failed to update banner',
        description: err.message ?? 'Could not upload image.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const displayUrl = preview ?? bannerUrl

  return (
    <div className="relative h-36 sm:h-48 overflow-hidden">
      {displayUrl ? (
        <Image
          src={displayUrl}
          alt="Profile banner"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      ) : (
        <div className="h-full bg-gradient-to-br from-cinema-900 via-film-900 to-cinema-950" />
      )}

      {isOwnProfile && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md bg-black/50 px-3 py-1.5 text-xs text-white hover:bg-black/70 transition-colors disabled:opacity-60 backdrop-blur-sm"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {uploading ? 'Uploading…' : 'Edit banner'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  )
}
