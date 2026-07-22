'use client'
import {
  Button,
  Select,
  Pagination,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Spinner,
  Alert,
  Badge,
  Input,
} from '@marketplace/ui'
import React, { useState, useCallback } from 'react'

import { clientGet, clientPost, clientPatch, clientDelete, buildQuery } from '../../lib/clientApi'

import { formatDate } from './StatusBadge'

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  type: string
  iconUrl: string | null
  sortOrder: number
  isActive: boolean
  children?: Category[]
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface CategoriesTableProps {
  initialData: PaginatedResponse<Category>
}

export default function CategoriesTable({ initialData }: CategoriesTableProps) {
  const [categories, setCategories] = useState(initialData.data)
  const [page, setPage] = useState(initialData.meta.page)
  const [totalPages, setTotalPages] = useState(initialData.meta.totalPages)
  const [total, setTotal] = useState(initialData.meta.total)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  // Modals
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'product' as 'product' | 'rental' | 'custom_service',
    parentId: '',
    iconUrl: '',
    sortOrder: 0,
    isActive: true,
  })
  const [formLoading, setFormLoading] = useState(false)

  const fetchData = useCallback(async (p: number, t: string, s: string, a: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<Category>>(
        '/admin/categories' + buildQuery({
          page: p,
          limit: 20,
          type: t || undefined,
          search: s || undefined,
          isActive: a === '' ? undefined : a === 'true',
        })
      )
      setCategories(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageChange = (p: number) => {
    setPage(p)
    void fetchData(p, typeFilter, search, activeFilter)
  }

  const handleFilter = () => {
    setPage(1)
    void fetchData(1, typeFilter, search, activeFilter)
  }

  const handleCreate = async () => {
    setFormLoading(true)
    setError(null)
    try {
      await clientPost('/admin/categories', {
        ...formData,
        parentId: formData.parentId || undefined,
        iconUrl: formData.iconUrl || undefined,
      })
      setCreateModal(false)
      resetForm()
      void fetchData(page, typeFilter, search, activeFilter)
    } catch {
      setError('Failed to create category.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editCategory) return
    setFormLoading(true)
    setError(null)
    try {
      await clientPatch(`/admin/categories/${editCategory.id}`, {
        ...formData,
        parentId: formData.parentId || null,
        iconUrl: formData.iconUrl || undefined,
      })
      setEditCategory(null)
      resetForm()
      void fetchData(page, typeFilter, search, activeFilter)
    } catch {
      setError('Failed to update category.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setFormLoading(true)
    setError(null)
    try {
      await clientDelete(`/admin/categories/${deleteConfirm.id}`)
      setDeleteConfirm(null)
      void fetchData(page, typeFilter, search, activeFilter)
    } catch {
      setError('Failed to delete category.')
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      type: 'product',
      parentId: '',
      iconUrl: '',
      sortOrder: 0,
      isActive: true,
    })
  }

  const openEdit = (category: Category) => {
    setEditCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      type: category.type as any,
      parentId: category.parentId || '',
      iconUrl: category.iconUrl || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Type</label>
          <Select
            options={[
              { label: 'All Types', value: '' },
              { label: 'Product', value: 'product' },
              { label: 'Rental', value: 'rental' },
              { label: 'Custom Service', value: 'custom_service' },
            ]}
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setTypeFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
          <Select
            options={[
              { label: 'All Status', value: '' },
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
            value={activeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setActiveFilter(e.target.value) }}
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Search</label>
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value) }}
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Apply Filters</Button>
        <Button size="sm" onClick={() => { setCreateModal(true); resetForm() }}>New Category</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {loading && <div className="flex justify-center p-8"><Spinner /></div>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {category.iconUrl && (
                      <img src={category.iconUrl} alt="" className="h-6 w-6 rounded object-cover" />
                    )}
                    <span className="font-medium">{category.name}</span>
                    {category.children && category.children.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{String(category.children.length)} children</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{category.slug}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{category.type.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{category.parentId || '-'}</TableCell>
                <TableCell className="text-sm">{category.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? 'success' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(category.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(category)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(category)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{String(total)} total categories</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        open={createModal || editCategory !== null} 
        onClose={() => { setCreateModal(false); setEditCategory(null); resetForm() }} 
        title={editCategory ? 'Edit Category' : 'New Category'} 
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Category name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Slug</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="category-slug"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Type</label>
            <Select
              options={[
                { label: 'Product', value: 'product' },
                { label: 'Rental', value: 'rental' },
                { label: 'Custom Service', value: 'custom_service' },
              ]}
              value={formData.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value as any })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Parent Category ID</label>
            <Input
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              placeholder="Leave empty for root category"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Icon URL</label>
            <Input
              value={formData.iconUrl}
              onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Sort Order</label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            <label className="text-sm">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setCreateModal(false); setEditCategory(null); resetForm() }}>Cancel</Button>
            <Button onClick={() => editCategory ? handleUpdate() : handleCreate()} disabled={formLoading}>
              {formLoading ? 'Saving...' : (editCategory ? 'Update' : 'Create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        open={deleteConfirm !== null} 
        onClose={() => setDeleteConfirm(null)} 
        title="Delete Category" 
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm">Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action will soft-delete the category.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={formLoading}>
              {formLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
