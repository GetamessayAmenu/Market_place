'use client'

import { useState, useEffect } from 'react'
import { fetchHomepageContents, deleteHomepageContent, restoreHomepageContent, reorderHomepageContent, type HomepageContent } from '@/lib/adminApi'
import { Button, Modal } from '@marketplace/ui'
import { useToast } from '@marketplace/ui'
import HomepageContentForm from '@/components/admin/HomepageContentForm'

export default function HomepageContentPage() {
  const [items, setItems] = useState<HomepageContent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<HomepageContent | undefined>(undefined)
  const [draggedItem, setDraggedItem] = useState<HomepageContent | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<HomepageContent | null>(null)
  const { addToast } = useToast()

  const CONTENT_TYPES = ['hero_banner', 'featured_product', 'featured_rental', 'featured_custom_service', 'promotional_section', 'homepage_category']
  const CONTENT_STATUSES = ['draft', 'published', 'scheduled', 'archived']

  useEffect(() => {
    loadItems()
  }, [page, statusFilter, typeFilter])

  const loadItems = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      if (search) params.search = search

      const response = await fetchHomepageContents(params)
      setItems(response.data)
      setTotal(response.meta.total)
    } catch (error) {
      console.error('Failed to load homepage content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    setDeleteConfirm(item)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteHomepageContent(deleteConfirm.id)
      addToast({
        title: 'Success',
        description: 'Content deleted successfully',
        variant: 'success',
      })
      loadItems()
      setDeleteConfirm(null)
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'error',
      })
      console.error('Failed to delete content:', error)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreHomepageContent(id)
      addToast({
        title: 'Success',
        description: 'Content restored successfully',
        variant: 'success',
      })
      loadItems()
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to restore content',
        variant: 'error',
      })
      console.error('Failed to restore content:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadItems()
  }

  const handleDragStart = (item: HomepageContent) => {
    setDraggedItem(item)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetItem: HomepageContent) => {
    if (!draggedItem || draggedItem.id === targetItem.id) return

    const newItems = [...items]
    const draggedIndex = newItems.findIndex(i => i.id === draggedItem.id)
    const targetIndex = newItems.findIndex(i => i.id === targetItem.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItem)

    const reorderedIds = newItems.map(i => i.id)
    setItems(newItems)

    try {
      await reorderHomepageContent(reorderedIds)
    } catch (error) {
      console.error('Failed to reorder:', error)
      loadItems()
    }

    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Homepage Content Management</h1>
        <Button onClick={() => { setShowForm(true); setEditingItem(undefined) }}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Content
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-4 py-2 border rounded-lg w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Statuses</option>
          {CONTENT_STATUSES.map(status => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Types</option>
          {CONTENT_TYPES.map(type => (
            <option key={type} value={type}>{getTypeLabel(type)}</option>
          ))}
        </select>
        <Button variant="outline" onClick={handleSearch}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          Filter
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No content found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === items.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(items.map(i => i.id)))
                      } else {
                        setSelectedItems(new Set())
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Sort Order</th>
                <th className="px-4 py-3 text-left">Schedule</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-gray-50 cursor-move"
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(item)}
                  onDragEnd={handleDragEnd}
                  style={{ opacity: draggedItem?.id === item.id ? 0.5 : 1 }}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedItems)
                        if (e.target.checked) {
                          newSelected.add(item.id)
                        } else {
                          newSelected.delete(item.id)
                        }
                        setSelectedItems(newSelected)
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{getTypeLabel(item.type)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.title}</div>
                    {item.subtitle && <div className="text-sm text-gray-500">{item.subtitle}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.sortOrder}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.publishAt && <div>Publish: {new Date(item.publishAt).toLocaleDateString()}</div>}
                    {item.unpublishAt && <div>Unpublish: {new Date(item.unpublishAt).toLocaleDateString()}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setShowForm(true) }}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </Button>
                      {item.deletedAt ? (
                        <Button variant="outline" size="sm" onClick={() => handleRestore(item.id)}>
                          Restore
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {items.length} of {total} items
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={items.length < 20}
          >
            Next
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit Content' : 'Create Content'}
            </h2>
            <HomepageContentForm
              {...(editingItem ? { content: editingItem } : {})}
              onSuccess={() => {
                setShowForm(false)
                setEditingItem(undefined)
                loadItems()
              }}
              onCancel={() => {
                setShowForm(false)
                setEditingItem(undefined)
              }}
            />
          </div>
        </div>
      )}

      {deleteConfirm && (
        <Modal
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Confirm Delete"
        >
          <div className="space-y-4">
            <p>Are you sure you want to delete "{deleteConfirm.title}"?</p>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
