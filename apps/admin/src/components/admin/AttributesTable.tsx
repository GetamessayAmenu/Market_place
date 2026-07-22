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

interface Attribute {
  id: string
  name: string
  type: string
  values: string[]
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

interface AttributesTableProps {
  initialData: PaginatedResponse<Attribute>
}

export default function AttributesTable({ initialData }: AttributesTableProps) {
  const [attributes, setAttributes] = useState(initialData.data)
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
  const [editAttribute, setEditAttribute] = useState<Attribute | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Attribute | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'size' as 'size' | 'color' | 'material' | 'brand' | 'custom',
    values: '',
    sortOrder: 0,
    isActive: true,
  })
  const [formLoading, setFormLoading] = useState(false)

  const fetchData = useCallback(async (p: number, t: string, s: string, a: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await clientGet<PaginatedResponse<Attribute>>(
        '/admin/attributes' + buildQuery({
          page: p,
          limit: 20,
          type: t || undefined,
          search: s || undefined,
          isActive: a === '' ? undefined : a === 'true',
        })
      )
      setAttributes(res.data)
      setTotalPages(res.meta.totalPages)
      setTotal(res.meta.total)
    } catch {
      setError('Failed to load attributes.')
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
      const values = formData.values.split(',').map(v => v.trim()).filter(v => v)
      await clientPost('/admin/attributes', {
        ...formData,
        values,
      })
      setCreateModal(false)
      resetForm()
      void fetchData(page, typeFilter, search, activeFilter)
    } catch {
      setError('Failed to create attribute.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editAttribute) return
    setFormLoading(true)
    setError(null)
    try {
      const values = formData.values.split(',').map(v => v.trim()).filter(v => v)
      await clientPatch(`/admin/attributes/${editAttribute.id}`, {
        ...formData,
        values,
      })
      setEditAttribute(null)
      resetForm()
      void fetchData(page, typeFilter, search, activeFilter)
    } catch {
      setError('Failed to update attribute.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setFormLoading(true)
    setError(null)
    try {
      await clientDelete(`/admin/attributes/${deleteConfirm.id}`)
      setDeleteConfirm(null)
      void fetchData(page, typeFilter, search, activeFilter)
    } catch {
      setError('Failed to delete attribute.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleReorder = async (id: string, newOrder: number) => {
    try {
      await clientPost(`/admin/attributes/${id}/reorder`, { newOrder })
      void fetchData(page, typeFilter, search, activeFilter)
    } catch {
      setError('Failed to reorder attribute.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'size',
      values: '',
      sortOrder: 0,
      isActive: true,
    })
  }

  const openEdit = (attribute: Attribute) => {
    setEditAttribute(attribute)
    setFormData({
      name: attribute.name,
      type: attribute.type as any,
      values: attribute.values.join(', '),
      sortOrder: attribute.sortOrder,
      isActive: attribute.isActive,
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
              { label: 'Size', value: 'size' },
              { label: 'Color', value: 'color' },
              { label: 'Material', value: 'material' },
              { label: 'Brand', value: 'brand' },
              { label: 'Custom', value: 'custom' },
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
            placeholder="Search attributes..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value) }}
            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button size="sm" onClick={handleFilter}>Apply Filters</Button>
        <Button size="sm" onClick={() => { setCreateModal(true); resetForm() }}>New Attribute</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {loading && <div className="flex justify-center p-8"><Spinner /></div>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Values</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && attributes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No attributes found.
                </TableCell>
              </TableRow>
            )}
            {attributes.map((attribute) => (
              <TableRow key={attribute.id}>
                <TableCell className="font-medium">{attribute.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{attribute.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {attribute.values.slice(0, 3).map((value, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px]">{value}</Badge>
                    ))}
                    {attribute.values.length > 3 && (
                      <Badge variant="secondary" className="text-[10px]">+{String(attribute.values.length - 3)}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-2">
                    <span>{attribute.sortOrder}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleReorder(attribute.id, attribute.sortOrder - 1)} disabled={attribute.sortOrder === 0}>
                      ↑
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleReorder(attribute.id, attribute.sortOrder + 1)}>
                      ↓
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={attribute.isActive ? 'success' : 'secondary'}>
                    {attribute.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(attribute.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(attribute)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(attribute)}>Delete</Button>
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
          <p className="text-sm text-muted-foreground">{String(total)} total attributes</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        open={createModal || editAttribute !== null} 
        onClose={() => { setCreateModal(false); setEditAttribute(null); resetForm() }} 
        title={editAttribute ? 'Edit Attribute' : 'New Attribute'} 
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Attribute name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Type</label>
            <Select
              options={[
                { label: 'Size', value: 'size' },
                { label: 'Color', value: 'color' },
                { label: 'Material', value: 'material' },
                { label: 'Brand', value: 'brand' },
                { label: 'Custom', value: 'custom' },
              ]}
              value={formData.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value as any })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Values (comma-separated)</label>
            <Input
              value={formData.values}
              onChange={(e) => setFormData({ ...formData, values: e.target.value })}
              placeholder="Small, Medium, Large"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter multiple values separated by commas</p>
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
            <Button variant="outline" onClick={() => { setCreateModal(false); setEditAttribute(null); resetForm() }}>Cancel</Button>
            <Button onClick={() => editAttribute ? handleUpdate() : handleCreate()} disabled={formLoading}>
              {formLoading ? 'Saving...' : (editAttribute ? 'Update' : 'Create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        open={deleteConfirm !== null} 
        onClose={() => setDeleteConfirm(null)} 
        title="Delete Attribute" 
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm">Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action will soft-delete the attribute.</p>
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
