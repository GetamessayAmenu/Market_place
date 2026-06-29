"use client"
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormInput, Spinner } from '@marketplace/ui';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  categorySchema,
  customMadeSettingsSchema,
  descriptionSchema,
  inventorySchema,
  listingSchema,
  listingTypeSchema,
  photosSchema,
  pricingSchema,
  rentalSettingsSchema,
  type ListingInput,
} from '../../../../lib/listingValidation';

type Step = 'type' | 'category' | 'photos' | 'description' | 'pricing' | 'inventory' | 'rental' | 'custom' | 'preview' | 'complete';

const steps: { key: Step; title: string; description: string; optional: boolean }[] = [
  { key: 'type', title: 'Listing Type', description: 'What type of product are you listing?', optional: false },
  { key: 'category', title: 'Category', description: 'Choose the right category for your product', optional: false },
  { key: 'photos', title: 'Photos', description: 'Add photos to showcase your product', optional: false },
  { key: 'description', title: 'Description', description: 'Tell buyers about your product', optional: false },
  { key: 'pricing', title: 'Pricing', description: 'Set your price and discounts', optional: false },
  { key: 'inventory', title: 'Inventory', description: 'Manage your stock levels', optional: false },
  { key: 'rental', title: 'Rental Settings', description: 'Configure rental options', optional: true },
  { key: 'custom', title: 'Custom-Made Settings', description: 'Set up custom order options', optional: true },
  { key: 'preview', title: 'Preview', description: 'Review your listing before publishing', optional: false },
];

const ethiopianCategories = [
  { id: 'clothing', name: 'Clothing & Fashion', icon: '👗', subcategories: ['Traditional Dresses', 'Modern Clothing', 'Shoes', 'Accessories'] },
  { id: 'electronics', name: 'Electronics', icon: '📱', subcategories: ['Phones', 'Computers', 'Audio', 'Accessories'] },
  { id: 'home', name: 'Home & Living', icon: '🏠', subcategories: ['Furniture', 'Decor', 'Kitchen', 'Bedding'] },
  { id: 'beauty', name: 'Beauty & Health', icon: '💄', subcategories: ['Skincare', 'Haircare', 'Makeup', 'Fragrances'] },
  { id: 'food', name: 'Food & Beverages', icon: '🍽️', subcategories: ['Spices', 'Coffee', 'Snacks', 'Traditional Foods'] },
  { id: 'art', name: 'Art & Crafts', icon: '🎨', subcategories: ['Paintings', 'Sculptures', 'Textiles', 'Handmade'] },
  { id: 'books', name: 'Books & Education', icon: '📚', subcategories: ['Textbooks', 'Fiction', 'Children', 'Educational'] },
  { id: 'sports', name: 'Sports & Fitness', icon: '⚽', subcategories: ['Equipment', 'Clothing', 'Accessories', 'Outdoor'] },
];

const listingTypes = [
  { type: 'sale' as const, title: 'For Sale', description: 'Sell your product directly to buyers', icon: '🏷️', popular: true },
  { type: 'rental' as const, title: 'For Rent', description: 'Rent out your product for a period of time', icon: '📅' },
  { type: 'custom' as const, title: 'Custom-Made', description: 'Create products made to order', icon: '✨' },
];

export default function NewListingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      listingType: 'sale',
      description: { condition: 'new' },
      pricing: { currency: 'ETB', negotiable: false },
      inventory: { trackInventory: true, stock: 1 },
      rentalSettings: { currency: 'ETB', minRentalDays: 1 },
      customMadeSettings: { currency: 'ETB', leadTimeDays: 7, requiresMeasurement: true },
    },
  });

  const listingType = watch('listingType');
  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const getCurrentSchema = () => {
    switch (currentStep) {
      case 'type':
        return listingTypeSchema;
      case 'category':
        return categorySchema;
      case 'photos':
        return photosSchema;
      case 'description':
        return descriptionSchema;
      case 'pricing':
        return pricingSchema;
      case 'inventory':
        return inventorySchema;
      case 'rental':
        return rentalSettingsSchema;
      case 'custom':
        return customMadeSettingsSchema;
      default:
        return listingTypeSchema;
    }
  };

  const handleNext = useCallback(async () => {
    const schema = getCurrentSchema();
    const currentData = {
      listingType: watch('listingType'),
      category: watch('category'),
      photos: { images: imageFiles, coverImageIndex },
      description: watch('description'),
      pricing: watch('pricing'),
      inventory: watch('inventory'),
      rentalSettings: watch('rentalSettings'),
      customMadeSettings: watch('customMadeSettings'),
    };

    try {
      schema.parse(currentData);
      const nextIndex = currentStepIndex + 1;
      
      // Skip rental/custom steps if not applicable
      if (steps[nextIndex]?.key === 'rental' && listingType !== 'rental') {
        setCurrentStep(steps[nextIndex + 1]?.key || 'preview');
      } else if (steps[nextIndex]?.key === 'custom' && listingType !== 'custom') {
        setCurrentStep(steps[nextIndex + 1]?.key || 'preview');
      } else if (nextIndex < steps.length && steps[nextIndex]) {
        setCurrentStep(steps[nextIndex].key);
      } else {
        await handlePublish();
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, [currentStep, currentStepIndex, watch, imageFiles, coverImageIndex, listingType]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0 && steps[prevIndex]) {
      setCurrentStep(steps[prevIndex].key);
    }
  }, [currentStepIndex]);

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Save listing via API
      // await createListing(data);
      
      setCurrentStep('complete');
    } catch (error) {
      console.error('Failed to publish listing:', error);
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    
    if (validFiles.length !== files.length) {
      alert('Some files were invalid. Please use JPG, PNG, or WebP under 10MB.');
    }
    
    setImageFiles((prev) => [...prev, ...validFiles].slice(0, 10));
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    if (coverImageIndex === index && index > 0) {
      setCoverImageIndex(0);
    } else if (coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  const handleSetCoverImage = (index: number) => {
    setCoverImageIndex(index);
  };

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Listing Published!</h2>
            <p className="text-muted-foreground">
              Your listing "{watch('description')?.title || ''}" is now live and visible to buyers.
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard/listings')} className="w-full">
              View My Listings
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/listings/new')} className="w-full">
              Add Another Listing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <h1 className="text-lg font-semibold">Create New Listing</h1>
            <div className="w-20" />
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</span>
              <span className="text-brand-gold font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-gold transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{steps[currentStepIndex]?.title}</h2>
            <p className="text-muted-foreground">{steps[currentStepIndex]?.description}</p>
          </div>

          {/* Step 1: Listing Type */}
          {currentStep === 'type' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listingTypes.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setValue('listingType', item.type)}
                  className={`
                    relative p-6 rounded-xl border-2 text-left transition-all
                    ${listingType === item.type 
                      ? 'border-brand-gold bg-brand-gold/5' 
                      : 'border-border hover:border-brand-gold/50'
                    }
                  `}
                >
                  {item.popular && (
                    <span className="absolute top-3 right-3 text-xs bg-brand-gold text-white px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Category */}
          {currentStep === 'category' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ethiopianCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`
                      p-4 rounded-lg border text-center transition-all
                      ${selectedCategory === cat.id 
                        ? 'border-brand-gold bg-brand-gold/5' 
                        : 'border-border hover:border-brand-gold/50'
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="text-sm font-medium text-foreground">{cat.name}</div>
                  </button>
                ))}
              </div>
              
              {selectedCategory && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">Subcategory</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ethiopianCategories.find((c) => c.id === selectedCategory)?.subcategories.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubCategory(sub)}
                        className={`
                          p-3 rounded-lg border text-sm transition-all
                          ${selectedSubCategory === sub 
                            ? 'border-brand-gold bg-brand-gold/5' 
                            : 'border-border hover:border-brand-gold/50'
                          }
                        `}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Photos */}
          {currentStep === 'photos' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-brand-gold/50 transition-colors">
                <input
                  type="file"
                  id="photos"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="photos" className="cursor-pointer">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-foreground mb-2">Upload photos</p>
                  <p className="text-xs text-muted-foreground mb-4">JPG, PNG, or WebP (max 10MB each, up to 10 photos)</p>
                  <Button variant="outline" size="sm" type="button">
                    Choose Files
                  </Button>
                </label>
              </div>

              {imageFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {imageFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`
                        relative aspect-square rounded-lg overflow-hidden border-2
                        ${index === coverImageIndex ? 'border-brand-gold' : 'border-border'}
                      `}
                    >
                      <img
                        src={file ? URL.createObjectURL(file) : ''}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === coverImageIndex && (
                        <div className="absolute top-2 left-2 bg-brand-gold text-white text-xs px-2 py-0.5 rounded">
                          Cover
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetCoverImage(index)}
                          className="p-2 bg-white rounded-full hover:bg-brand-gold hover:text-white transition-colors"
                          title="Set as cover"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-2 bg-white rounded-full hover:bg-destructive hover:text-white transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Photo tips</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Use good lighting and a clean background</li>
                  <li>• Show multiple angles and details</li>
                  <li>• First photo will be your cover image</li>
                  <li>• Use high-resolution images (minimum 800x800px)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Description */}
          {currentStep === 'description' && (
            <div className="space-y-4">
              <FormInput
                label="Product Title *"
                placeholder="e.g., Traditional Ethiopian Habesha Kemis - Navy Blue"
                {...register('description.title')}
                {...(errors.description?.title?.message !== undefined && { error: errors.description.title.message })}
              />
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
                <textarea
                  {...register('description.description')}
                  rows={5}
                  placeholder="Describe your product in detail. Include materials, size, condition, and any other relevant information..."
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 ${errors.description?.description ? 'border-destructive' : 'border-input'}`}
                />
                {errors.description?.description?.message !== undefined && (
                  <p className="text-xs text-destructive mt-1">{errors.description.description.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{watch('description.description')?.length || 0}/2000 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Condition</label>
                <select
                  {...register('description.condition')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="used">Used</option>
                </select>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Writing tips</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Be specific about materials and measurements</li>
                  <li>• Mention any flaws or wear honestly</li>
                  <li>• Include care instructions if applicable</li>
                  <li>• Use keywords buyers might search for</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 5: Pricing */}
          {currentStep === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Price (ETB) *</label>
                  <input
                    type="number"
                    {...register('pricing.price', { valueAsNumber: true })}
                    placeholder="0.00"
                    className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 ${errors.pricing?.price ? 'border-destructive' : 'border-input'}`}
                  />
                  {errors.pricing?.price?.message !== undefined && (
                    <p className="text-xs text-destructive mt-1">{errors.pricing.price.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Currency</label>
                  <select
                    {...register('pricing.currency')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="negotiable"
                  {...register('pricing.negotiable')}
                  className="w-4 h-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                />
                <label htmlFor="negotiable" className="text-sm text-foreground">
                  Price is negotiable
                </label>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Pricing tips</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Research similar products to set competitive prices</li>
                  <li>• Consider your costs and desired profit margin</li>
                  <li>• Round to clean numbers (e.g., 1,500 ETB instead of 1,487 ETB)</li>
                  <li>• Enable negotiable for higher-priced items</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 6: Inventory */}
          {currentStep === 'inventory' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Stock Quantity *</label>
                <input
                  type="number"
                  {...register('inventory.stock', { valueAsNumber: true })}
                  placeholder="1"
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 ${errors.inventory?.stock ? 'border-destructive' : 'border-input'}`}
                />
                {errors.inventory?.stock?.message !== undefined && (
                  <p className="text-xs text-destructive mt-1">{errors.inventory.stock.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trackInventory"
                  {...register('inventory.trackInventory')}
                  className="w-4 h-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  defaultChecked
                />
                <label htmlFor="trackInventory" className="text-sm text-foreground">
                  Track inventory (auto-hide when out of stock)
                </label>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Inventory tips</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Keep stock accurate to avoid overselling</li>
                  <li>• Set to 0 for made-to-order items</li>
                  <li>• Enable tracking for automatic stock management</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 7: Rental Settings */}
          {currentStep === 'rental' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Daily Rate (ETB) *</label>
                <input
                  type="number"
                  {...register('rentalSettings.dailyRate', { valueAsNumber: true })}
                  placeholder="0.00"
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 ${errors.rentalSettings?.dailyRate ? 'border-destructive' : 'border-input'}`}
                />
                {errors.rentalSettings?.dailyRate?.message !== undefined && (
                  <p className="text-xs text-destructive mt-1">{errors.rentalSettings.dailyRate.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Min Rental Days</label>
                  <input
                    type="number"
                    {...register('rentalSettings.minRentalDays', { valueAsNumber: true })}
                    placeholder="1"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Security Deposit (ETB)</label>
                  <input
                    type="number"
                    {...register('rentalSettings.securityDeposit', { valueAsNumber: true })}
                    placeholder="0.00"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Rental tips</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Set competitive daily rates based on market value</li>
                  <li>• Security deposit protects against damage</li>
                  <li>• Minimum rental days ensure profitability</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 8: Custom-Made Settings */}
          {currentStep === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Base Price (ETB) *</label>
                <input
                  type="number"
                  {...register('customMadeSettings.basePrice', { valueAsNumber: true })}
                  placeholder="0.00"
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 ${errors.customMadeSettings?.basePrice ? 'border-destructive' : 'border-input'}`}
                />
                {errors.customMadeSettings?.basePrice?.message !== undefined && (
                  <p className="text-xs text-destructive mt-1">{errors.customMadeSettings.basePrice.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Lead Time (Days)</label>
                  <input
                    type="number"
                    {...register('customMadeSettings.leadTimeDays', { valueAsNumber: true })}
                    placeholder="7"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Max Capacity/Month</label>
                  <input
                    type="number"
                    {...register('customMadeSettings.maxCapacityPerMonth', { valueAsNumber: true })}
                    placeholder="10"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresMeasurement"
                  {...register('customMadeSettings.requiresMeasurement')}
                  className="w-4 h-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  defaultChecked
                />
                <label htmlFor="requiresMeasurement" className="text-sm text-foreground">
                  Requires customer measurements
                </label>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-foreground">💡 Custom-made tips</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Be realistic about lead times</li>
                  <li>• Set capacity based on your production capability</li>
                  <li>• Clear communication prevents misunderstandings</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 9: Preview */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="aspect-video bg-background rounded-lg overflow-hidden">
                  {imageFiles.length > 0 && imageFiles[coverImageIndex] ? (
                    <img
                      src={URL.createObjectURL(imageFiles[coverImageIndex])}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image uploaded
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{watch('description.title') || 'Untitled'}</h3>
                  <p className="text-2xl font-bold text-brand-gold mt-2">
                    {watch('pricing.currency')} {watch('pricing.price') || 0}
                  </p>
                  {watch('pricing.negotiable') && (
                    <span className="text-sm text-muted-foreground">(Negotiable)</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {listingType === 'sale' && <span className="px-2 py-1 bg-brand-gold/10 text-brand-gold text-xs rounded">For Sale</span>}
                  {listingType === 'rental' && <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs rounded">For Rent</span>}
                  {listingType === 'custom' && <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-xs rounded">Custom-Made</span>}
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded capitalize">
                    {watch('description.condition')}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {watch('description.description') || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stock: {watch('inventory.stock') || 0}</span>
                  {listingType === 'rental' && (
                    <span className="text-muted-foreground">
                      Daily: {watch('rentalSettings.currency')} {watch('rentalSettings.dailyRate') || 0}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
                <p className="font-medium text-foreground mb-1">⚠️ Review before publishing</p>
                <p className="text-muted-foreground">
                  Make sure all information is accurate. You can edit your listing after publishing.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t mt-8">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" /> Publishing...
              </span>
            ) : currentStep === 'preview' ? (
              'Publish Listing'
            ) : (
              'Continue'
            )}
          </Button>
        </div>

        {/* Help Text */}
        {steps[currentStepIndex] && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Your progress is saved automatically. You can come back anytime.
          </p>
        )}
      </div>
    </div>
  );
}
