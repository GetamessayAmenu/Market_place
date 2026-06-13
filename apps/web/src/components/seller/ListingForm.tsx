"use client"
import { Alert, Button, Card, CardContent, Checkbox, FormInput, FormSelect, FormTextarea, Select, Spinner } from '@marketplace/ui';
import React, { useCallback, useState } from 'react';

import { useCategories, type Category } from '../../hooks/useCategories';
import { useImageUpload, type UploadedImage } from '../../hooks/useSeller';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ListingFormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  city: string;
  condition: string;
  contactOptions: {
    showPhone: boolean;
    whatsapp: string;
    telegram: string;
    inAppMessaging: boolean;
  };
  images: UploadedImage[];
}

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  onSubmit: (data: ListingFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  error?: string | null;
}

const CONDITIONS = [
  { value: '', label: 'Select condition' },
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const STEPS = ['Details', 'Photos', 'Contact', 'Review'] as const;

// ─── Image Upload Section ────────────────────────────────────────────────────

interface ImageUploadSectionProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
}

function ImageUploadSection({ images, onImagesChange }: ImageUploadSectionProps) {
  const { uploadImage, isUploading, uploadError, clearError } = useImageUpload();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (images.length >= 10) break;
      const result = await uploadImage(file);
      if (result) {
        const updated = [...images, { ...result, sortOrder: images.length }];
        onImagesChange(updated);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }));
    onImagesChange(updated);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const updated = [...images];
    const a = updated[index - 1];
    const b = updated[index];
    if (a && b) {
      updated[index - 1] = b;
      updated[index] = a;
    }
    onImagesChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
  }

  function handleMoveDown(index: number) {
    if (index === images.length - 1) return;
    const updated = [...images];
    const a = updated[index];
    const b = updated[index + 1];
    if (a && b) {
      updated[index + 1] = a;
      updated[index] = b;
    }
    onImagesChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Listing Photos</h3>
        <p className="text-sm text-muted-foreground">Upload up to 10 photos. The first photo will be the primary image.</p>
      </div>

      {uploadError && (
        <Alert variant="error" onDismiss={clearError}>
          {uploadError}
        </Alert>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => { void handleFileSelect(e); }}
          className="hidden"
          id="listing-images-input"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => { fileInputRef.current?.click(); }}
          disabled={isUploading || images.length >= 10}
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Uploading...
            </span>
          ) : (
            'Add Photos'
          )}
        </Button>
        <span className="text-xs text-muted-foreground">{images.length}/10 photos</span>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img, index) => (
            <div key={img.cloudinaryPublicId} className="group relative overflow-hidden rounded-lg border bg-muted">
              <div className="aspect-square">
                <img
                  src={img.url}
                  alt={'Photo ' + String(index + 1)}
                  className="h-full w-full object-cover"
                />
              </div>
              {index === 0 && (
                <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Primary
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-0.5">
                  {index > 0 && (
                    <button type="button" onClick={() => { handleMoveUp(index); }} className="rounded p-0.5 text-white hover:bg-white/20" aria-label="Move left">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button type="button" onClick={() => { handleMoveDown(index); }} className="rounded p-0.5 text-white hover:bg-white/20" aria-label="Move right">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => { handleRemove(index); }} className="rounded p-0.5 text-white hover:bg-red-500" aria-label="Remove image">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Category Picker ─────────────────────────────────────────────────────────

interface CategoryPickerProps {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

function CategoryPicker({ value, onChange, error }: CategoryPickerProps) {
  const { data: catData, isLoading } = useCategories();
  const categories = catData?.data ?? [];

  // Flatten categories for select
  const options: { value: string; label: string }[] = [{ value: '', label: 'Select a category' }];

  function addCats(cats: Category[], prefix = '') {
    for (const cat of cats) {
      options.push({ value: cat.id, label: prefix + cat.name });
      if (cat.children && cat.children.length > 0) {
        addCats(cat.children, prefix + cat.name + ' > ');
      }
    }
  }
  addCats(categories);

  if (isLoading) {
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
          <Spinner size="sm" /> Loading categories...
        </div>
      </div>
    );
  }

  return (
    <Select
      label="Category"
      options={options}
      value={value}
      onChange={(e) => { onChange(e.target.value); }}
      {...(error !== undefined && { error })}
    />
  );
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export default function ListingForm({ initialData, onSubmit, isSubmitting, submitLabel = 'Create Listing', error }: ListingFormProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ListingFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    price: initialData?.price ?? '',
    categoryId: initialData?.categoryId ?? '',
    city: initialData?.city ?? '',
    condition: initialData?.condition ?? '',
    contactOptions: initialData?.contactOptions ?? {
      showPhone: false,
      whatsapp: '',
      telegram: '',
      inAppMessaging: true,
    },
    images: initialData?.images ?? [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      return Object.fromEntries(
        Object.entries(prev).filter(([k]) => k !== key)
      );
    });
  }, []);

  const updateContact = useCallback(<K extends keyof ListingFormData['contactOptions']>(key: K, value: ListingFormData['contactOptions'][K]) => {
    setFormData((prev) => ({
      ...prev,
      contactOptions: { ...prev.contactOptions, [key]: value },
    }));
  }, []);

  function validateStep(stepIndex: number): boolean {
    const errs: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!formData.title || formData.title.length < 3) errs.title = 'Title must be at least 3 characters';
      if (!formData.description || formData.description.length < 10) errs.description = 'Description must be at least 10 characters';
      if (!formData.price || Number(formData.price) < 0) errs.price = 'Price must be 0 or more';
      if (!formData.categoryId) errs.categoryId = 'Please select a category';
      if (!formData.condition) errs.condition = 'Please select a condition';
      if (!formData.city || formData.city.length < 2) errs.city = 'City is required';
    }

    if (stepIndex === 1) {
      if (formData.images.length === 0) errs.images = 'At least one image is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    // Validate all steps
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    onSubmit(formData);
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, index) => (
          <React.Fragment key={label}>
            <button
              type="button"
              onClick={() => { if (index < step) setStep(index); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                index === step
                  ? 'bg-primary text-primary-foreground'
                  : index < step
                  ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-[10px]">
                {index + 1}
              </span>
              {label}
            </button>
            {index < STEPS.length - 1 && (
              <div className={`h-px flex-1 ${index < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Step 0: Details */}
      {step === 0 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Listing Details</h3>

            <FormInput
              label="Title"
              placeholder="e.g. iPhone 15 Pro Max 256GB"
              value={formData.title}
              onChange={(e) => { updateField('title', e.target.value); }}
              {...(errors.title !== undefined && { error: errors.title })}
            />

            <FormTextarea
              label="Description"
              placeholder="Describe your item in detail..."
              rows={6}
              value={formData.description}
              onChange={(e) => { updateField('description', e.target.value); }}
              {...(errors.description !== undefined && { error: errors.description })}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Price ($)"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => { updateField('price', e.target.value); }}
                {...(errors.price !== undefined && { error: errors.price })}
              />

              <FormInput
                label="City"
                placeholder="e.g. New York"
                value={formData.city}
                onChange={(e) => { updateField('city', e.target.value); }}
                {...(errors.city !== undefined && { error: errors.city })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <CategoryPicker
                  value={formData.categoryId}
                  onChange={(id) => { updateField('categoryId', id); }}
                  {...(errors.categoryId !== undefined && { error: errors.categoryId })}
                />
              </div>

              <FormSelect
                label="Condition"
                options={CONDITIONS}
                value={formData.condition}
                onChange={(e) => { updateField('condition', e.target.value); }}
                {...(errors.condition !== undefined && { error: errors.condition })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Photos */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6">
            <ImageUploadSection
              images={formData.images}
              onImagesChange={(imgs) => { updateField('images', imgs); }}
            />
            {errors.images !== undefined && (
              <p className="mt-2 text-sm text-destructive">{errors.images}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Contact Options */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-lg font-semibold">Contact Options</h3>
            <p className="text-sm text-muted-foreground">Choose how buyers can reach you.</p>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={formData.contactOptions.showPhone}
                  onChange={(e) => { updateContact('showPhone', e.target.checked); }}
                />
                <span className="text-sm">Show my phone number on the listing</span>
              </label>

              <label className="flex items-center gap-3">
                <Checkbox
                  checked={formData.contactOptions.inAppMessaging}
                  onChange={(e) => { updateContact('inAppMessaging', e.target.checked); }}
                />
                <span className="text-sm">Enable in-app messaging</span>
              </label>
            </div>

            <FormInput
              label="WhatsApp Number"
              placeholder="+1234567890"
              value={formData.contactOptions.whatsapp}
              onChange={(e) => { updateContact('whatsapp', e.target.value); }}
            />

            <FormInput
              label="Telegram Username"
              placeholder="@username"
              value={formData.contactOptions.telegram}
              onChange={(e) => { updateContact('telegram', e.target.value); }}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <h3 className="text-lg font-semibold">Review Your Listing</h3>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Title</span>
                <p className="text-sm font-medium">{formData.title}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Description</span>
                <p className="text-sm whitespace-pre-wrap">{formData.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Price</span>
                  <p className="text-sm font-medium">${Number(formData.price).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Condition</span>
                  <p className="text-sm font-medium capitalize">{formData.condition.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">City</span>
                  <p className="text-sm font-medium">{formData.city}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Photos</span>
                <p className="text-sm">{formData.images.length} photo{formData.images.length !== 1 ? 's' : ''} uploaded</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Contact Options</span>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {formData.contactOptions.showPhone && <span className="rounded bg-muted px-2 py-1">Phone</span>}
                  {formData.contactOptions.inAppMessaging && <span className="rounded bg-muted px-2 py-1">In-App Messaging</span>}
                  {formData.contactOptions.whatsapp && <span className="rounded bg-muted px-2 py-1">WhatsApp</span>}
                  {formData.contactOptions.telegram && <span className="rounded bg-muted px-2 py-1">Telegram</span>}
                </div>
              </div>
            </div>

            <Alert variant="info">
              After submission, your listing will be reviewed before going live. This usually takes less than 24 hours.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Submitting...
              </span>
            ) : (
              submitLabel
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
