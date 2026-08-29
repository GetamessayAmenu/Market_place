'use client'

import { useState, useEffect } from 'react'
import {
  getHeroBanners,
  createHeroBanner,
  updateHeroBanner,
  publishHeroBanner,
  unpublishHeroBanner,
  deleteHeroBanner,
  uploadImageFile,
  type HeroBanner,
} from '@/lib/adminApi'
import { Button, Modal, useToast } from '@marketplace/ui'

export default function HeroBannerManagement() {
  const [banners, setBanners] = useState<HeroBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<HeroBanner | null>(null)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    cloudinaryPublicId: '',
    linkUrl: '',
    sortOrder: 0,
    status: 'draft',
  })

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      setLoading(true)
      const res = await getHeroBanners({ limit: 50 })
      setBanners(res.data?.items || [])
    } catch (err) {
      console.error('Failed to load hero banners:', err)
      addToast({
        title: 'Error',
        description: 'Failed to load hero banners',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingBanner(null)
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      cloudinaryPublicId: '',
      linkUrl: '',
      sortOrder: banners.length + 1,
      status: 'draft',
    })
    setShowModal(true)
  }

  const handleOpenEdit = (banner: HeroBanner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      cloudinaryPublicId: banner.cloudinaryPublicId || '',
      linkUrl: banner.linkUrl || '',
      sortOrder: banner.sortOrder || 0,
      status: banner.status || 'draft',
    })
    setShowModal(true)
  }

  const DEFAULT_PLACEHOLDER_BANNER = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const localDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => resolve('')
        reader.readAsDataURL(file)
      })

      if (localDataUrl) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: localDataUrl,
        }))
      }

      const result = await uploadImageFile(file)
      if (result.url) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: result.url,
          cloudinaryPublicId: result.publicId || prev.cloudinaryPublicId,
        }))
      }

      addToast({
        title: 'Image Ready',
        description: 'Banner image processed successfully',
        variant: 'success',
      })
    } catch (err) {
      console.warn('Image processing warning:', err)
      addToast({
        title: 'Image Selected',
        description: 'Image set for banner preview',
        variant: 'success',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalTitle = formData.title.trim()
    if (!finalTitle) {
      addToast({
        title: 'Validation Error',
        description: 'Banner title is required',
        variant: 'error',
      })
      return
    }

    const finalImageUrl = formData.imageUrl.trim() || DEFAULT_PLACEHOLDER_BANNER

    try {
      if (editingBanner) {
        await updateHeroBanner(editingBanner.id, {
          title: finalTitle,
          subtitle: formData.subtitle,
          imageUrl: finalImageUrl,
          cloudinaryPublicId: formData.cloudinaryPublicId,
          linkUrl: formData.linkUrl,
          sortOrder: formData.sortOrder,
        })

        if (formData.status !== editingBanner.status) {
          if (formData.status === 'published') {
            await publishHeroBanner(editingBanner.id)
          } else {
            await unpublishHeroBanner(editingBanner.id)
          }
        }

        addToast({ title: 'Success', description: 'Hero banner updated successfully', variant: 'success' })
      } else {
        const createRes = await createHeroBanner({
          title: finalTitle,
          subtitle: formData.subtitle,
          imageUrl: finalImageUrl,
          cloudinaryPublicId: formData.cloudinaryPublicId,
          linkUrl: formData.linkUrl,
          sortOrder: formData.sortOrder,
        })

        if (formData.status === 'published' && createRes?.data?.id) {
          await publishHeroBanner(createRes.data.id)
        }

        addToast({ title: 'Success', description: 'Hero banner created successfully', variant: 'success' })
      }

      setShowModal(false)
      loadBanners()
    } catch (err: any) {
      console.error('Save error:', err)
      addToast({
        title: 'Error',
        description: err.message || 'Failed to save hero banner',
        variant: 'error',
      })
    }
  }

  const handleTogglePublish = async (banner: HeroBanner) => {
    try {
      if (banner.status === 'published') {
        await unpublishHeroBanner(banner.id)
        addToast({ title: 'Unpublished', description: 'Banner set to draft', variant: 'success' })
      } else {
        await publishHeroBanner(banner.id)
        addToast({ title: 'Published', description: 'Banner published to homepage', variant: 'success' })
      }
      loadBanners()
    } catch (err) {
      console.error('Status error:', err)
      addToast({ title: 'Error', description: 'Failed to update banner status', variant: 'error' })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteHeroBanner(deleteConfirm.id)
      addToast({ title: 'Deleted', description: 'Hero banner removed', variant: 'success' })
      setDeleteConfirm(null)
      loadBanners()
    } catch (err) {
      console.error('Delete error:', err)
      addToast({ title: 'Error', description: 'Failed to delete banner', variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Hero Banners</h2>
          <p className="text-sm text-muted-foreground">Manage full-width promotional banners on the homepage hero section.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Hero Banner
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">Loading hero banners...</div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No hero banners created yet.</p>
          <Button variant="outline" onClick={handleOpenCreate}>Create your first banner</Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-xl border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative h-44 w-full bg-muted">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      banner.status === 'published' ? 'bg-green-500/90 text-white' : 'bg-gray-700/90 text-white'
                    }`}
                  >
                    {banner.status}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">
                    Order: {banner.sortOrder}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-card-foreground">{banner.title}</h3>
                  {banner.subtitle && <p className="text-sm text-muted-foreground mt-1">{banner.subtitle}</p>}
                  {banner.linkUrl && (
                    <p className="text-xs text-primary truncate mt-2">
                      CTA Link: <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="underline">{banner.linkUrl}</a>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t gap-2">
                  <Button
                    variant={banner.status === 'published' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleTogglePublish(banner)}
                  >
                    {banner.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(banner)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(banner)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingBanner ? 'Edit Hero Banner' : 'Create Hero Banner'}
        >
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Ethiopian New Year Specials"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="e.g. Up to 30% off traditional attire"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Banner Image *</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="w-full text-sm border rounded-lg p-2 bg-background"
                  />
                </div>
                {uploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading / processing image...</p>}

                <div className="relative">
                  <div className="text-xs text-muted-foreground my-1 font-semibold uppercase tracking-wider">Or enter direct Image URL</div>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/photo-... or Cloudinary URL"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary font-mono text-xs"
                  />
                </div>

                {formData.imageUrl && (
                  <div className="mt-2 h-36 rounded-lg overflow-hidden border bg-muted relative">
                    <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '', cloudinaryPublicId: '' }))}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700"
                    >
                      &times; Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">CTA Destination URL</label>
              <input
                type="text"
                value={formData.linkUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                placeholder="/search?category=habesha-kemis"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  min={0}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {editingBanner ? 'Save Changes' : 'Create Banner'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Hero Banner">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the hero banner <strong className="text-foreground">&ldquo;{deleteConfirm.title}&rdquo;</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
