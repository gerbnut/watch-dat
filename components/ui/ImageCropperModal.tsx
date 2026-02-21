'use client'

import { useState, useCallback } from 'react'
import Cropper, { type Point, type Area } from 'react-easy-crop'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Crop imageSrc to pixelCrop, output a JPEG blob capped at maxOutputPx on the longest side. */
async function getCroppedImg(imageSrc: string, pixelCrop: Area, maxOutputPx: number): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  // Scale down output if the crop area exceeds maxOutputPx
  const scale = Math.min(1, maxOutputPx / Math.max(pixelCrop.width, pixelCrop.height))
  const outW = Math.round(pixelCrop.width * scale)
  const outH = Math.round(pixelCrop.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    outW, outH,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { blob ? resolve(blob) : reject(new Error('Canvas export failed')) },
      'image/jpeg',
      0.9,
    )
  })
}

interface ImageCropperModalProps {
  /** Object URL of the image to crop */
  imageSrc: string
  /** Crop aspect ratio (1 for square avatar, 16/5 for banner) */
  aspect: number
  /** 'round' for profile pictures, 'rect' for banners */
  cropShape?: 'round' | 'rect'
  /** Max pixel size on the longest side of the output */
  maxOutputPx?: number
  title?: string
  onSave: (blob: Blob) => void
  onCancel: () => void
}

export function ImageCropperModal({
  imageSrc,
  aspect,
  cropShape = 'rect',
  maxOutputPx = 1000,
  title = 'Crop image',
  onSave,
  onCancel,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleSave() {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, maxOutputPx)
      onSave(blob)
    } catch {
      setSaving(false)
    }
  }

  return (
    // Full-screen overlay — z-[300] to sit above all other overlays
    <div className="fixed inset-0 z-[300] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-black/80">
        <button
          onClick={onCancel}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <Button
          size="sm"
          variant="cinema"
          onClick={handleSave}
          disabled={saving || !croppedAreaPixels}
          className="min-w-[64px]"
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* Crop area — fills remaining height */}
      <div className="relative flex-1 overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: { background: '#111' },
            cropAreaStyle: { border: '2px solid rgba(134,239,172,0.8)' },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div className="shrink-0 bg-black/80 px-8 py-4">
        <p className="mb-2 text-center text-[11px] text-white/40 tracking-wide uppercase">
          Pinch or drag slider to zoom
        </p>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full cursor-pointer accent-green-400"
          aria-label="Zoom"
        />
      </div>
    </div>
  )
}
