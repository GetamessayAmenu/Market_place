'use client'

import { useState, useEffect } from 'react'
import {
  fetchHomepageFeaturedListings,
  addHomepageFeaturedListing,
  removeHomepageFeaturedListing,
  reorderHomepageFeaturedListings,
  fetchAdminListings,
  type HomepageFeaturedListing,
  type AdminListing,
} from '@/lib/adminApi'
import { Button, Modal, useToast } from '@marketplace/ui'

export default function FeaturedListingsManagement() {
  const [featuredListings, setFeaturedListings] = useState<HomepageFeaturedListing[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableListings, setAvailableListings] = useState<AdminListing[]>([])
  const [searching, setSearching] = useState(false)
  const [draggedItem, setDraggedItem] = useState<HomepageFeaturedListing | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    loadFeaturedListings()
  }, [])

  const loadFeaturedListings = async () => {
    try {
      setLoading(true)
      const res = await fetchHomepageFeaturedListings()
      setFeaturedListings(res.data || [])
    } catch (err) {
      console.error('Failed to load featured listings:', err)
      addToast({
        title: 'Error',
        description: 'Failed to load featured listings',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = async () => {
    setShowAddModal(true)
    searchListings('')
  }

  const searchListings = async (query: string) => {
    try {
      setSearching(true)
      const res = await fetchAdminListings({ status: 'active', search: query, limit: 20 })
      setAvailableListings(res.data || [])
    } catch (err) {
      console.error('Failed to search listings:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleAddListing = async (listing: AdminListing) => {
    try {
      await addHomepageFeaturedListing(listing.id, featuredListings.length + 1)
      addToast({
        title: 'Success',
        description: `Listing "${listing.title}" featured on homepage`,
        variant: 'success',
      })
      setShowAddModal(false)
      loadFeaturedListings()
    } catch (err: any) {
      console.error('Failed to feature listing:', err)
      addToast({
        title: 'Cannot Feature Listing',
        description: err.message || 'Listing could not be featured',
        variant: 'error',
      })
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await removeHomepageFeaturedListing(id)
      addToast({
        title: 'Removed',
        description: 'Listing removed from featured section',
        variant: 'success',
      })
      loadFeaturedListings()
    } catch (err) {
      console.error('Failed to remove featured listing:', err)
      addToast({
        title: 'Error',
        description: 'Failed to remove featured listing',
        variant: 'error',
      })
    }
  }

  const handleDragStart = (item: HomepageFeaturedListing) => {
    setDraggedItem(item)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetItem: HomepageFeaturedListing) => {
    if (!draggedItem || draggedItem.id === targetItem.id) return

    const newItems = [...featuredListings]
    const draggedIdx = newItems.findIndex((i) => i.id === draggedItem.id)
    const targetIdx = newItems.findIndex((i) => i.id === targetItem.id)

    if (draggedIdx === -1 || targetIdx === -1) return

    newItems.splice(draggedIdx, 1)
    newItems.splice(targetIdx, 0, draggedItem)

    setFeaturedListings(newItems)
    const itemIds = newItems.map((i) => i.id)

    try {
      await reorderHomepageFeaturedListings(itemIds)
      addToast({ title: 'Reordered', description: 'Featured listings order updated', variant: 'success' })
    } catch (err) {
      console.error('Failed to reorder featured listings:', err)
      loadFeaturedListings()
    } finally {
      setDraggedItem(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Featured Listings</h2>
          <p className="text-sm text-muted-foreground">
            Explicitly feature active, approved marketplace listings on the homepage.
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Feature a Listing
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">Loading featured listings...</div>
      ) : featuredListings.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <p className="text-muted-foreground">No featured listings added yet.</p>
          <Button variant="outline" onClick={handleOpenAddModal}>Select listings to feature</Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {featuredListings.map((item, idx) => {
            const listing = item.listing
            const imageUrl = listing?.images?.[0]?.url || listing?.primaryImageUrl

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
                  <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden border">
                    {imageUrl ? (
                      <img src={imageUrl} alt={listing?.title || 'Listing'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{listing?.title || 'Listing'}</p>
                    <p className="text-xs font-bold text-primary mt-0.5">${listing?.price}</p>
                    {listing?.seller?.displayName && (
                      <p className="text-xs text-muted-foreground truncate">Seller: {listing.seller.displayName}</p>
                    )}
                    <span className="inline-block text-[10px] uppercase font-semibold text-muted-foreground mt-1">
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

      {/* Add Featured Listing Modal */}
      {showAddModal && (
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Select Active Listing to Feature">
          <div className="space-y-4 mt-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchListings(e.target.value)
                }}
                placeholder="Search approved active listings by title..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            {searching ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Searching listings...</div>
            ) : availableListings.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No active public listings found matching search.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y border rounded-lg">
                {availableListings.map((listing) => (
                  <div key={listing.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0 border">
                        {listing.primaryImageUrl ? (
                          <img src={listing.primaryImageUrl} alt={listing.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">${listing.price} &bull; {listing.city || 'Addis Ababa'}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAddListing(listing)}>
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
