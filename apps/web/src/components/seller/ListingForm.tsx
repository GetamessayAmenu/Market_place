"use client"
import { Alert, Button, Card, CardContent, Checkbox, FormInput, FormSelect, FormTextarea, Select, Spinner } from '@marketplace/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useCategories, type Category } from '../../hooks/useCategories';
import { useImageUpload, type UploadedImage } from '../../hooks/useSeller';

import ListingStepper, { type StepDef } from './ListingStepper';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ListingFormData {
  listingType: 'sale' | 'rent';
  title: string;
  description: string;
  price: string;
  categoryId: string;
  categoryName: string;
  city: string;
  condition: string;
  contactOptions: {
    showPhone: boolean;
    whatsapp: string;
    telegram: string;
    inAppMessaging: boolean;
  };
  images: UploadedImage[];
  // Product details (dynamic based on category)
  productDetails?: {
    size?: string;
    color?: string;
    material?: string;
    gender?: string;
    style?: string;
  } | null;
  // Rental information (conditional)
  rentalInfo?: {
    rentalPricePerDay: string;
    rentalDeposit: string;
    minRentalDays: string;
    maxRentalDays: string;
  } | null;
  // Custom-made option
  customOrderAvailable: boolean;
  customDetails?: {
    sizeAdjustments: boolean;
    colorFabricChanges: boolean;
    embroidery: boolean;
    otherCustomization: string;
    additionalCustomPrice: string;
  } | null;
}

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  initialListingType?: 'sale' | 'rent';
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

function getSteps(_type: 'sale' | 'rent' | null): StepDef[] {
  const steps: StepDef[] = [
    { id: 'photos', label: 'Photos', description: 'Upload 1-8 product photos', icon: STEP_ICONS.image },
    { id: 'info', label: 'Basic Information', description: 'Title, category, description', icon: STEP_ICONS.info },
    { id: 'details', label: 'Product Details', description: 'Size, color, material', icon: STEP_ICONS.info },
    { id: 'type', label: 'Listing Type', description: 'For sale or for rent', icon: STEP_ICONS.pricing },
    { id: 'custom', label: 'Custom Option', description: 'Custom-made available?', icon: STEP_ICONS.delivery },
    { id: 'contact', label: 'Contact', description: 'How buyers reach you', icon: STEP_ICONS.delivery },
    { id: 'review', label: 'Preview', description: 'Review before publishing', icon: STEP_ICONS.review },
  ];
  return steps;
}

// ─── Image Upload Section ────────────────────────────────────────────────────

interface ImageUploadSectionProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  error?: string;
}

function ImageUploadSection({ images, onImagesChange, error }: ImageUploadSectionProps) {
  const { uploadImages, isUploading, uploadProgress, uploadError, clearError } = useImageUpload();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [validationNotice, setValidationNotice] = React.useState<string | null>(null);
  const dragCounterRef = React.useRef(0);

  const processBatchUpload = React.useCallback(
    async (fileList: File[]) => {
      setValidationNotice(null);
      if (!fileList || fileList.length === 0) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB

      const validFiles: File[] = [];
      let skippedInvalid = 0;
      let skippedSize = 0;

      for (const file of fileList) {
        if (!allowedTypes.includes(file.type)) {
          skippedInvalid++;
          continue;
        }
        if (file.size > maxSizeBytes) {
          skippedSize++;
          continue;
        }
        validFiles.push(file);
      }

      if (skippedInvalid > 0 || skippedSize > 0) {
        setValidationNotice(
          `Skipped ${skippedInvalid + skippedSize} file(s) (JPEG/PNG/WebP only, under 5MB each).`,
        );
      }

      if (validFiles.length === 0) return;

      const remainingSlots = 8 - images.length;
      if (remainingSlots <= 0) {
        setValidationNotice('Maximum 8 photos limit reached.');
        return;
      }

      const batchToUpload = validFiles.slice(0, remainingSlots);
      if (validFiles.length > remainingSlots) {
        setValidationNotice(
          `Selected ${validFiles.length} photos, but only ${remainingSlots} slot(s) available. Uploading first ${remainingSlots}.`,
        );
      }

      const uploaded = await uploadImages(batchToUpload);
      if (uploaded && uploaded.length > 0) {
        const nextImages = [
          ...images,
          ...uploaded.map((img, idx) => ({
            ...img,
            sortOrder: images.length + idx,
          })),
        ];
        onImagesChange(nextImages);
      }
    },
    [images, uploadImages, onImagesChange],
  );

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    await processBatchUpload(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    const files = Array.from(e.dataTransfer.files);
    await processBatchUpload(files);
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
        <h3 className="text-sm font-medium">Product Photos</h3>
        <p className="text-sm text-muted-foreground">Upload 1-8 photos at once. The first photo will be the main product image. Show clear photos of the complete clothing item.</p>
      </div>

      {uploadError && <Alert variant="error" onDismiss={clearError}>{uploadError}</Alert>}
      {validationNotice && <Alert variant="warning" onDismiss={() => setValidationNotice(null)}>{validationNotice}</Alert>}
      {error !== undefined && <p className="text-sm text-destructive">{error}</p>}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { void handleFileSelect(e); }} className="hidden" id="listing-images-input" />
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Drag and drop multiple photos here</p>
            <p className="text-xs text-muted-foreground">or click to select multiple photos from device</p>
          </div>
          <Button type="button" variant="outline" onClick={() => { fileInputRef.current?.click(); }} disabled={isUploading || images.length >= 8}>
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                {uploadProgress
                  ? `Uploading ${uploadProgress.completed} of ${uploadProgress.total} (${uploadProgress.percentage}%)...`
                  : 'Uploading photos...'}
              </span>
            ) : (
              'Select Multiple Photos'
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{images.length}/8 photos</span>
        <span>JPEG, PNG, WebP • Max 5MB each • Multi-select supported</span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div key={img.cloudinaryPublicId} className="group relative overflow-hidden rounded-lg border bg-muted">
              <div className="aspect-square">
                <img src={img.url} alt={'Photo ' + String(index + 1)} className="h-full w-full object-cover" />
              </div>
              {index === 0 && (
                <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Main</div>
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

function categoryLabel(cat: Category) {
  return cat.nameAm ? `${cat.name} (${cat.nameAm})` : cat.name;
}

function CategoryPicker({ value, onChange, error }: CategoryPickerProps) {
  const { data: catData, isLoading } = useCategories();
  const roots = useMemo(
    () => (Array.isArray(catData) ? catData.filter((c) => !c.parentId) : []),
    [catData],
  );

  const selectedParent = useMemo(() => {
    for (const root of roots) {
      if (root.id === value) return root;
      if (root.children?.some((child) => child.id === value)) return root;
    }
    return undefined;
  }, [roots, value]);

  const [parentId, setParentId] = useState(selectedParent?.id ?? '');

  useEffect(() => {
    if (selectedParent?.id) {
      setParentId(selectedParent.id);
    }
  }, [selectedParent?.id]);

  const parent = roots.find((c) => c.id === parentId);
  const children = parent?.children ?? [];

  const parentOptions = useMemo(
    () => [
      { value: '', label: 'Select a fashion category' },
      ...roots.map((cat) => ({ value: cat.id, label: categoryLabel(cat) })),
    ],
    [roots],
  );

  const childOptions = useMemo(
    () => [
      { value: '', label: 'Select a subcategory' },
      ...children.map((cat) => ({ value: cat.id, label: categoryLabel(cat) })),
    ],
    [children],
  );

  function handleParentChange(id: string) {
    setParentId(id);
    const nextParent = roots.find((c) => c.id === id);
    if (!nextParent) {
      onChange('', '');
      return;
    }
    if (nextParent.children && nextParent.children.length > 0) {
      onChange('', '');
      return;
    }
    onChange(nextParent.id, categoryLabel(nextParent));
  }

  function handleChildChange(id: string) {
    const child = children.find((c) => c.id === id);
    if (!child || !parent) {
      onChange('', '');
      return;
    }
    onChange(child.id, `${categoryLabel(parent)} > ${categoryLabel(child)}`);
  }

  if (isLoading) {
    return (
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
          <Spinner size="sm" /> Loading fashion categories...
        </div>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
      <Select
        label="Fashion category"
        options={parentOptions}
        value={parentId}
        required
        onChange={(e) => handleParentChange(e.target.value)}
        {...(error !== undefined && !parentId ? { error } : {})}
      />
      {children.length > 0 && (
        <Select
          label="Subcategory"
          options={childOptions}
          value={children.some((c) => c.id === value) ? value : ''}
          required
          onChange={(e) => handleChildChange(e.target.value)}
          {...(error !== undefined ? { error } : {})}
        />
      )}
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export default function ListingForm({ initialData, initialListingType, onSubmit, isSubmitting, submitLabel = 'Publish Listing', error }: ListingFormProps) {
  const [listingType, setListingType] = useState<'sale' | 'rent' | null>(initialListingType ?? initialData?.listingType ?? null);
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form state
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [price, setPrice] = useState(initialData?.price ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [categoryName, setCategoryName] = useState(initialData?.categoryName ?? '');
  const [city, setCity] = useState(initialData?.city ?? '');
  const [condition, setCondition] = useState(initialData?.condition ?? '');
  const [images, setImages] = useState<UploadedImage[]>(initialData?.images ?? []);
  
  // Product details
  const [productDetails, setProductDetails] = useState(initialData?.productDetails ?? {
    size: '',
    color: '',
    material: '',
    gender: '',
    style: '',
  });
  
  // Rental info
  const [rentalInfo, setRentalInfo] = useState(initialData?.rentalInfo ?? {
    rentalPricePerDay: '',
    rentalDeposit: '',
    minRentalDays: '',
    maxRentalDays: '',
  });
  
  // Custom order
  const [customOrderAvailable, setCustomOrderAvailable] = useState(initialData?.customOrderAvailable ?? false);
  const [customDetails, setCustomDetails] = useState(initialData?.customDetails ?? {
    sizeAdjustments: false,
    colorFabricChanges: false,
    embroidery: false,
    otherCustomization: '',
    additionalCustomPrice: '',
  });
  
  // Contact options
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
      // Photos
      if (images.length === 0) errs.images = 'At least one photo is required';
      if (images.length > 8) errs.images = 'Maximum 8 photos allowed';
    }

    if (stepIndex === 1) {
      // Basic Info
      if (!title || title.length < 3) errs.title = 'Title must be at least 3 characters';
      if (title.length > 200) errs.title = 'Title must be 200 characters or less';
      if (!description || description.length < 10) errs.description = 'Description must be at least 10 characters';
      if (!categoryId) errs.categoryId = 'Please select a fashion category';
      if (!condition) errs.condition = 'Please select a condition';
      if (!city || city.length < 2) errs.city = 'City is required';
      if (!price || Number(price) <= 0) errs.price = 'Price must be greater than 0';
    }

    if (stepIndex === 2) {
      // Product Details - optional, no validation
    }

    if (stepIndex === 3) {
      // Listing Type
      if (!listingType) errs.listingType = 'Please select a listing type';
      if (listingType === 'rent') {
        if (!rentalInfo.rentalPricePerDay || Number(rentalInfo.rentalPricePerDay) <= 0) errs.rentalPricePerDay = 'Rental price per day is required';
        if (!rentalInfo.rentalDeposit || Number(rentalInfo.rentalDeposit) < 0) errs.rentalDeposit = 'Security deposit is required';
      }
    }

    if (stepIndex === 4) {
      // Custom Option - optional, no validation
    }

    if (stepIndex === 5) {
      // Contact - at least one method required
      if (!contactOptions.inAppMessaging && !contactOptions.showPhone && !contactOptions.whatsapp && !contactOptions.telegram) {
        errs.contact = 'Please select at least one contact method';
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
      price,
      categoryId,
      categoryName,
      city,
      condition,
      contactOptions,
      images,
      productDetails: productDetails || null,
      rentalInfo: listingType === 'rent' ? rentalInfo : null,
      customOrderAvailable,
      customDetails: customOrderAvailable ? customDetails : null,
    });
  }

  // ─── Type selector (pre-step, not in stepper) ─────────────────────────

  if (!listingType) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-display font-semibold">Select Listing Type</h3>
            <p className="text-sm text-muted-foreground">Choose how you want to sell this item</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setListingType('sale')}
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted-foreground/20 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">For Sale</h4>
                  <p className="text-xs text-muted-foreground">Sell your item directly</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setListingType('rent')}
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted-foreground/20 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">For Rent</h4>
                  <p className="text-xs text-muted-foreground">Rent out your item</p>
                </div>
              </button>
            </div>
          </div>
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
              {/* Step 0: Photos */}
              {step === 0 && (
                <ImageUploadSection
                  images={images}
                  onImagesChange={setImages}
                  {...(errors.images !== undefined && { error: errors.images })}
                />
              )}

              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold">Basic Information</h3>

                  <FormInput
                    label="Product Title"
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="Price (ETB)"
                      placeholder="e.g. 3500"
                      type="number"
                      value={price}
                      onChange={(e) => { setPrice(e.target.value); clearField('price'); }}
                      {...(errors.price !== undefined && { error: errors.price })}
                    />
                    <FormInput
                      label="Location"
                      placeholder="e.g. Addis Ababa"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); clearField('city'); }}
                      {...(errors.city !== undefined && { error: errors.city })}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Product Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold">Product Details</h3>
                  <p className="text-sm text-muted-foreground">Add relevant details based on your category (optional)</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="Size"
                      placeholder="e.g. M, L, XL"
                      value={productDetails.size || ''}
                      onChange={(e) => setProductDetails({ ...productDetails, size: e.target.value })}
                    />
                    <FormInput
                      label="Color"
                      placeholder="e.g. Red, Blue, Black"
                      value={productDetails.color || ''}
                      onChange={(e) => setProductDetails({ ...productDetails, color: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="Material/Fabric"
                      placeholder="e.g. Cotton, Silk, Linen"
                      value={productDetails.material || ''}
                      onChange={(e) => setProductDetails({ ...productDetails, material: e.target.value })}
                    />
                    <FormInput
                      label="Gender"
                      placeholder="e.g. Women, Men, Unisex"
                      value={productDetails.gender || ''}
                      onChange={(e) => setProductDetails({ ...productDetails, gender: e.target.value })}
                    />
                  </div>

                  <FormInput
                    label="Style"
                    placeholder="e.g. Traditional, Modern, Casual"
                    value={productDetails.style || ''}
                    onChange={(e) => setProductDetails({ ...productDetails, style: e.target.value })}
                  />
                </div>
              )}

              {/* Step 3: Listing Type */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold">Listing Type</h3>
                  <p className="text-sm text-muted-foreground">Current selection: {listingType === 'sale' ? 'For Sale' : 'For Rent'}</p>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {listingType === 'sale' ? (
                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{listingType === 'sale' ? 'For Sale' : 'For Rent'}</h4>
                          <p className="text-xs text-muted-foreground">{listingType === 'sale' ? 'Sell your item directly' : 'Rent out your item'}</p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setListingType(null)}>
                        Change
                      </Button>
                    </div>

                    {listingType === 'rent' && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium">Rental Information</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormInput
                            label="Rental Price (ETB/day)"
                            placeholder="e.g. 200"
                            type="number"
                            value={rentalInfo.rentalPricePerDay}
                            onChange={(e) => setRentalInfo({ ...rentalInfo, rentalPricePerDay: e.target.value })}
                            {...(errors.rentalPricePerDay !== undefined && { error: errors.rentalPricePerDay })}
                          />
                          <FormInput
                            label="Security Deposit (ETB)"
                            placeholder="e.g. 500"
                            type="number"
                            value={rentalInfo.rentalDeposit}
                            onChange={(e) => setRentalInfo({ ...rentalInfo, rentalDeposit: e.target.value })}
                            {...(errors.rentalDeposit !== undefined && { error: errors.rentalDeposit })}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormInput
                            label="Minimum Rental Days"
                            placeholder="e.g. 1"
                            type="number"
                            value={rentalInfo.minRentalDays}
                            onChange={(e) => setRentalInfo({ ...rentalInfo, minRentalDays: e.target.value })}
                          />
                          <FormInput
                            label="Maximum Rental Days"
                            placeholder="e.g. 30"
                            type="number"
                            value={rentalInfo.maxRentalDays}
                            onChange={(e) => setRentalInfo({ ...rentalInfo, maxRentalDays: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Custom Option */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold">Custom-Made Option</h3>
                  <p className="text-sm text-muted-foreground">Can this item be customized for buyers?</p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={customOrderAvailable}
                        onChange={(e) => setCustomOrderAvailable(e.target.checked)}
                      />
                      <div>
                        <span className="font-medium">Available for custom order?</span>
                        <p className="text-xs text-muted-foreground">Buyers can request customizations</p>
                      </div>
                    </div>

                    {customOrderAvailable && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium">Customization Details</h4>
                        
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <Checkbox
                              checked={customDetails.sizeAdjustments}
                              onChange={(e) => setCustomDetails({ ...customDetails, sizeAdjustments: e.target.checked })}
                            />
                            <span className="text-sm">Size adjustments available</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <Checkbox
                              checked={customDetails.colorFabricChanges}
                              onChange={(e) => setCustomDetails({ ...customDetails, colorFabricChanges: e.target.checked })}
                            />
                            <span className="text-sm">Color/fabric changes available</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <Checkbox
                              checked={customDetails.embroidery}
                              onChange={(e) => setCustomDetails({ ...customDetails, embroidery: e.target.checked })}
                            />
                            <span className="text-sm">Embroidery customization available</span>
                          </label>
                        </div>

                        <FormTextarea
                          label="Other Customization Options"
                          placeholder="Describe any other customization options you offer..."
                          rows={3}
                          value={customDetails.otherCustomization}
                          onChange={(e) => setCustomDetails({ ...customDetails, otherCustomization: e.target.value })}
                        />

                        <FormInput
                          label="Additional Custom Price (ETB) - Optional"
                          placeholder="e.g. 500"
                          type="number"
                          value={customDetails.additionalCustomPrice}
                          onChange={(e) => setCustomDetails({ ...customDetails, additionalCustomPrice: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Contact */}
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold">Contact Options</h3>
                  <p className="text-sm text-muted-foreground">How can buyers reach you?</p>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <Checkbox
                        checked={contactOptions.inAppMessaging}
                        onChange={(e) => updateContact('inAppMessaging', e.target.checked)}
                      />
                      <div>
                        <span className="font-medium">Platform chat</span>
                        <p className="text-xs text-muted-foreground">Buyers can message you through the platform</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3">
                      <Checkbox
                        checked={contactOptions.showPhone}
                        onChange={(e) => updateContact('showPhone', e.target.checked)}
                      />
                      <div>
                        <span className="font-medium">Phone</span>
                        <p className="text-xs text-muted-foreground">Show your phone number to buyers</p>
                      </div>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label="WhatsApp Number"
                      placeholder="e.g. +251911123456"
                      value={contactOptions.whatsapp}
                      onChange={(e) => updateContact('whatsapp', e.target.value)}
                    />
                    <FormInput
                      label="Telegram Username"
                      placeholder="e.g. @username"
                      value={contactOptions.telegram}
                      onChange={(e) => updateContact('telegram', e.target.value)}
                    />
                  </div>

                  {errors.contact && (
                    <p className="text-sm text-destructive">{errors.contact}</p>
                  )}
                </div>
              )}

              {/* Step 6: Preview */}
              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold">Preview Your Listing</h3>
                  <p className="text-sm text-muted-foreground">This is how your listing will appear to buyers</p>

                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex gap-6">
                      {images.length > 0 && images[0] && (
                        <div className="h-48 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img src={images[0].url} alt={title} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <h4 className="text-xl font-semibold">{title || 'Product Title'}</h4>
                        <p className="text-2xl font-bold text-primary">{price ? `${price} ETB` : 'Price'}</p>
                        <p className="text-sm text-muted-foreground">📍 {city || 'Location'}</p>
                        <p className="text-sm line-clamp-2">{description || 'Product description...'}</p>
                        <div className="flex gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{condition || 'Condition'}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{listingType === 'sale' ? 'For Sale' : 'For Rent'}</span>
                          {customOrderAvailable && (
                            <span className="rounded-full bg-brand-gold/10 px-2 py-1 text-xs font-medium text-brand-gold">Custom Available</span>
                          )}
                        </div>
                      </div>
                    </div>
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
