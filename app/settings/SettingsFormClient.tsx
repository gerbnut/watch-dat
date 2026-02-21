'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'
import TextareaAutosize from 'react-textarea-autosize'

interface User {
  id: string
  username: string
  displayName: string
  bio: string | null
  avatar: string | null
  bannerUrl: string | null
}

/** Compress an image file client-side to stay under maxSizeKB using Canvas. */
async function compressImage(file: File, maxSizeKB = 500): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Downscale to max 1200px on the longest edge
      const maxDim = 1200
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // Iteratively lower quality until under the size cap
      let quality = 0.85
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed')); return }
            if (blob.size <= maxSizeKB * 1024 || quality <= 0.25) {
              resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
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

export function SettingsFormClient({ user }: { user: User }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio ?? '')
  const [avatar, setAvatar] = useState(user.avatar ?? '')
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show a local preview immediately — no waiting for upload
    const previewUrl = URL.createObjectURL(file)
    const previousAvatar = avatar
    setAvatar(previewUrl)
    setUploading(true)

    try {
      // Compress to ≤ 500 KB before uploading — critical on slow mobile connections
      const compressed = await compressImage(file)

      const formData = new FormData()
      formData.append('file', compressed)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Upload failed')
      }

      const data = await res.json()
      URL.revokeObjectURL(previewUrl)
      setAvatar(data.url)
      toast({ title: 'Photo updated!', description: 'Your profile photo has been updated' })
    } catch (err: any) {
      // Revert to previous avatar on failure
      URL.revokeObjectURL(previewUrl)
      setAvatar(previousAvatar)
      toast({
        title: 'Upload failed',
        description: err.message ?? 'Could not upload image. Try a smaller photo.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected if needed
      e.target.value = ''
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    const previousBanner = bannerUrl
    setBannerUrl(previewUrl)
    setBannerUploading(true)

    try {
      const compressed = await compressImage(file, 800)
      const formData = new FormData()
      formData.append('file', compressed)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Upload failed')
      }
      const data = await res.json()

      // Immediately save banner to profile
      const patchRes = await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerUrl: data.url }),
      })
      if (!patchRes.ok) throw new Error('Failed to save banner')

      URL.revokeObjectURL(previewUrl)
      setBannerUrl(data.url)
      toast({ title: 'Banner updated!', description: 'Your profile banner has been updated' })
      router.refresh()
    } catch (err: any) {
      URL.revokeObjectURL(previewUrl)
      setBannerUrl(previousBanner)
      toast({
        title: 'Upload failed',
        description: err.message ?? 'Could not upload banner. Try a smaller image.',
        variant: 'destructive',
      })
    } finally {
      setBannerUploading(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio: bio || null, avatar: avatar || null }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast({ title: 'Profile updated!', variant: 'success' as any })
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner section */}
      <div className="rounded-xl border bg-card overflow-hidden space-y-0">
        <div className="relative h-28 overflow-hidden">
          {bannerUrl && !bannerUrl.startsWith('blob:') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="Profile banner" className="h-full w-full object-cover" />
          ) : bannerUrl && bannerUrl.startsWith('blob:') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="Banner preview" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-br from-cinema-900 via-film-900 to-cinema-950" />
          )}
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Profile Banner</p>
            <p className="text-xs text-muted-foreground mt-0.5">Displayed at the top of your profile · Auto-compressed</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={bannerUploading}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors disabled:opacity-60"
            >
              {bannerUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              {bannerUploading ? 'Uploading…' : 'Change banner'}
            </button>
            {bannerUrl && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch(`/api/users/${user.username}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ bannerUrl: null }),
                    })
                    setBannerUrl('')
                    toast({ title: 'Banner removed' })
                    router.refresh()
                  } catch {
                    toast({ title: 'Failed to remove banner', variant: 'destructive' })
                  }
                }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerChange}
        />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback className="text-xl bg-cinema-900 text-cinema-300">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-cinema-500 hover:bg-cinema-600 transition-colors shadow-lg disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-white" />
              )}
            </button>
            {/* accept="image/*" triggers iOS camera roll + "Take Photo" option */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-cinema-400 hover:text-cinema-300 transition-colors disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <p className="text-xs text-muted-foreground mt-0.5">
              {uploading ? 'Compressing & uploading…' : 'Any photo · Auto-compressed for fast upload'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Username</label>
          <Input value={user.username} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground">Username cannot be changed</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Display name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bio</label>
          <TextareaAutosize
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a bit about yourself..."
            minRows={2}
            maxRows={6}
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex justify-end">
          <Button variant="cinema" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
