'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ImageCropperModal } from '@/components/ui/ImageCropperModal'

interface BannerSectionProps {
  bannerUrl: string | null
  isOwnProfile: boolean
  username: string
}

export function BannerSection({ bannerUrl: initialUrl, isOwnProfile, username }: BannerSectionProps) {
  const [bannerUrl, setBannerUrl] = useState(initialUrl)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function onCropSave(blob: Blob) {
    const imageSrc = cropSrc!
    setCropSrc(null)
    setUploading(true)

    const previewUrl = URL.createObjectURL(blob)
    setBannerUrl(previewUrl) // optimistic preview

    try {
      const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      // Upload to bannerUrl field only — never touches avatar
      const uploadRes = await fetch('/api/upload?field=bannerUrl', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(err.error ?? 'Upload failed')
      }
      const uploadData = await uploadRes.json()

      URL.revokeObjectURL(imageSrc)
      URL.revokeObjectURL(previewUrl)
      setBannerUrl(uploadData.url)
      toast({ title: 'Banner updated!' })
    } catch (err: any) {
      URL.revokeObjectURL(imageSrc)
      URL.revokeObjectURL(previewUrl)
      setBannerUrl(initialUrl) // revert on error
      toast({
        title: 'Failed to update banner',
        description: err.message ?? 'Could not upload image.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  function onCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  return (
    <>
      {cropSrc && (
        <ImageCropperModal
          imageSrc={cropSrc}
          aspect={16 / 5}
          cropShape="rect"
          maxOutputPx={1600}
          title="Crop banner"
          onSave={onCropSave}
          onCancel={onCropCancel}
        />
      )}

      <div className="relative h-36 sm:h-48 overflow-hidden">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt="Profile banner"
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized={bannerUrl.startsWith('blob:')}
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-cinema-900 via-film-900 to-cinema-950" />
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {isOwnProfile && !uploading && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md bg-black/50 px-3 py-1.5 text-xs text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
            >
              <Camera className="h-3.5 w-3.5" />
              Edit banner
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelected}
            />
          </>
        )}
      </div>
    </>
  )
}
