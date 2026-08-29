'use client'

import { useState, useEffect } from 'react'
import { fetchHomepageSeo, updateHomepageSeo, uploadImageFile } from '@/lib/adminApi'
import { Button, useToast } from '@marketplace/ui'

export default function SeoManagement() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ogImageUrl: '',
    ogImageCloudinaryId: '',
  })

  useEffect(() => {
    loadSeo()
  }, [])

  const loadSeo = async () => {
    try {
      setLoading(true)
      const res = await fetchHomepageSeo()
      if (res.data) {
        setFormData({
          title: res.data.title || '',
          description: res.data.description || '',
          ogImageUrl: res.data.ogImageUrl || '',
          ogImageCloudinaryId: res.data.ogImageCloudinaryId || '',
        })
      }
    } catch (err) {
      console.error('Failed to load SEO settings:', err)
      addToast({
        title: 'Error',
        description: 'Failed to load SEO settings',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadImageFile(file)
      setFormData((prev) => ({
        ...prev,
        ogImageUrl: result.url,
        ogImageCloudinaryId: result.publicId || '',
      }))

      addToast({
        title: 'Success',
        description: 'Social preview image uploaded',
        variant: 'success',
      })
    } catch (err) {
      console.error('Upload error:', err)
      addToast({
        title: 'Upload Error',
        description: 'Failed to upload social image',
        variant: 'error',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      addToast({
        title: 'Validation Error',
        description: 'Title and description are required',
        variant: 'error',
      })
      return
    }

    try {
      setSaving(true)
      await updateHomepageSeo(formData)
      addToast({
        title: 'Success',
        description: 'Homepage SEO settings saved successfully',
        variant: 'success',
      })
      loadSeo()
    } catch (err) {
      console.error('Failed to save SEO settings:', err)
      addToast({
        title: 'Error',
        description: 'Failed to save SEO settings',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Homepage SEO & Social Sharing</h2>
        <p className="text-sm text-muted-foreground">
          Configure search engine metadata and social media preview card (Open Graph) image for the main homepage.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">Loading SEO settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Homepage SEO Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Ethiopian Fashion Marketplace — Buy, Rent & Custom Order"
              maxLength={200}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Recommended length: 50-60 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Meta Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Summarize your marketplace value proposition for search engines..."
              rows={4}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Recommended length: 140-160 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Open Graph / Social Sharing Image</label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full text-sm border rounded-lg p-2 bg-background"
              />
              {uploading && <p className="text-xs text-muted-foreground">Uploading preview image...</p>}

              <div className="relative">
                <div className="text-xs text-muted-foreground my-1 font-semibold uppercase tracking-wider">Or enter direct Image URL</div>
                <input
                  type="text"
                  value={formData.ogImageUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ogImageUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary font-mono text-xs"
                />
              </div>

              {formData.ogImageUrl ? (
                <div className="h-48 w-full max-w-lg rounded-xl overflow-hidden border bg-muted">
                  <img src={formData.ogImageUrl} alt="Social Share Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-32 w-full max-w-lg rounded-xl border border-dashed bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                  No social share image uploaded yet (1200x630px recommended).
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
