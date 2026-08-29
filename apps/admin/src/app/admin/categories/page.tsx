'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import {
  fetchAdminTaxonomyCategories,
  fetchAdminTaxonomyAttributes,
  fetchAdminRegionalHubs,
  createAdminTaxonomyCategory,
  updateAdminTaxonomyCategory,
  deleteAdminTaxonomyCategory,
  createAdminTaxonomyAttribute,
  updateAdminTaxonomyAttribute,
  deleteAdminTaxonomyAttribute,
  createAdminRegionalHub,
  updateAdminRegionalHub,
  deleteAdminRegionalHub,
  type AdminTaxonomyCategory,
  type AdminTaxonomyAttribute,
  type AdminRegionalHub,
} from '@/lib/adminApi'

type TabType = 'categories' | 'attributes' | 'sub-cities' | 'localization'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminTaxonomyCategory[]>([])
  const [attributes, setAttributes] = useState<AdminTaxonomyAttribute[]>([])
  const [regionalHubs, setRegionalHubs] = useState<AdminRegionalHub[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('categories')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<'category' | 'attribute' | 'hub'>('category')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, attributesData, hubsData] = await Promise.all([
          fetchAdminTaxonomyCategories(),
          fetchAdminTaxonomyAttributes(),
          fetchAdminRegionalHubs(),
        ])
        setCategories(categoriesData.data || [])
        setAttributes(attributesData.data || [])
        setRegionalHubs(hubsData.data || [])
      } catch (error) {
        console.error('Failed to load taxonomies:', error)
        showToast('Failed to load data', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = (type: 'category' | 'attribute' | 'hub') => {
    setEditingItem(null)
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleEdit = (item: any, type: 'category' | 'attribute' | 'hub') => {
    setEditingItem(item)
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, type: 'category' | 'attribute' | 'hub') => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      if (type === 'category') {
        await deleteAdminTaxonomyCategory(id)
        setCategories(categories.filter(c => c.id !== id))
      } else if (type === 'attribute') {
        await deleteAdminTaxonomyAttribute(id)
        setAttributes(attributes.filter(a => a.id !== id))
      } else if (type === 'hub') {
        await deleteAdminRegionalHub(id)
        setRegionalHubs(regionalHubs.filter(h => h.id !== id))
      }
      showToast('Item deleted successfully', 'success')
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Failed to delete item', 'error')
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        // Update
        if (modalType === 'category') {
          const updated = await updateAdminTaxonomyCategory(editingItem.id, data)
          setCategories(categories.map(c => c.id === editingItem.id ? updated.data : c))
        } else if (modalType === 'attribute') {
          const updated = await updateAdminTaxonomyAttribute(editingItem.id, data)
          setAttributes(attributes.map(a => a.id === editingItem.id ? updated.data : a))
        } else if (modalType === 'hub') {
          const updated = await updateAdminRegionalHub(editingItem.id, data)
          setRegionalHubs(regionalHubs.map(h => h.id === editingItem.id ? updated.data : h))
        }
        showToast('Item updated successfully', 'success')
      } else {
        // Create
        if (modalType === 'category') {
          const created = await createAdminTaxonomyCategory(data)
          setCategories([...categories, created.data])
        } else if (modalType === 'attribute') {
          const created = await createAdminTaxonomyAttribute(data)
          setAttributes([...attributes, created.data])
        } else if (modalType === 'hub') {
          const created = await createAdminRegionalHub(data)
          setRegionalHubs([...regionalHubs, created.data])
        }
        showToast('Item created successfully', 'success')
      }
      setIsModalOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Save error:', error)
      showToast('Failed to save item', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Taxonomy & Localization Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👗 Fashion Categories
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeTab === 'attributes'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🧵 Traditional Attributes
        </button>
        <button
          onClick={() => setActiveTab('sub-cities')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeTab === 'sub-cities'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📍 Sub-Cities & Hubs
        </button>
        <button
          onClick={() => setActiveTab('localization')}
          className={`px-4 py-2 whitespace-nowrap ${
            activeTab === 'localization'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🌐 Localization Strings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => handleCreate('category')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Category
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (EN)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (AM)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{category.nameAm || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{category.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{category.parent?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => handleEdit(category, 'category')} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                      <button onClick={() => handleDelete(category.id, 'category')} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'attributes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => handleCreate('attribute')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Attribute
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (EN)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (AM)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Values</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attributes.map((attribute) => (
                  <tr key={attribute.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{attribute.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{attribute.nameAm || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{attribute.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{attribute.values.map((v) => v.value).join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        attribute.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {attribute.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => handleEdit(attribute, 'attribute')} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                      <button onClick={() => handleDelete(attribute.id, 'attribute')} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sub-cities' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => handleCreate('hub')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Regional Hub
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (EN)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (AM)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popular</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {regionalHubs.map((hub) => (
                  <tr key={hub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{hub.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{hub.nameAm || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{hub.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{hub.city || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hub.isPopular && <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Popular</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        hub.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {hub.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => handleEdit(hub, 'hub')} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                      <button onClick={() => handleDelete(hub.id, 'hub')} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'localization' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Bilingual Localization Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Categories</h3>
              <p className="text-2xl font-bold text-blue-700">{categories.length}</p>
              <p className="text-sm text-blue-600">{categories.filter(c => c.nameAm).length} with Amharic</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">Attributes</h3>
              <p className="text-2xl font-bold text-green-700">{attributes.length}</p>
              <p className="text-sm text-green-600">{attributes.filter(a => a.nameAm).length} with Amharic</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900">Regional Hubs</h3>
              <p className="text-2xl font-bold text-purple-700">{regionalHubs.length}</p>
              <p className="text-sm text-purple-600">{regionalHubs.filter(h => h.nameAm).length} with Amharic</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Use the other tabs to add and edit bilingual content. Every category, attribute, and regional hub supports both English and Amharic translations.
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <BilingualModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          item={editingItem}
          type={modalType}
          categories={categories}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

function BilingualModal({ isOpen, onClose, onSave, item, type, categories }: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  item: any
  type: 'category' | 'attribute' | 'hub'
  categories: AdminTaxonomyCategory[]
}) {
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (item) {
      setFormData(item)
    } else {
      setFormData({})
    }
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {item ? 'Edit' : 'Add'} {type === 'category' ? 'Category' : type === 'attribute' ? 'Attribute' : 'Regional Hub'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* English Column */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 border-b pb-2">English</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {type === 'category' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">None</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type || 'product'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="product">Product</option>
                      <option value="rental">Rental</option>
                      <option value="custom_service">Custom Service</option>
                    </select>
                  </div>
                </>
              )}

              {type === 'attribute' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type || 'custom'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="size">Size</option>
                      <option value="color">Color</option>
                      <option value="material">Material</option>
                      <option value="brand">Brand</option>
                      <option value="custom">Custom</option>
                      <option value="weaving_pattern">Weaving Pattern</option>
                      <option value="fabric_type">Fabric Type</option>
                      <option value="embroidery_style">Embroidery Style</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {type === 'hub' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type || 'sub_city'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="sub_city">Sub-City</option>
                      <option value="district">District</option>
                      <option value="neighborhood">Neighborhood</option>
                      <option value="market_area">Market Area</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates (lat,lng)</label>
                    <input
                      type="text"
                      value={formData.coordinates || ''}
                      onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="8.9639, 38.7432"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Amharic Column */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 border-b pb-2">አማርኛ (Amharic)</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Amharic)</label>
                <input
                  type="text"
                  value={formData.nameAm || ''}
                  onChange={(e) => setFormData({ ...formData, nameAm: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  dir="rtl"
                />
              </div>

              {type === 'category' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Amharic)</label>
                    <input
                      type="text"
                      value={formData.slugAm || ''}
                      onChange={(e) => setFormData({ ...formData, slugAm: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Amharic)</label>
                    <textarea
                      value={formData.descriptionAm || ''}
                      onChange={(e) => setFormData({ ...formData, descriptionAm: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </>
              )}

              {type === 'attribute' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Amharic)</label>
                  <textarea
                    value={formData.descriptionAm || ''}
                    onChange={(e) => setFormData({ ...formData, descriptionAm: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    dir="rtl"
                  />
                </div>
              )}

              {type === 'hub' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City (Amharic)</label>
                    <input
                      type="text"
                      value={formData.cityAm || ''}
                      onChange={(e) => setFormData({ ...formData, cityAm: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Amharic)</label>
                    <textarea
                      value={formData.descriptionAm || ''}
                      onChange={(e) => setFormData({ ...formData, descriptionAm: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Common Fields */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder || 0}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              {type === 'hub' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPopular || false}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Popular</span>
                </label>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
