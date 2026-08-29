'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  createDisputeCategory,
  deleteDisputeCategory,
  fetchDisputeCategories,
  updateDisputeCategory,
  type AdminDisputeCategory,
} from '@/lib/adminApi';

export default function DisputeCategoriesPage() {
  const [categories, setCategories] = useState<AdminDisputeCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [nameAm, setNameAm] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDisputeCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setNameAm('');
    setSlug('');
    setDescription('');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setIsOpen(true);
  };

  const openEditModal = (cat: AdminDisputeCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setNameAm(cat.nameAm || '');
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setSortOrder(cat.sortOrder || 0);
    setIsActive(cat.isActive);
    setIsOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateDisputeCategory(editingId, {
          name: name.trim(),
          nameAm: nameAm.trim() || undefined,
          slug: slug.trim(),
          description: description.trim() || undefined,
          sortOrder,
          isActive,
        });
      } else {
        await createDisputeCategory({
          name: name.trim(),
          nameAm: nameAm.trim() || undefined,
          slug: slug.trim(),
          description: description.trim() || undefined,
          sortOrder,
          isActive,
        });
      }
      setIsOpen(false);
      await loadCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    try {
      await deleteDisputeCategory(id);
      await loadCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/disputes" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
              &larr; Dispute Center
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Dispute Categories</h1>
          <p className="text-sm text-gray-500">Configure dispute types for filing forms and resolution categorization.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          + Add Category
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No categories found. Click '+ Add Category' to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Amharic Name</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-800">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-gray-500">{cat.sortOrder}</td>
                    <td className="p-3 font-bold text-gray-900">{cat.name}</td>
                    <td className="p-3 text-gray-700">{cat.nameAm || '-'}</td>
                    <td className="p-3 font-mono text-gray-500">{cat.slug}</td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">{cat.description || '-'}</td>
                    <td className="p-3">
                      {cat.isActive ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">ACTIVE</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-500">INACTIVE</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="px-2 py-1 bg-gray-100 text-gray-800 font-semibold rounded hover:bg-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="px-2 py-1 bg-red-50 text-red-700 font-semibold rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Edit / Create Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              {editingId ? 'Edit Dispute Category' : 'Create Dispute Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Name (English)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Defective / Damaged Item"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Name (Amharic)</label>
                <input
                  type="text"
                  value={nameAm}
                  onChange={(e) => setNameAm(e.target.value)}
                  placeholder="e.g. ጉድለት ያለበት ዕቃ"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="defective-damaged-item"
                  className="w-full p-2 border rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief guidance for users selecting this category..."
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <label htmlFor="isActive" className="font-semibold text-gray-800">Is Active</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary/90"
                >
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
