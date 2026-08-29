'use client'

import { useState } from 'react'
import { createHomepageContent, updateHomepageContent, uploadImageFile, type HomepageContent } from '@/lib/adminApi'
import { Button } from '@marketplace/ui'

interface HomepageContentFormProps {
  content?: HomepageContent | undefined
  onSuccess: () => void
  onCancel: () => void
}

const CONTENT_TYPES = ['hero_banner', 'featured_product', 'featured_rental', 'featured_custom_service', 'promotional_section', 'homepage_category']
const CONTENT_STATUSES = ['draft', 'published', 'scheduled', 'archived']

export default function HomepageContentForm({ content, onSuccess, onCancel }: HomepageContentFormProps) {
  const [formData, setFormData] = useState({
    type: content?.type || 'hero_banner',
    title: content?.title || '',
    subtitle: content?.subtitle || '',
    description: content?.description || '',
    imageUrl: content?.imageUrl || '',
    cloudinaryPublicId: content?.cloudinaryPublicId || '',
    linkUrl: content?.linkUrl || '',
    linkLabel: content?.linkLabel || '',
    buttonText: content?.buttonText || '',
    backgroundColor: content?.backgroundColor || '#ffffff',
    textColor: content?.textColor || '#000000',
    status: content?.status || 'draft',
    sortOrder: content?.sortOrder || 0,
    publishAt: content?.publishAt ? new Date(content.publishAt).toISOString().slice(0, 16) : '',
    unpublishAt: content?.unpublishAt ? new Date(content.unpublishAt).toISOString().slice(0, 16) : '',
    featuredListingId: content?.featuredListingId || '',
    featuredCategoryId: content?.featuredCategoryId || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (content) {
        await updateHomepageContent(content.id, formData)
      } else {
        await createHomepageContent(formData)
      }
      onSuccess()
    } catch (err) {
      setError('Failed to save content. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadImageFile(file)
      setFormData(prev => ({
        ...prev,
        imageUrl: result.url,
        cloudinaryPublicId: result.publicId || '',
      }))
    } catch (err) {
      setError('Failed to upload image. Please try again.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Content Type *</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            {CONTENT_TYPES.map(type => (
              <option key={type} value={type}>
                {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status *</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            {CONTENT_STATUSES.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          required
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Subtitle</label>
        <input
          type="text"
          name="subtitle"
          value={formData.subtitle}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          maxLength={300}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image</label>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={uploading}
          />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          {formData.imageUrl && (
            <img
              src={formData.imageUrl}
              alt="Preview"
              className="w-full h-32 object-cover rounded"
            />
          )}
          <input
            type="hidden"
            name="imageUrl"
            value={formData.imageUrl}
          />
          <input
            type="hidden"
            name="cloudinaryPublicId"
            value={formData.cloudinaryPublicId}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Link URL</label>
          <input
            type="url"
            name="linkUrl"
            value={formData.linkUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Link Label</label>
          <input
            type="text"
            name="linkLabel"
            value={formData.linkLabel}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
            maxLength={100}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Button Text</label>
        <input
          type="text"
          name="buttonText"
          value={formData.buttonText}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Background Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              name="backgroundColor"
              value={formData.backgroundColor}
              onChange={handleChange}
              className="h-10 w-20 border rounded"
            />
            <input
              type="text"
              name="backgroundColor"
              value={formData.backgroundColor}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border rounded-lg"
              maxLength={7}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Text Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              name="textColor"
              value={formData.textColor}
              onChange={handleChange}
              className="h-10 w-20 border rounded"
            />
            <input
              type="text"
              name="textColor"
              value={formData.textColor}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border rounded-lg"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Sort Order</label>
          <input
            type="number"
            name="sortOrder"
            value={formData.sortOrder}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Publish At</label>
          <input
            type="datetime-local"
            name="publishAt"
            value={formData.publishAt}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Unpublish At</label>
          <input
            type="datetime-local"
            name="unpublishAt"
            value={formData.unpublishAt}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Featured Listing ID</label>
          <input
            type="text"
            name="featuredListingId"
            value={formData.featuredListingId}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="UUID of listing to feature"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Featured Category ID</label>
          <input
            type="text"
            name="featuredCategoryId"
            value={formData.featuredCategoryId}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="UUID of category to feature"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : content ? 'Update Content' : 'Create Content'}
        </Button>
      </div>
    </form>
  )
}
