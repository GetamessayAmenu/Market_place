'use client'

import { useState, useEffect } from 'react'
import {
  fetchHomepageFeaturedSellers,
  addHomepageFeaturedSeller,
  removeHomepageFeaturedSeller,
  reorderHomepageFeaturedSellers,
  fetchAdminUsers,
  type HomepageFeaturedSeller,
  type AdminUser,
} from '@/lib/adminApi'
import { Button, Modal, useToast } from '@marketplace/ui'

export default function FeaturedSellersManagement() {
  const [featuredSellers, setFeaturedSellers] = useState<HomepageFeaturedSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableSellers, setAvailableSellers] = useState<AdminUser[]>([])
  const [searching, setSearching] = useState(false)
  const [draggedItem, setDraggedItem] = useState<HomepageFeaturedSeller | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    loadFeaturedSellers()
  }, [])

  const loadFeaturedSellers = async () => {
    try {
      setLoading(true)
      const res = await fetchHomepageFeaturedSellers()
      setFeaturedSellers(res.data || [])
    } catch (err) {
      console.error('Failed to load featured sellers:', err)
      addToast({
        title: 'Error',
        description: 'Failed to load featured sellers',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = async () => {
    setShowAddModal(true)
    searchSellers('')
  }

  const searchSellers = async (query: string) => {
    try {
      setSearching(true)
      const res = await fetchAdminUsers({ status: 'active', search: query, limit: 20 })
      setAvailableSellers(res.data || [])
    } catch (err) {
      console.error('Failed to search sellers:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleAddSeller = async (seller: AdminUser) => {
    try {
      await addHomepageFeaturedSeller(seller.id, featuredSellers.length + 1)
      addToast({
        title: 'Success',
        description: `Seller "${seller.displayName || seller.email}" featured on homepage`,
        variant: 'success',
      })
      setShowAddModal(false)
      loadFeaturedSellers()
    } catch (err: any) {
      console.error('Failed to feature seller:', err)
      addToast({
        title: 'Cannot Feature Seller',
        description: err.message || 'Seller could not be featured',
        variant: 'error',
      })
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await removeHomepageFeaturedSeller(id)
      addToast({
        title: 'Removed',
        description: 'Seller removed from featured section',
        variant: 'success',
      })
      loadFeaturedSellers()
    } catch (err) {
      console.error('Failed to remove featured seller:', err)
      addToast({
        title: 'Error',
        description: 'Failed to remove featured seller',
        variant: 'error',
      })
    }
  }

  const handleDragStart = (item: HomepageFeaturedSeller) => {
    setDraggedItem(item)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetItem: HomepageFeaturedSeller) => {
    if (!draggedItem || draggedItem.id === targetItem.id) return

    const newItems = [...featuredSellers]
    const draggedIdx = newItems.findIndex((i) => i.id === draggedItem.id)
    const targetIdx = newItems.findIndex((i) => i.id === targetItem.id)

    if (draggedIdx === -1 || targetIdx === -1) return

    newItems.splice(draggedIdx, 1)
    newItems.splice(targetIdx, 0, draggedItem)

    setFeaturedSellers(newItems)
    const itemIds = newItems.map((i) => i.id)

    try {
      await reorderHomepageFeaturedSellers(itemIds)
      addToast({ title: 'Reordered', description: 'Featured sellers order updated', variant: 'success' })
    } catch (err) {
      console.error('Failed to reorder featured sellers:', err)
      loadFeaturedSellers()
    } finally {
      setDraggedItem(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Featured Sellers & Designers</h2>
          <p className="text-sm text-muted-foreground">
            Highlight verified Ethiopian designers and popular boutiques on the homepage spotlight.
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Feature a Seller
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">Loading featured sellers...</div>
      ) : featuredSellers.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No featured sellers added yet.</p>
          <Button variant="outline" onClick={handleOpenAddModal}>Select sellers to feature</Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {featuredSellers.map((item, idx) => {
            const seller = item.seller
            const name = seller?.displayName || seller?.email || 'Seller'

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(item)}
                className={`rounded-xl border bg-card overflow-hidden shadow-sm p-4 flex gap-4 items-center justify-between cursor-move ${
                  draggedItem?.id === item.id ? 'opacity-50 border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border flex-shrink-0">
                    {seller?.avatarUrl ? (
                      <img src={seller.avatarUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{seller?.location || 'Addis Ababa'}</p>
                    <span className="inline-block text-[10px] uppercase font-semibold text-muted-foreground mt-0.5">
                      Order: #{idx + 1}
                    </span>
                  </div>
                </div>

                <Button variant="destructive" size="sm" onClick={() => handleRemove(item.id)}>
                  Remove
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Featured Seller Modal */}
      {showAddModal && (
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Select Active Seller to Feature">
          <div className="space-y-4 mt-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchSellers(e.target.value)
                }}
                placeholder="Search active designers or sellers by name/email..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            {searching ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Searching sellers...</div>
            ) : availableSellers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No active sellers found matching search.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y border rounded-lg">
                {availableSellers.map((seller) => (
                  <div key={seller.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden flex-shrink-0">
                        {seller.avatarUrl ? (
                          <img src={seller.avatarUrl} alt={seller.displayName || seller.email} className="h-full w-full object-cover" />
                        ) : (
                          (seller.displayName || seller.email).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{seller.displayName || seller.email}</p>
                        <p className="text-xs text-muted-foreground">{seller.email}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAddSeller(seller)}>
                      Add Feature
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
