'use client'

import { useState } from 'react'
import { uploadImageFile } from '@/lib/adminApi'
import { Button, useToast } from '@marketplace/ui'

interface MediaItem {
  id: string
  url: string
  publicId: string
  createdAt: string
}

export default function MediaLibrary() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const { addToast } = useToast()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newMedia: MediaItem[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file) continue

        const result = await uploadImageFile(file)
        newMedia.push({
          id: result.publicId || String(Date.now() + i),
          url: result.url,
          publicId: result.publicId || 'local-asset',
          createdAt: new Date().toISOString(),
        })
      }

      setMediaList((prev) => [...newMedia, ...prev])
      addToast({
        title: 'Upload Successful',
        description: `${newMedia.length} image(s) uploaded to CMS media repository`,
        variant: 'success',
      })
    } catch (err) {
      console.error('Media upload error:', err)
      addToast({
        title: 'Error',
        description: 'Failed to upload image to media repository',
        variant: 'error',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    addToast({
      title: 'Copied',
      description: 'Image URL copied to clipboard',
      variant: 'success',
    })
  }

  const handleRemoveMedia = (id: string) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id))
    addToast({
      title: 'Removed',
      description: 'Media item removed from active session gallery',
      variant: 'success',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Media Repository</h2>
          <p className="text-sm text-muted-foreground">
            Upload, preview, copy URLs, and manage CMS media assets.
          </p>
        </div>
        <div className="relative">
          <Button disabled={uploading}>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {uploading ? 'Uploading...' : 'Upload Media'}
          </Button>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {mediaList.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-3">
          <svg className="h-12 w-12 text-muted-foreground mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
          </svg>
          <p className="text-muted-foreground">No media assets uploaded in this session.</p>
          <p className="text-xs text-muted-foreground">Click &ldquo;Upload Media&rdquo; above to upload new images for hero banners or SEO.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaList.map((item) => (
            <div key={item.id} className="group relative rounded-xl border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="h-36 w-full bg-muted overflow-hidden relative">
                <img src={item.url} alt="Media" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[11px] font-mono text-muted-foreground truncate">{item.publicId}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="w-full text-xs py-1" onClick={() => handleCopyUrl(item.url)}>
                    Copy URL
                  </Button>
                  <Button variant="destructive" size="sm" className="py-1 px-2" onClick={() => handleRemoveMedia(item.id)}>
                    &times;
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
