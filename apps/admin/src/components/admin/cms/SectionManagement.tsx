'use client'

import { useState, useEffect } from 'react'
import {
  fetchHomepageSections,
  updateHomepageSection,
  reorderHomepageSections,
  type HomepageSection,
} from '@/lib/adminApi'
import { Button, Modal, useToast } from '@marketplace/ui'

export default function SectionManagement() {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  const [draggedSection, setDraggedSection] = useState<HomepageSection | null>(null)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    isEnabled: true,
    sortOrder: 0,
    itemCount: 8,
    contentSource: 'automatic' as 'automatic' | 'manual',
    manualItemIdsStr: '',
  })

  useEffect(() => {
    loadSections()
  }, [])

  const loadSections = async () => {
    try {
      setLoading(true)
      const res = await fetchHomepageSections()
      setSections(res.data || [])
    } catch (err) {
      console.error('Failed to load sections:', err)
      addToast({
        title: 'Error',
        description: 'Failed to load homepage sections',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (section: HomepageSection) => {
    try {
      await updateHomepageSection(section.id, { isEnabled: !section.isEnabled })
      addToast({
        title: 'Status Updated',
        description: `Section "${section.title}" is now ${!section.isEnabled ? 'enabled' : 'disabled'}`,
        variant: 'success',
      })
      loadSections()
    } catch (err) {
      console.error('Failed to toggle section:', err)
      addToast({
        title: 'Error',
        description: 'Failed to update section status',
        variant: 'error',
      })
    }
  }

  const handleOpenEdit = (section: HomepageSection) => {
    setEditingSection(section)
    setFormData({
      title: section.title || '',
      subtitle: section.subtitle || '',
      isEnabled: section.isEnabled,
      sortOrder: section.sortOrder,
      itemCount: section.itemCount || 8,
      contentSource: section.contentSource || 'automatic',
      manualItemIdsStr: (section.manualItemIds || []).join(', '),
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSection) return

    const manualIds = formData.manualItemIdsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      await updateHomepageSection(editingSection.id, {
        title: formData.title,
        subtitle: formData.subtitle,
        isEnabled: formData.isEnabled,
        sortOrder: formData.sortOrder,
        itemCount: formData.itemCount,
        contentSource: formData.contentSource,
        manualItemIds: manualIds,
      })
      addToast({
        title: 'Success',
        description: 'Section settings updated',
        variant: 'success',
      })
      setEditingSection(null)
      loadSections()
    } catch (err) {
      console.error('Failed to save section settings:', err)
      addToast({
        title: 'Error',
        description: 'Failed to save section settings',
        variant: 'error',
      })
    }
  }

  const handleDragStart = (section: HomepageSection) => {
    setDraggedSection(section)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetSection: HomepageSection) => {
    if (!draggedSection || draggedSection.id === targetSection.id) return

    const newSections = [...sections]
    const draggedIdx = newSections.findIndex((s) => s.id === draggedSection.id)
    const targetIdx = newSections.findIndex((s) => s.id === targetSection.id)

    if (draggedIdx === -1 || targetIdx === -1) return

    newSections.splice(draggedIdx, 1)
    newSections.splice(targetIdx, 0, draggedSection)

    setSections(newSections)
    const itemIds = newSections.map((s) => s.id)

    try {
      await reorderHomepageSections(itemIds)
      addToast({
        title: 'Reordered',
        description: 'Homepage section sequence saved',
        variant: 'success',
      })
    } catch (err) {
      console.error('Failed to reorder sections:', err)
      loadSections()
    } finally {
      setDraggedSection(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Homepage Sections & Layout</h2>
          <p className="text-sm text-muted-foreground">
            Configure visibility, custom section headings, item limits, content source, and display order.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">Loading sections...</div>
      ) : sections.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          No homepage sections found.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 w-10">Order</th>
                <th className="px-4 py-3">Section Key</th>
                <th className="px-4 py-3">Display Title</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Item Count</th>
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sections.map((section, idx) => (
                <tr
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(section)}
                  className={`hover:bg-muted/40 transition cursor-move ${
                    draggedSection?.id === section.id ? 'opacity-50 bg-muted' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-muted-foreground flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6h16.5" />
                    </svg>
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{section.sectionKey}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{section.title}</p>
                    {section.subtitle && <p className="text-xs text-muted-foreground">{section.subtitle}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        section.contentSource === 'manual'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}
                    >
                      {section.contentSource === 'manual' ? 'Manual Selection' : 'Automatic'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{section.itemCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(section)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        section.isEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          section.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(section)}>
                      Configure
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <Modal
          open={!!editingSection}
          onClose={() => setEditingSection(null)}
          title={`Configure Section: ${editingSection.sectionKey}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Section Heading Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Content Source</label>
                <select
                  value={formData.contentSource}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contentSource: e.target.value as 'automatic' | 'manual',
                    }))
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="automatic">Automatic Query</option>
                  <option value="manual">Manual Item Selection</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Max Display Items</label>
                <input
                  type="number"
                  value={formData.itemCount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, itemCount: Number(e.target.value) }))}
                  min={1}
                  max={24}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {formData.contentSource === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Manual Item UUIDs (comma-separated)
                </label>
                <textarea
                  value={formData.manualItemIdsStr}
                  onChange={(e) => setFormData((prev) => ({ ...prev, manualItemIdsStr: e.target.value }))}
                  placeholder="e.g. uuid-1, uuid-2, uuid-3"
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Specify exact listing or seller UUIDs to display in manual mode.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={formData.isEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isEnabled" className="text-sm font-medium text-foreground">
                Enable section on homepage
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setEditingSection(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Section Settings</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
