'use client'

import { useState } from 'react'
import { cn } from '@marketplace/ui'

// Simple SVG icon components
const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 6H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m5-4v12" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

export interface FabricInspectionItem {
  id: string
  name: string
  category: 'Menen' | 'Saba' | 'Tilf' | 'General'
  checked: boolean
  notes?: string
}

const DEFAULT_INSPECTION_ITEMS: FabricInspectionItem[] = [
  { id: '1', name: 'Menen fabric integrity', category: 'Menen', checked: false },
  { id: '2', name: 'Menen embroidery condition', category: 'Menen', checked: false },
  { id: '3', name: 'Saba weave patterns', category: 'Saba', checked: false },
  { id: '4', name: 'Saba color consistency', category: 'Saba', checked: false },
  { id: '5', name: 'Tilf embroidery threads', category: 'Tilf', checked: false },
  { id: '6', name: 'Tilf pattern alignment', category: 'Tilf', checked: false },
  { id: '7', name: 'Overall fabric cleanliness', category: 'General', checked: false },
  { id: '8', name: 'Missing beads/sequins', category: 'General', checked: false },
  { id: '9', name: 'Loose threads', category: 'General', checked: false },
  { id: '10', name: 'Stains or discoloration', category: 'General', checked: false },
]

export interface ConditionLoggerProps {
  bookingId: string
  logType: 'PRE_HANDOVER' | 'POST_RETURN'
  onSave: (data: { photoUrls: string[]; notes: string; inspectionItems: FabricInspectionItem[] }) => void
  onCancel: () => void
  className?: string
}

export default function ConditionLogger({
  bookingId,
  logType,
  onSave,
  onCancel,
  className,
}: ConditionLoggerProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [inspectionItems, setInspectionItems] = useState<FabricInspectionItem[]>(DEFAULT_INSPECTION_ITEMS)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    try {
      // TODO: Implement Cloudinary upload
      // const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file))
      // const uploadedUrls = await Promise.all(uploadPromises)
      // setPhotos(prev => [...prev, ...uploadedUrls])
      
      // Mock upload for demo
      const mockUrls = Array.from(files).map((_, i) => `https://via.placeholder.com/150?img=${i + 1}`)
      setPhotos((prev) => [...prev, ...mockUrls])
    } catch (error) {
      console.error('Failed to upload photos:', error)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleInspectionItem = (id: string) => {
    setInspectionItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const updateInspectionNotes = (id: string, notes: string) => {
    setInspectionItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, notes } : item
      )
    )
  }

  const handleSave = () => {
    if (photos.length === 0) {
      alert('Please add at least one photo')
      return
    }

    onSave({
      photoUrls: photos,
      notes,
      inspectionItems,
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Menen':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'Saba':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Tilf':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const title = logType === 'PRE_HANDOVER' ? 'Pre-Handover Condition Log' : 'Post-Return Condition Log'
  const description = logType === 'PRE_HANDOVER'
    ? 'Document the condition of the item before handover to protect both parties'
    : 'Document the condition of the returned item for deposit refund assessment'

  return (
    <div className={cn('rounded-lg border bg-card shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 p-6">
        <div>
          <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-brand-gold" />
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-lg p-2 hover:bg-accent transition-colors"
        >
          <XIcon className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Photo Upload Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-card-foreground flex items-center gap-2">
            <CameraIcon className="h-4 w-4" />
            Fabric Inspection Photos
          </h3>
          
          <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-brand-gold/50 transition-colors">
            <input
              type="file"
              id="photo-upload"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer inline-flex flex-col items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-gold border-r-transparent" />
                  <span className="text-sm text-muted-foreground">Uploading photos...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">
                    Click to upload photos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB each
                  </span>
                </>
              )}
            </label>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Inspection photo ${index + 1}`}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 rounded-full bg-destructive/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XIcon className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Traditional Fabric Inspection Checklist */}
        <div className="space-y-3">
          <h3 className="font-semibold text-card-foreground flex items-center gap-2">
            <CheckIcon className="h-4 w-4" />
            Traditional Fabric Inspection Checklist
          </h3>
          
          <div className="space-y-3">
            {['Menen', 'Saba', 'Tilf', 'General'].map((category) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground capitalize">{category}</h4>
                <div className="space-y-2">
                  {inspectionItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                          item.checked ? 'bg-green-50 border-green-200' : 'bg-accent border-border'
                        )}
                      >
                        <button
                          onClick={() => toggleInspectionItem(item.id)}
                          className={cn(
                            'mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition-colors',
                            item.checked
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-input bg-background hover:border-brand-gold'
                          )}
                        >
                          {item.checked && <CheckIcon className="h-3 w-3" />}
                        </button>
                        <div className="flex-1">
                          <label
                            htmlFor={`item-${item.id}`}
                            className="text-sm font-medium text-card-foreground cursor-pointer"
                          >
                            {item.name}
                          </label>
                          <input
                            id={`item-${item.id}`}
                            type="text"
                            placeholder="Add notes (optional)"
                            value={item.notes || ''}
                            onChange={(e) => updateInspectionNotes(item.id, e.target.value)}
                            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                          />
                        </div>
                        {!item.checked && (
                          <AlertCircleIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Notes */}
        <div className="space-y-3">
          <h3 className="font-semibold text-card-foreground">Additional Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document any additional observations, special handling instructions, or concerns about the fabric condition..."
            rows={4}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-input bg-accent px-4 py-2 font-medium text-card-foreground transition-colors hover:bg-accent/80"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={photos.length === 0}
            className={cn(
              'flex-1 rounded-lg bg-brand-gold px-4 py-2 font-medium text-white transition-colors',
              photos.length === 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-brand-gold/90'
            )}
          >
            Save Condition Log
          </button>
        </div>
      </div>
    </div>
  )
}
