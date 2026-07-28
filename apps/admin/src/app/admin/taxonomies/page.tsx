'use client'

import { useEffect, useState } from 'react'
import { fetchAdminTaxonomyCategories, fetchAdminTaxonomyAttributes, type AdminTaxonomyCategory, type AdminTaxonomyAttribute } from '@/lib/adminApi'

export default function TaxonomiesPage() {
  const [categories, setCategories] = useState<AdminTaxonomyCategory[]>([])
  const [attributes, setAttributes] = useState<AdminTaxonomyAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'attributes'>('categories')

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, attributesData] = await Promise.all([
          fetchAdminTaxonomyCategories(),
          fetchAdminTaxonomyAttributes(),
        ])
        setCategories(categoriesData.data)
        setAttributes(attributesData.data)
      } catch (error) {
        console.error('Failed to load taxonomies:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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
        <h1 className="text-2xl font-bold">Taxonomy & Categories</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 ${
            activeTab === 'categories'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`px-4 py-2 ${
            activeTab === 'attributes'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Attributes
        </button>
      </div>

      {activeTab === 'categories' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (Amharic)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {category.nameAm || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.parent?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category._count.listings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (Amharic)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Values</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attributes.map((attribute) => (
                <tr key={attribute.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {attribute.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {attribute.nameAm || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attribute.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attribute.values.map((v) => v.value).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      attribute.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {attribute.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
