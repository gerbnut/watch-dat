'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImageCropperModal } from '@/components/ui/ImageCropperModal'
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

type CropTarget = {
  imageSrc: string
  field: 'avatar' | 'bannerUrl'
}

async function uploadCroppedBlob(blob: Blob, field: 'avatar' | 'bannerUrl'): Promise<string> {
  const file = new File([blob], field === 'avatar' ? 'avatar.jpg' : 'banner.jpg', { type: 'image/jpeg' })
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`/api/upload?field=${field}`, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Upload failed')
  }
  const data = await res.json()
  return data.url as string
}

export function SettingsFormClient({ user }: { user: User }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio ?? '')
  const [avatar, setAvatar] = useState(user.avatar ?? '')
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl ?? '')
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
  const [uploading, setUploading] = useState<'avatar' | 'bannerUrl' | null>(null)
  const [saving, setSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  function openFilePicker(field: 'avatar' | 'bannerUrl') {
    if (field === 'avatar') avatarInputRef.current?.click()
    else bannerInputRef.current?.click()
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'bannerUrl') {
    const file = e.target.files?.[0]
    if (!file) return
    const imageSrc = URL.createObjectURL(file)
    setCropTarget({ imageSrc, field })
    e.target.value = ''
  }

  async function onCropSave(blob: Blob) {
    if (!cropTarget) return
    const { imageSrc, field } = cropTarget
    setCropTarget(null)
    setUploading(field)
    try {
      const url = await uploadCroppedBlob(blob, field)
      URL.revokeObjectURL(imageSrc)
      if (field === 'avatar') {
        setAvatar(url)
        // Notify Navbar immediately — no need to wait for Save
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatar: url } }))
        toast({ title: 'Photo updated!' })
      } else {
        setBannerUrl(url)
        toast({ title: 'Banner updated!' })
      }
    } catch (err: any) {
      URL.revokeObjectURL(imageSrc)
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(null)
    }
  }

  function onCropCancel() {
    if (cropTarget) URL.revokeObjectURL(cropTarget.imageSrc)
    setCropTarget(null)
  }

  async function handleSave() {
    setSaving(true)
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
      setSaving(false)
    }
  }

  async function removeBanner() {
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
  }

  return (
    <>
      {/* Image cropper — mounts over everything when a file is selected */}
      {cropTarget && (
        <ImageCropperModal
          imageSrc={cropTarget.imageSrc}
          aspect={cropTarget.field === 'avatar' ? 1 : 16 / 5}
          cropShape={cropTarget.field === 'avatar' ? 'round' : 'rect'}
          maxOutputPx={cropTarget.field === 'avatar' ? 800 : 1600}
          title={cropTarget.field === 'avatar' ? 'Crop profile photo' : 'Crop banner'}
          onSave={onCropSave}
          onCancel={onCropCancel}
        />
      )}

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileSelected(e, 'avatar')}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileSelected(e, 'bannerUrl')}
      />

      <div className="space-y-6">
        {/* Banner section */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="relative h-28 overflow-hidden">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="Profile banner" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full bg-gradient-to-br from-cinema-900 via-film-900 to-cinema-950" />
            )}
            {uploading === 'bannerUrl' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">Profile Banner</p>
              <p className="text-xs text-muted-foreground mt-0.5">16:5 ratio · shown at top of your profile</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openFilePicker('bannerUrl')}
                disabled={!!uploading}
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors disabled:opacity-60"
              >
                <Camera className="h-3.5 w-3.5" />
                Change banner
              </button>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={removeBanner}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile section */}
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
                onClick={() => openFilePicker('avatar')}
                disabled={!!uploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-cinema-500 hover:bg-cinema-600 transition-colors shadow-lg disabled:opacity-60"
              >
                {uploading === 'avatar' ? (
                  <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-white" />
                )}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => openFilePicker('avatar')}
                disabled={!!uploading}
                className="text-sm font-medium text-cinema-400 hover:text-cinema-300 transition-colors disabled:opacity-60"
              >
                {uploading === 'avatar' ? 'Uploading…' : 'Change photo'}
              </button>
              <p className="text-xs text-muted-foreground mt-0.5">
                Square crop · saved to your profile and navbar
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
            <Button variant="cinema" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
