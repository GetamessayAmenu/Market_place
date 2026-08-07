"use client"
import { Alert, Button, Card, CardContent, Checkbox, FormInput, FormSelect, FormTextarea, Select, Spinner } from '@marketplace/ui';
import React, { useCallback, useMemo, useState } from 'react';

import { useCategories, type Category } from '../../hooks/useCategories';
import { useImageUpload, type UploadedImage } from '../../hooks/useSeller';

import DeliveryOptions, { DEFAULT_DELIVERY, type DeliveryData } from './DeliveryOptions';
import ListingReviewSummary from './ListingReviewSummary';
import ListingStepper, { type StepDef } from './ListingStepper';
import ListingTypeSelector, { type ListingType } from './ListingTypeSelector';
import PricingSection, { DEFAULT_PRICING, type PricingData } from './PricingSection';
import TagInput from './TagInput';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ListingFormData {
  listingType: ListingType;
  title: string;
  description: string;
  price: string;
  categoryId: string;
  categoryName: string;
  city: string;
  condition: string;
  tags: string[];
  contactOptions: {
    showPhone: boolean;
    whatsapp: string;
    telegram: string;
    inAppMessaging: boolean;
  };
  images: UploadedImage[];
  pricing: PricingData;
  delivery: DeliveryData;
  // Unified custom design fields
  supportsReadyMade?: boolean;
  supportsCustomDesign?: boolean;
  startingCustomPrice?: string;
  estimatedProductionDays?: string;
  customizationOptions?: {
    requiresMeasurements: boolean;
    fabricTypes: string[];
    colors: string[];
    embroideryTypes: string[];
    customNotesAllowed: boolean;
  };
}

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  initialListingType?: ListingType;
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

// ─── Step Definitions ────────────────────────────────────────────────────────

const STEP_ICONS = {
  info: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  image: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
    </svg>
  ),
  pricing: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  delivery: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.079-.504 1.042-1.123l-.314-5.267A2.25 2.25 0 0018.14 10.5H15M2.25 14.25V5.625c0-.621.504-1.125 1.125-1.125h8.25M2.25 14.25h8.25m0 0V4.5h4.5v6h-4.5z" />
    </svg>
  ),
  review: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function getSteps(type: ListingType | null): StepDef[] {
  return [
    { id: 'info', label: 'Basic Information', description: 'Title, description, category', icon: STEP_ICONS.info },
    { id: 'images', label: 'Photos', description: 'Upload up to 10 photos', icon: STEP_ICONS.image },
    { id: 'pricing', label: 'Pricing', description: type === 'rent' ? 'Rental rates & deposit' : type === 'custom' ? 'Service pricing' : 'Set your price', icon: STEP_ICONS.pricing },
    { id: 'delivery', label: 'Delivery & Availability', description: 'How buyers receive the item', icon: STEP_ICONS.delivery },
    { id: 'review', label: 'Review & Publish', description: 'Confirm all details', icon: STEP_ICONS.review },
  ];
}

// ─── Image Upload Section ────────────────────────────────────────────────────

interface ImageUploadSectionProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  error?: string;
}

function ImageUploadSection({ images, onImagesChange, error }: ImageUploadSectionProps) {
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if (a && b) { updated[index - 1] = b; updated[index] = a; }
    onImagesChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
  }

  function handleMoveDown(index: number) {
    if (index === images.length - 1) return;
    const updated = [...images];
    const a = updated[index];
    const b = updated[index + 1];
    if (a && b) { updated[index + 1] = a; updated[index] = b; }
    onImagesChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Listing Photos</h3>
        <p className="text-sm text-muted-foreground">Upload up to 10 photos. The first photo will be the primary image.</p>
      </div>

      {uploadError && <Alert variant="error" onDismiss={clearError}>{uploadError}</Alert>}
      {error !== undefined && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { void handleFileSelect(e); }} className="hidden" id="listing-images-input" />
        <Button type="button" variant="outline" onClick={() => { fileInputRef.current?.click(); }} disabled={isUploading || images.length >= 10}>
          {isUploading ? <span className="flex items-center gap-2"><Spinner size="sm" /> Uploading...</span> : 'Add Photos'}
        </Button>
        <span className="text-xs text-muted-foreground">{images.length}/10 photos</span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img, index) => (
            <div key={img.cloudinaryPublicId} className="group relative overflow-hidden rounded-lg border bg-muted">
              <div className="aspect-square">
                <img src={img.url} alt={'Photo ' + String(index + 1)} className="h-full w-full object-cover" />
              </div>
              {index === 0 && (
                <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Primary</div>
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
  onChange: (id: string, name: string) => void;
  error?: string;
}

function CategoryPicker({ value, onChange, error }: CategoryPickerProps) {
  const { data: catData, isLoading } = useCategories();
  const categories = catData?.data ?? [];

  const options: { value: string; label: string }[] = [{ value: '', label: 'Select a category' }];
  const nameMap = useMemo(() => new Map<string, string>(), []);

  function addCats(cats: Category[], prefix = '') {
    for (const cat of cats) {
      options.push({ value: cat.id, label: prefix + cat.name });
      nameMap.set(cat.id, prefix + cat.name);
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
      onChange={(e) => {
        const id = e.target.value;
        onChange(id, nameMap.get(id) ?? '');
      }}
      {...(error !== undefined && { error })}
    />
  );
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export default function ListingForm({ initialData, initialListingType, onSubmit, isSubmitting, submitLabel = 'Publish Listing', error }: ListingFormProps) {
  const [listingType, setListingType] = useState<ListingType | null>(initialListingType ?? initialData?.listingType ?? null);
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form state
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [categoryName, setCategoryName] = useState(initialData?.categoryName ?? '');
  const [city, setCity] = useState(initialData?.city ?? '');
  const [condition, setCondition] = useState(initialData?.condition ?? '');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [images, setImages] = useState<UploadedImage[]>(initialData?.images ?? []);
  const [pricing, setPricing] = useState<PricingData>(initialData?.pricing ?? { ...DEFAULT_PRICING, price: initialData?.price ?? '' });
  const [delivery, setDelivery] = useState<DeliveryData>(initialData?.delivery ?? {
    ...DEFAULT_DELIVERY,
    supportsReadyMade: initialData?.supportsReadyMade ?? true,
    supportsCustomDesign: initialData?.supportsCustomDesign ?? false,
    startingCustomPrice: initialData?.startingCustomPrice ?? '',
    estimatedProductionDays: initialData?.estimatedProductionDays ?? '',
    customizationOptions: initialData?.customizationOptions ?? {
      requiresMeasurements: false,
      fabricTypes: [],
      colors: [],
      embroideryTypes: [],
      customNotesAllowed: true,
    },
  });
  const [contactOptions, setContactOptions] = useState(initialData?.contactOptions ?? {
    showPhone: false,
    whatsapp: '',
    telegram: '',
    inAppMessaging: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = useMemo(() => getSteps(listingType), [listingType]);

  const clearField = useCallback((field: string) => {
    setErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => k !== field))
    );
  }, []);

  const updateContact = useCallback(<K extends keyof typeof contactOptions>(key: K, value: (typeof contactOptions)[K]) => {
    setContactOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── Validation ──────────────────────────────────────────────────────────

  function validateStep(stepIndex: number): boolean {
    const errs: Record<string, string> = {};

    if (stepIndex === 0) {
      // Basic Info
      if (!title || title.length < 3) errs.title = 'Title must be at least 3 characters';
      if (title.length > 200) errs.title = 'Title must be 200 characters or less';
      if (!description || description.length < 10) errs.description = 'Description must be at least 10 characters';
      if (!categoryId) errs.categoryId = 'Please select a category';
      if (!condition) errs.condition = 'Please select a condition';
      if (!city || city.length < 2) errs.city = 'City is required';
    }

    if (stepIndex === 1) {
      // Images
      if (images.length === 0) errs.images = 'At least one image is required';
    }

    if (stepIndex === 2) {
      // Pricing
      if (!pricing.price || Number(pricing.price) < 0) errs.price = 'Price must be 0 or more';
      if (listingType === 'rent') {
        if (!pricing.rentalPricePerDay || Number(pricing.rentalPricePerDay) <= 0) errs.rentalPricePerDay = 'Rental price per day is required';
        if (!pricing.rentalDeposit || Number(pricing.rentalDeposit) < 0) errs.rentalDeposit = 'Security deposit is required';
      }
    }

    if (stepIndex === 3) {
      // Delivery
      if (!delivery.supportsReadyMade && !delivery.supportsCustomDesign && !delivery.availableForRent) {
        errs.availability = 'Select at least one availability option';
      }
      if (delivery.supportsCustomDesign && (!delivery.estimatedProductionDays || Number(delivery.estimatedProductionDays) <= 0)) {
        errs.estimatedProductionDays = 'Estimated production days is required for custom design';
      }
      if ((delivery.deliveryMethod === 'delivery' || delivery.deliveryMethod === 'both') && !delivery.deliveryFee) {
        errs.deliveryFee = 'Delivery fee is required when delivery is selected';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  function handleNext() {
    if (validateStep(step)) {
      setCompletedSteps((prev) => new Set([...prev, step]));
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleStepClick(index: number) {
    if (index < step || completedSteps.has(index)) {
      setStep(index);
    }
  }

  function handlePublish() {
    // Validate all steps
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }

    const effectiveType = listingType ?? 'sale';

    onSubmit({
      listingType: effectiveType,
      title,
      description,
      price: pricing.price,
      categoryId,
      categoryName,
      city,
      condition,
      tags,
      contactOptions,
      images,
      pricing,
      delivery,
      supportsReadyMade: delivery.supportsReadyMade,
      supportsCustomDesign: delivery.supportsCustomDesign,
      startingCustomPrice: delivery.startingCustomPrice,
      estimatedProductionDays: delivery.estimatedProductionDays,
      customizationOptions: delivery.customizationOptions,
    });
  }

  // ─── Type selector (pre-step, not in stepper) ─────────────────────────

  if (!listingType) {
    return (
      <Card>
        <CardContent className="p-6">
          <ListingTypeSelector
            value={listingType}
            onChange={(type) => {
              setListingType(type);
              // Set type-appropriate defaults
              if (type === 'rent') {
                setDelivery((prev) => ({ ...prev, availableForRent: true, supportsReadyMade: false, supportsCustomDesign: false }));
              } else if (type === 'custom') {
                setDelivery((prev) => ({ ...prev, supportsCustomDesign: true, supportsReadyMade: false, availableForRent: false }));
              } else {
                setDelivery((prev) => ({ ...prev, supportsReadyMade: true, supportsCustomDesign: false, availableForRent: false }));
              }
            }}
          />
          {error && <Alert variant="error" className="mt-4">{error}</Alert>}
        </CardContent>
      </Card>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Mobile stepper */}
      <ListingStepper
        steps={steps}
        currentStep={step}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        listingType={listingType}
      />

      {error && <Alert variant="error" onDismiss={() => { /* parent controls */ }}>{error}</Alert>}

      {/* Desktop layout: sidebar + form */}
      <div className="flex gap-8">
        {/* Desktop stepper sidebar */}
        <div className="hidden w-64 shrink-0 fashion-lg:block">
          <div className="sticky top-24">
            <ListingStepper
              steps={steps}
              currentStep={step}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
              listingType={listingType}
            />
            <button
              type="button"
              onClick={() => { setListingType(null); setStep(0); setCompletedSteps(new Set()); }}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Change listing type
            </button>
          </div>
        </div>

        {/* Form card */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-6">
              {/* Step 0: Basic Information */}
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold">Basic Information</h3>

                  <FormInput
                    label="Title"
                    placeholder="e.g. Handwoven Ethiopian Cotton Dress"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); clearField('title'); }}
                    {...(errors.title !== undefined && { error: errors.title })}
                  />

                  <FormTextarea
                    label="Description"
                    placeholder="Describe your item in detail — materials, craftsmanship, dimensions..."
                    rows={6}
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); clearField('description'); }}
                    {...(errors.description !== undefined && { error: errors.description })}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <CategoryPicker
                      value={categoryId}
                      onChange={(id, name) => { setCategoryId(id); setCategoryName(name); clearField('categoryId'); }}
                      {...(errors.categoryId !== undefined && { error: errors.categoryId })}
                    />
                    <FormSelect
                      label="Condition"
                      options={CONDITIONS}
                      value={condition}
                      onChange={(e) => { setCondition(e.target.value); clearField('condition'); }}
                      {...(errors.condition !== undefined && { error: errors.condition })}
                    />
                  </div>

                  <FormInput
                    label="City"
                    placeholder="e.g. Addis Ababa"
                    value={city}
                    onChange={(e) => { setCity(e.target.value); clearField('city'); }}
                    {...(errors.city !== undefined && { error: errors.city })}
                  />

                  <TagInput
                    label="Tags"
                    description="Add keywords to help buyers find your listing"
                    value={tags}
                    onChange={setTags}
                    maxTags={10}
                    placeholder="Type and press Enter"
                  />
                </div>
              )}

              {/* Step 1: Images */}
              {step === 1 && (
                <ImageUploadSection
                  images={images}
                  onImagesChange={setImages}
                  {...(errors.images !== undefined && { error: errors.images })}
                />
              )}

              {/* Step 2: Pricing */}
              {step === 2 && (
                <PricingSection
                  listingType={listingType}
                  data={pricing}
                  onChange={setPricing}
                  errors={errors}
                />
              )}

              {/* Step 3: Delivery & Availability */}
              {step === 3 && (
                <DeliveryOptions
                  listingType={listingType}
                  data={delivery}
                  onChange={setDelivery}
                  errors={errors}
                />
              )}

              {/* Step 4: Review & Publish */}
              {step === 4 && (
                <ListingReviewSummary
                  data={{
                    listingType,
                    title,
                    description,
                    categoryId,
                    categoryName,
                    condition,
                    city,
                    tags,
                    images,
                    pricing,
                    delivery,
                    contactOptions,
                  }}
                />
              )}

              {/* Contact options (shown in basic info step for compactness) */}
              {step === 0 && (
                <div className="mt-6 border-t pt-5">
                  <h4 className="text-sm font-medium text-foreground mb-3">Contact Options</h4>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-3">
                      <Checkbox checked={contactOptions.showPhone} onChange={(e) => { updateContact('showPhone', e.target.checked); }} />
                      <span className="text-sm">Show my phone number</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <Checkbox checked={contactOptions.inAppMessaging} onChange={(e) => { updateContact('inAppMessaging', e.target.checked); }} />
                      <span className="text-sm">Enable in-app messaging</span>
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <FormInput
                      label="WhatsApp Number"
                      placeholder="+251..."
                      value={contactOptions.whatsapp}
                      onChange={(e) => { updateContact('whatsapp', e.target.value); }}
                    />
                    <FormInput
                      label="Telegram Username"
                      placeholder="@username"
                      value={contactOptions.telegram}
                      onChange={(e) => { updateContact('telegram', e.target.value); }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handlePublish} disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><Spinner size="sm" /> Publishing...</span>
                ) : (
                  submitLabel
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
