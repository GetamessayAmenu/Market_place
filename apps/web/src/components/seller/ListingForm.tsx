'use client';

import {
  Alert,
  Button,
  Checkbox,
  FormInput,
  FormSelect,
  FormTextarea,
  Modal,
  Select,
  Spinner,
  cn,
} from '@marketplace/ui';
import { OCCASION_OPTIONS } from '@marketplace/types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useAuth from '../../hooks/useAuth';
import { useCategories, type Category } from '../../hooks/useCategories';
import { useSellerProfile } from '../../hooks/seller/useSellerProfile';
import { useImageUpload, type UploadedImage } from '../../hooks/useSeller';
import { getApiErrorMessage } from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ListingFormData {
  listingType?: 'sale' | 'rent' | undefined;
  availableForPurchase: boolean;
  availableForRent: boolean;
  rentalPricePerDay?: string | undefined;
  rentalDeposit?: string | undefined;
  rentalThreeDayRate?: string | undefined;
  rentalWeeklyRate?: string | undefined;
  minRentalDurationDays?: string | undefined;
  maxRentalDurationDays?: string | undefined;
  rentalPickupLocation?: string | undefined;
  rentalNotes?: string | undefined;
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
  productDetails?:
    | {
        size?: string | undefined;
        color?: string | undefined;
        material?: string | undefined;
        gender?: string | undefined;
        style?: string | undefined;
        occasions?: string[] | undefined;
      }
    | null
    | undefined;
  // Rental information (conditional)
  rentalInfo?:
    | {
        rentalPricePerDay: string;
        rentalDeposit: string;
        rentalThreeDayRate?: string | undefined;
        rentalWeeklyRate?: string | undefined;
        minRentalDays: string;
        maxRentalDays?: string | undefined;
        pickupLocation?: string | undefined;
        rentalNotes?: string | undefined;
        quantity?: number | undefined;
      }
    | null
    | undefined;
  // Custom-made option
  customOrderAvailable: boolean;
  customDetails?:
    | {
        sizeAdjustments: boolean;
        colorFabricChanges: boolean;
        embroidery: boolean;
        otherCustomization: string;
        additionalCustomPrice: string;
        productionDays?: string | undefined;
      }
    | null
    | undefined;
}

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  initialListingType?: 'sale' | 'rent';
  onSubmit: (data: ListingFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  error?: string | null;
  onClearError?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CONDITIONS = [
  { value: '', label: 'Select condition' },
  { value: 'new', label: 'Brand New (Handmade / Tailored)' },
  { value: 'like_new', label: 'Like New (Worn once for celebration)' },
  { value: 'good', label: 'Good Condition (Gently used)' },
  { value: 'fair', label: 'Fair Condition (Visible wear)' },
];

const ETHIOPIAN_SIZES = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom Fit'];

const ETHIOPIAN_FABRICS = [
  'Pure Ethiopian Cotton (Shemane)',
  'Cotton with Silk Tilet',
  'Chiffon Kemis',
  'Linen & Cotton Blend',
  'Velvet & Gold Tilf',
  'Traditional Netela Wool/Cotton',
  'Other Traditional Fabric',
];

const ETHIOPIAN_STYLES = [
  'Classic Traditional Habesha',
  'Modern Fusion Kemis',
  'Bridal / Wedding Kemis',
  'Gondar Style',
  'Wollo Style',
  'Gojjam Style',
  'Tigray Style',
  'Oromo Cultural Dress',
  'Gurage Traditional',
  'Men Cultural Libs',
];

const ETHIOPIAN_GENDERS = [
  { value: 'Women', label: "Women's Fashion" },
  { value: 'Men', label: "Men's Fashion" },
  { value: 'Kids', label: "Baby & Kid's Fashion" },
  { value: 'Unisex', label: 'Unisex Cultural' },
];

function categoryLabel(cat: Category) {
  return cat.nameAm ? `${cat.name} (${cat.nameAm})` : cat.name;
}

// ─── Image Upload Component ──────────────────────────────────────────────────

interface ImageUploadSectionProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  error?: string | undefined;
}

function ImageUploadSection({ images, onImagesChange, error }: ImageUploadSectionProps) {
  const { uploadImages, isUploading, uploadProgress, uploadError, clearError } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const processBatchUpload = useCallback(
    async (fileList: File[]) => {
      setNotice(null);
      if (!fileList || fileList.length === 0) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB

      const validFiles: File[] = [];
      let skippedCount = 0;

      for (const file of fileList) {
        if (!allowedTypes.includes(file.type) || file.size > maxSizeBytes) {
          skippedCount++;
          continue;
        }
        validFiles.push(file);
      }

      if (skippedCount > 0) {
        setNotice(`Skipped ${skippedCount} file(s). Please use JPEG, PNG, or WebP under 5MB each.`);
      }

      if (validFiles.length === 0) return;

      const remainingSlots = 8 - images.length;
      if (remainingSlots <= 0) {
        setNotice('Maximum 8 photos limit reached.');
        return;
      }

      const batchToUpload = validFiles.slice(0, remainingSlots);
      if (validFiles.length > remainingSlots) {
        setNotice(`Added first ${remainingSlots} photo(s). Maximum 8 allowed.`);
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    void processBatchUpload(Array.from(files));
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
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    const files = Array.from(e.dataTransfer.files);
    void processBatchUpload(files);
  }

  function handleRemove(index: number) {
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, sortOrder: i }));
    onImagesChange(updated);
  }

  function handleMove(index: number, direction: 'left' | 'right') {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    const target = updated[targetIndex];
    if (temp && target) {
      updated[index] = target;
      updated[targetIndex] = temp;
      onImagesChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
    }
  }

  return (
    <div className="space-y-3">
      {uploadError && (
        <Alert variant="error" onDismiss={clearError}>
          {uploadError}
        </Alert>
      )}
      {notice && (
        <Alert variant="warning" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && <p className="text-destructive text-sm font-medium">{error}</p>}

      {/* Drop area */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 ring-primary/10 ring-4'
            : 'border-muted-foreground/20 hover:border-primary/50 bg-muted/20'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="listing-images-input"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div>
            <p className="text-foreground text-sm font-semibold">
              Add photos of your Ethiopian fashion item
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Select multiple photos at once or drag and drop (up to 8 photos)
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || images.length >= 8}
            className="mt-1"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                {uploadProgress
                  ? `Uploading (${uploadProgress.completed}/${uploadProgress.total})...`
                  : 'Uploading...'}
              </span>
            ) : (
              'Choose Photos'
            )}
          </Button>

          <span className="text-muted-foreground text-[11px]">
            {images.length}/8 photos • JPG, PNG, WebP up to 5MB • The 1st photo is your main cover
          </span>
        </div>
      </div>

      {/* Thumbnails list */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={img.cloudinaryPublicId || img.url}
              className="bg-muted group relative aspect-square overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow"
            >
              <img
                src={img.url}
                alt={`Product photo ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {index === 0 && (
                <div className="bg-primary text-primary-foreground absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow">
                  Main Photo
                </div>
              )}

              {/* Action bar overlay */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 opacity-90 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'left')}
                      className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                      title="Move left"
                      aria-label="Move photo left"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'right')}
                      className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                      title="Move right"
                      aria-label="Move photo right"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded bg-red-600/80 p-1 text-white hover:bg-red-600"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Category Selector ───────────────────────────────────────────────

interface CategoryPickerProps {
  value: string;
  onChange: (id: string, name: string) => void;
  error?: string | undefined;
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
      { value: '', label: 'Select fashion category' },
      ...roots.map((cat) => ({ value: cat.id, label: categoryLabel(cat) })),
    ],
    [roots],
  );

  const childOptions = useMemo(
    () => [
      { value: '', label: 'Select subcategory' },
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-foreground mb-1 block text-xs font-medium">Category</label>
          <div className="bg-muted/30 text-muted-foreground flex h-10 items-center gap-2 rounded-lg border px-3 text-xs">
            <Spinner size="sm" /> Loading fashion categories...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Select
        label="Category"
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

// ─── Main Form Component ─────────────────────────────────────────────────────

export default function ListingForm({
  initialData,
  initialListingType,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Submit for Review',
  error,
  onClearError,
}: ListingFormProps) {
  const user = useAuth((s) => s.user);
  const { data: sellerProfile } = useSellerProfile(user?.id ?? '');

  // Form State: Independent Sale & Rental capabilities
  const [availableForPurchase, setAvailableForPurchase] = useState<boolean>(
    initialData?.availableForPurchase ??
      (initialData?.listingType ? initialData.listingType === 'sale' : true),
  );
  const [availableForRent, setAvailableForRent] = useState<boolean>(
    initialData?.availableForRent ??
      (initialData?.listingType
        ? initialData.listingType === 'rent'
        : Boolean(initialData?.rentalInfo?.rentalPricePerDay)),
  );
  const [listingType, setListingType] = useState<'sale' | 'rent'>(
    initialListingType ?? initialData?.listingType ?? 'sale',
  );
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [price, setPrice] = useState(initialData?.price ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [categoryName, setCategoryName] = useState(initialData?.categoryName ?? '');
  const [city, setCity] = useState(
    initialData?.city ??
      sellerProfile?.location?.subCity ??
      sellerProfile?.location?.regionalHub ??
      'Addis Ababa',
  );
  const [condition, setCondition] = useState(initialData?.condition ?? 'new');
  const [images, setImages] = useState<UploadedImage[]>(initialData?.images ?? []);

  // Fashion Product Details
  const [size, setSize] = useState(initialData?.productDetails?.size ?? 'Free Size');
  const [color, setColor] = useState(initialData?.productDetails?.color ?? 'White & Gold Tilf');
  const [material, setMaterial] = useState(
    initialData?.productDetails?.material ?? 'Pure Ethiopian Cotton (Shemane)',
  );
  const [style, setStyle] = useState(
    initialData?.productDetails?.style ?? 'Classic Traditional Habesha',
  );
  const [gender, setGender] = useState(initialData?.productDetails?.gender ?? 'Women');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    initialData?.productDetails?.occasions ?? [],
  );

  const handleOccasionToggle = (occId: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occId) ? prev.filter((id) => id !== occId) : [...prev, occId],
    );
  };

  useEffect(() => {
    if (initialData?.productDetails?.occasions) {
      setSelectedOccasions(initialData.productDetails.occasions);
    }
  }, [initialData?.productDetails?.occasions]);

  // Rental Settings
  const [rentalPricePerDay, setRentalPricePerDay] = useState(
    initialData?.rentalPricePerDay ?? initialData?.rentalInfo?.rentalPricePerDay ?? '',
  );
  const [rentalDeposit, setRentalDeposit] = useState(
    initialData?.rentalDeposit ?? initialData?.rentalInfo?.rentalDeposit ?? '',
  );
  const [rentalThreeDayRate, setRentalThreeDayRate] = useState(
    initialData?.rentalThreeDayRate ?? initialData?.rentalInfo?.rentalThreeDayRate ?? '',
  );
  const [rentalWeeklyRate, setRentalWeeklyRate] = useState(
    initialData?.rentalWeeklyRate ?? initialData?.rentalInfo?.rentalWeeklyRate ?? '',
  );
  const [rentalQuantity, setRentalQuantity] = useState<number>(
    initialData?.rentalInfo?.quantity ?? 1,
  );
  const [minRentalDays, setMinRentalDays] = useState(
    initialData?.minRentalDurationDays ?? initialData?.rentalInfo?.minRentalDays ?? '3',
  );
  const [maxRentalDays, setMaxRentalDays] = useState(
    initialData?.maxRentalDurationDays ?? initialData?.rentalInfo?.maxRentalDays ?? '',
  );
  const [rentalPickupLocation, setRentalPickupLocation] = useState(
    initialData?.rentalPickupLocation ?? initialData?.rentalInfo?.pickupLocation ?? '',
  );
  const [rentalNotes, setRentalNotes] = useState(
    initialData?.rentalNotes ?? initialData?.rentalInfo?.rentalNotes ?? '',
  );

  // Custom-Made Option
  const [customOrderAvailable, setCustomOrderAvailable] = useState(
    initialData?.customOrderAvailable ?? false,
  );
  const [sizeAdjustments, setSizeAdjustments] = useState(
    initialData?.customDetails?.sizeAdjustments ?? true,
  );
  const [colorFabricChanges, setColorFabricChanges] = useState(
    initialData?.customDetails?.colorFabricChanges ?? true,
  );
  const [embroidery, setEmbroidery] = useState(initialData?.customDetails?.embroidery ?? true);
  const [otherCustomization, setOtherCustomization] = useState(
    initialData?.customDetails?.otherCustomization ?? '',
  );
  const [additionalCustomPrice, setAdditionalCustomPrice] = useState(
    initialData?.customDetails?.additionalCustomPrice ?? '',
  );
  const [productionDays, setProductionDays] = useState(
    initialData?.customDetails?.productionDays ?? '7',
  );

  // Contact Preferences
  const [inAppMessaging, setInAppMessaging] = useState(
    initialData?.contactOptions?.inAppMessaging ?? true,
  );
  const [showPhone, setShowPhone] = useState(
    initialData?.contactOptions?.showPhone ?? Boolean(sellerProfile?.phone || user?.phone),
  );
  const [whatsapp, setWhatsapp] = useState(
    initialData?.contactOptions?.whatsapp ?? sellerProfile?.phone ?? user?.phone ?? '',
  );
  const [telegram, setTelegram] = useState(initialData?.contactOptions?.telegram ?? '');

  // Validation & UI State
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  // Draft Storage Key
  const draftKey = useMemo(() => `habesha_draft_${user?.id || 'guest'}`, [user?.id]);

  // Check for existing draft on initial mount
  useEffect(() => {
    if (!initialData && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.title || parsed.images?.length > 0)) {
            setHasDraftNotice(true);
          }
        }
      } catch (_e) {
        // Ignore JSON parse errors
      }
    }
  }, [draftKey, initialData]);

  // Auto-save draft on changes (debounced)
  useEffect(() => {
    if (initialData || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      try {
        const draftData = {
          listingType,
          title,
          description,
          price,
          categoryId,
          categoryName,
          city,
          condition,
          images,
          productDetails: { size, color, material, style, gender, occasions: selectedOccasions },
          rentalInfo: {
            rentalPricePerDay,
            rentalDeposit,
            rentalThreeDayRate,
            rentalWeeklyRate,
            minRentalDays,
            maxRentalDays,
            pickupLocation: rentalPickupLocation,
            rentalNotes,
            quantity: rentalQuantity,
          },
          customOrderAvailable,
          customDetails: {
            sizeAdjustments,
            colorFabricChanges,
            embroidery,
            otherCustomization,
            additionalCustomPrice,
            productionDays,
          },
          contactOptions: { inAppMessaging, showPhone, whatsapp, telegram },
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
      } catch (_e) {
        // quota exceeded or storage disabled
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    draftKey,
    initialData,
    listingType,
    title,
    description,
    price,
    categoryId,
    categoryName,
    city,
    condition,
    images,
    size,
    color,
    material,
    style,
    gender,
    selectedOccasions,
    rentalPricePerDay,
    rentalDeposit,
    rentalThreeDayRate,
    rentalWeeklyRate,
    minRentalDays,
    maxRentalDays,
    rentalPickupLocation,
    rentalNotes,
    rentalQuantity,
    customOrderAvailable,
    sizeAdjustments,
    colorFabricChanges,
    embroidery,
    otherCustomization,
    additionalCustomPrice,
    productionDays,
    inAppMessaging,
    showPhone,
    whatsapp,
    telegram,
  ]);

  function restoreDraft() {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.listingType) setListingType(d.listingType);
      if (d.title) setTitle(d.title);
      if (d.description) setDescription(d.description);
      if (d.price) setPrice(d.price);
      if (d.categoryId) setCategoryId(d.categoryId);
      if (d.categoryName) setCategoryName(d.categoryName);
      if (d.city) setCity(d.city);
      if (d.condition) setCondition(d.condition);
      if (Array.isArray(d.images)) setImages(d.images);
      if (d.productDetails) {
        if (d.productDetails.size) setSize(d.productDetails.size);
        if (d.productDetails.color) setColor(d.productDetails.color);
        if (d.productDetails.material) setMaterial(d.productDetails.material);
        if (d.productDetails.style) setStyle(d.productDetails.style);
        if (d.productDetails.gender) setGender(d.productDetails.gender);
        if (Array.isArray(d.productDetails.occasions))
          setSelectedOccasions(d.productDetails.occasions);
      }
      if (d.rentalInfo) {
        if (d.rentalInfo.rentalPricePerDay) setRentalPricePerDay(d.rentalInfo.rentalPricePerDay);
        if (d.rentalInfo.rentalDeposit) setRentalDeposit(d.rentalInfo.rentalDeposit);
        if (d.rentalInfo.rentalThreeDayRate) setRentalThreeDayRate(d.rentalInfo.rentalThreeDayRate);
        if (d.rentalInfo.rentalWeeklyRate) setRentalWeeklyRate(d.rentalInfo.rentalWeeklyRate);
        if (d.rentalInfo.minRentalDays) setMinRentalDays(d.rentalInfo.minRentalDays);
        if (d.rentalInfo.maxRentalDays) setMaxRentalDays(d.rentalInfo.maxRentalDays);
        if (d.rentalInfo.pickupLocation) setRentalPickupLocation(d.rentalInfo.pickupLocation);
        if (d.rentalInfo.rentalNotes) setRentalNotes(d.rentalInfo.rentalNotes);
        if (d.rentalInfo.quantity) setRentalQuantity(d.rentalInfo.quantity);
      }
      if (d.customOrderAvailable !== undefined) setCustomOrderAvailable(d.customOrderAvailable);
      if (d.customDetails) {
        if (d.customDetails.sizeAdjustments !== undefined)
          setSizeAdjustments(d.customDetails.sizeAdjustments);
        if (d.customDetails.colorFabricChanges !== undefined)
          setColorFabricChanges(d.customDetails.colorFabricChanges);
        if (d.customDetails.embroidery !== undefined) setEmbroidery(d.customDetails.embroidery);
        if (d.customDetails.otherCustomization)
          setOtherCustomization(d.customDetails.otherCustomization);
        if (d.customDetails.additionalCustomPrice)
          setAdditionalCustomPrice(d.customDetails.additionalCustomPrice);
        if (d.customDetails.productionDays) setProductionDays(d.customDetails.productionDays);
      }
      if (d.contactOptions) {
        if (d.contactOptions.inAppMessaging !== undefined)
          setInAppMessaging(d.contactOptions.inAppMessaging);
        if (d.contactOptions.showPhone !== undefined) setShowPhone(d.contactOptions.showPhone);
        if (d.contactOptions.whatsapp) setWhatsapp(d.contactOptions.whatsapp);
        if (d.contactOptions.telegram) setTelegram(d.contactOptions.telegram);
      }
      setHasDraftNotice(false);
    } catch (_e) {
      setHasDraftNotice(false);
    }
  }

  function discardDraft() {
    try {
      localStorage.removeItem(draftKey);
    } catch (_e) {
      // ignore
    }
    setHasDraftNotice(false);
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (images.length === 0) {
      errors.images = 'Please upload at least one photo of the item.';
    }

    if (!title.trim() || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }

    if (!categoryId) {
      errors.categoryId = 'Please select a fashion category.';
    }

    if (!description.trim() || description.trim().length < 10) {
      errors.description = 'Please provide a description (at least 10 characters).';
    }

    if (!condition) {
      errors.condition = 'Please select the condition.';
    }

    if (!availableForPurchase && !availableForRent && !customOrderAvailable) {
      errors.availableForPurchase =
        'Please enable at least one option: For Sale, Available for Rent, or Custom Made.';
    }

    if (availableForPurchase) {
      if (!price || Number(price) <= 0) {
        errors.price = 'Please enter a valid sale price in ETB.';
      }
    }

    if (availableForRent) {
      if (!rentalPricePerDay || Number(rentalPricePerDay) <= 0) {
        errors.rentalPricePerDay = 'Daily rental price is required (ETB/day).';
      }
      if (rentalDeposit === '' || Number(rentalDeposit) < 0) {
        errors.rentalDeposit = 'Security deposit is required.';
      }
      if (!minRentalDays || Number(minRentalDays) < 1) {
        errors.minRentalDays = 'Minimum rental period must be at least 1 day.';
      }
      if (maxRentalDays && Number(maxRentalDays) < Number(minRentalDays)) {
        errors.maxRentalDays =
          'Maximum rental duration cannot be less than minimum rental duration.';
      }
      if (!rentalPickupLocation.trim() && !city.trim()) {
        errors.rentalPickupLocation = 'Pickup location is required for rentals.';
      }
    }

    if (!inAppMessaging && !showPhone && !whatsapp.trim() && !telegram.trim()) {
      errors.contact = 'Please enable at least one contact method for buyers.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to the first error
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (onClearError) onClearError();

    if (!validate()) return;

    onSubmit({
      listingType: availableForRent && !availableForPurchase ? 'rent' : 'sale',
      availableForPurchase,
      availableForRent,
      rentalPricePerDay: availableForRent ? rentalPricePerDay : undefined,
      rentalDeposit: availableForRent ? rentalDeposit : undefined,
      rentalThreeDayRate: availableForRent && rentalThreeDayRate ? rentalThreeDayRate : undefined,
      rentalWeeklyRate: availableForRent && rentalWeeklyRate ? rentalWeeklyRate : undefined,
      minRentalDurationDays: availableForRent ? minRentalDays : undefined,
      maxRentalDurationDays: availableForRent && maxRentalDays ? maxRentalDays : undefined,
      rentalPickupLocation: availableForRent
        ? rentalPickupLocation.trim() || city.trim()
        : undefined,
      rentalNotes: availableForRent && rentalNotes.trim() ? rentalNotes.trim() : undefined,
      title: title.trim(),
      description: description.trim(),
      price: availableForPurchase ? price : rentalPricePerDay || '0',
      categoryId,
      categoryName,
      city: city.trim(),
      condition,
      images,
      productDetails: {
        size,
        color,
        material,
        style,
        gender,
        occasions: selectedOccasions,
      },
      rentalInfo: availableForRent
        ? {
            rentalPricePerDay,
            rentalDeposit,
            rentalThreeDayRate: rentalThreeDayRate || undefined,
            rentalWeeklyRate: rentalWeeklyRate || undefined,
            minRentalDays,
            maxRentalDays: maxRentalDays || undefined,
            pickupLocation: rentalPickupLocation.trim() || city.trim(),
            rentalNotes: rentalNotes.trim() || undefined,
            quantity: rentalQuantity,
          }
        : null,
      customOrderAvailable,
      customDetails: customOrderAvailable
        ? {
            sizeAdjustments,
            colorFabricChanges,
            embroidery,
            otherCustomization,
            additionalCustomPrice,
            productionDays,
          }
        : null,
      contactOptions: {
        showPhone,
        whatsapp: whatsapp.trim(),
        telegram: telegram.trim(),
        inAppMessaging,
      },
    });
  }

  // ─── Buyer Card Live Preview Component ───────────────────────────────────

  const BuyerPreviewCard = (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm transition-all">
      <div className="bg-muted relative aspect-[4/3]">
        {images.length > 0 && images[0]?.url ? (
          <img
            src={images[0].url}
            alt={title || 'Product preview'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center">
            <svg
              className="mb-1 h-10 w-10 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Photo will appear here</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {availableForPurchase && (
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              For Sale
            </span>
          )}
          {availableForRent && (
            <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              For Rent
            </span>
          )}
          {customOrderAvailable && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm">
              Custom Made
            </span>
          )}
        </div>

        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            📷 {images.length}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-foreground line-clamp-1 text-sm font-semibold">
            {title || 'Your Ethiopian Fashion Title'}
          </h4>
          <span className="text-muted-foreground whitespace-nowrap text-xs">
            📍 {city || 'Addis Ababa'}
          </span>
        </div>

        {/* Price display */}
        <div className="space-y-1">
          {availableForPurchase && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-primary text-base font-bold">
                {price ? `${Number(price).toLocaleString()} ETB` : 'Price in ETB'}
              </span>
              <span className="text-muted-foreground text-[11px]">For Sale</span>
            </div>
          )}
          {availableForRent && (
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-sm font-bold text-amber-700">
                {rentalPricePerDay
                  ? `${Number(rentalPricePerDay).toLocaleString()} ETB / day`
                  : 'Rental rate in ETB'}
              </span>
              {rentalDeposit && (
                <span className="text-muted-foreground text-[11px]">
                  (Deposit: {Number(rentalDeposit).toLocaleString()} ETB)
                </span>
              )}
            </div>
          )}
          {availableForRent && (rentalThreeDayRate || rentalWeeklyRate) && (
            <div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px]">
              {rentalThreeDayRate && (
                <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-800 dark:text-amber-300">
                  🎉 3-Day Event: {Number(rentalThreeDayRate).toLocaleString()} ETB
                </span>
              )}
              {rentalWeeklyRate && (
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-800 dark:text-emerald-300">
                  🌟 Weekly: {Number(rentalWeeklyRate).toLocaleString()} ETB
                </span>
              )}
            </div>
          )}
        </div>

        {/* Fashion details tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {categoryName && (
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium">
              {categoryName.split('>').pop()?.trim()}
            </span>
          )}
          {size && (
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium">
              Size: {size}
            </span>
          )}
          {condition && (
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium capitalize">
              {condition.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Contact preview pills */}
        <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-xs">
          <span className="text-foreground font-medium">
            {sellerProfile?.displayName || user?.displayName || 'Your Seller Shop'}
          </span>
          <div className="flex items-center gap-1.5 text-[11px]">
            {inAppMessaging && <span className="text-primary font-medium">💬 Chat</span>}
            {(showPhone || whatsapp) && <span>📞 Direct</span>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      {/* Draft restoration banner */}
      {hasDraftNotice && (
        <div className="border-primary/20 bg-primary/5 flex flex-col items-start justify-between gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📝</span>
            <div>
              <p className="text-foreground text-xs font-semibold">Unsaved listing draft found</p>
              <p className="text-muted-foreground text-[11px]">
                You have work from a previous session. Would you like to restore it?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="primary" onClick={restoreDraft}>
              Restore Draft
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={discardDraft}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Main 2-column layout on desktop, single column on mobile */}
      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* Form Fields: 8 columns on large screens */}
        <div className="space-y-8 lg:col-span-8">
          {/* ════════ SECTION 1: PHOTOS ════════ */}
          <section id="field-images" className="bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
                  <span>📸</span> Photos
                </h3>
                <span className="text-muted-foreground text-xs font-medium">
                  {images.length}/8 uploaded
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Clear photos from different angles increase inquiries by 3×. The first photo is your
                main cover.
              </p>
            </div>

            <ImageUploadSection
              images={images}
              onImagesChange={(imgs) => {
                setImages(imgs);
                if (validationErrors.images) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next.images;
                    return next;
                  });
                }
              }}
              error={validationErrors.images}
            />
          </section>

          {/* ════════ SECTION 2: BASIC INFORMATION ════════ */}
          <section className="bg-card space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
                <span>ℹ️</span> Basic Information
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Key details that help Ethiopian fashion buyers find your item.
              </p>
            </div>

            {/* Category */}
            <div id="field-categoryId">
              <CategoryPicker
                value={categoryId}
                onChange={(id, name) => {
                  setCategoryId(id);
                  setCategoryName(name);
                  if (validationErrors.categoryId) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.categoryId;
                      return next;
                    });
                  }
                }}
                error={validationErrors.categoryId}
              />
            </div>

            {/* Title */}
            <div id="field-title">
              <FormInput
                label="Product Title"
                placeholder="e.g. Traditional Handwoven Habesha Kemis with Royal Gold Tilf"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationErrors.title) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.title;
                      return next;
                    });
                  }
                }}
                required
                {...(validationErrors.title ? { error: validationErrors.title } : {})}
              />
            </div>

            {/* Description */}
            <div id="field-description">
              <FormTextarea
                label="Description"
                placeholder="Describe fabric craftsmanship, embroidery details, fit, occasion (weddings, festivals, holidays), and care instructions..."
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationErrors.description) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.description;
                      return next;
                    });
                  }
                }}
                required
                {...(validationErrors.description ? { error: validationErrors.description } : {})}
              />
            </div>

            {/* Condition & Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div id="field-condition">
                <FormSelect
                  label="Condition"
                  options={CONDITIONS}
                  value={condition}
                  onChange={(e) => {
                    setCondition(e.target.value);
                    if (validationErrors.condition) {
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next.condition;
                        return next;
                      });
                    }
                  }}
                  required
                  {...(validationErrors.condition ? { error: validationErrors.condition } : {})}
                />
              </div>

              <div>
                <FormInput
                  label="Location / City"
                  placeholder="e.g. Addis Ababa (Bole)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          {/* ════════ SECTION 3: FASHION & GARMENT DETAILS ════════ */}
          <section className="bg-card space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
                <span>👗</span> Fashion & Garment Details
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Attributes tailored to traditional and modern Ethiopian fashion.
              </p>
            </div>

            {/* Target Audience / Gender */}
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">
                Category Group
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ETHIOPIAN_GENDERS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      gender === g.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="text-foreground mb-1.5 block text-xs font-medium">Size</label>
              <div className="flex flex-wrap gap-1.5">
                {ETHIOPIAN_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      size === s
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Cultural Style & Fabric */}
            <div className="grid gap-4 pt-1 sm:grid-cols-2">
              <div>
                <label className="text-foreground mb-1 block text-xs font-medium">
                  Cultural Style / Design
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2"
                >
                  {ETHIOPIAN_STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-medium">
                  Fabric / Material
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="bg-background text-foreground focus:ring-primary/30 w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2"
                >
                  {ETHIOPIAN_FABRICS.map((fb) => (
                    <option key={fb} value={fb}>
                      {fb}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Color / Tilf */}
            <div>
              <FormInput
                label="Color & Embroidery (Tilf) Details"
                placeholder="e.g. White with Gold and Emerald Tilf"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            {/* Suitable Occasions (Shop by Occasion) */}
            <div className="pt-2">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-foreground block text-xs font-semibold">
                  Suitable Occasion(s) / የተመረጠበት አጋጣሚ
                </label>
                <span className="text-muted-foreground text-[11px] font-normal">
                  Select all that apply
                </span>
              </div>
              <p className="text-muted-foreground mb-3 text-[11px]">
                Select which celebrations or events your piece is designed for to help buyers find
                it in category & occasion searches.
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {OCCASION_OPTIONS.map((occ) => {
                  const isSelected = selectedOccasions.includes(occ.id);
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => handleOccasionToggle(occ.id)}
                      className={cn(
                        'flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition-all',
                        isSelected
                          ? 'shadow-xs border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-border/60 bg-background/60 hover:bg-muted/50 text-foreground',
                      )}
                    >
                      <span className="mt-0.5 shrink-0 text-xl">{occ.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-bold">{occ.label}</span>
                          <span className="text-muted-foreground shrink-0 text-[10px] font-medium">
                            {occ.labelAm}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[10px]">
                          {occ.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors',
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-muted-foreground/30 bg-background',
                        )}
                      >
                        {isSelected && '✓'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ════════ SECTION 4: PRICING & RENTAL AVAILABILITY ════════ */}
          <section className="bg-card space-y-6 rounded-2xl border p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
                <span>💰</span> Pricing & Availability
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Enable selling, renting, or custom ordering for this fashion piece. Listings can
                support multiple capabilities simultaneously.
              </p>
              {validationErrors.availableForPurchase && (
                <p className="text-destructive mt-1 text-xs font-medium">
                  {validationErrors.availableForPurchase}
                </p>
              )}
            </div>

            {/* Sale Capability */}
            <div className="bg-muted/20 space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    checked={availableForPurchase}
                    onChange={(e) => setAvailableForPurchase(e.target.checked)}
                    className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-foreground text-sm font-semibold">
                    🏷️ Available for Sale
                  </span>
                </label>
                {availableForPurchase && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Active
                  </span>
                )}
              </div>

              {availableForPurchase && (
                <div id="field-price" className="max-w-xs pt-1">
                  <FormInput
                    label="Sale Price (ETB)"
                    placeholder="e.g. 3500"
                    type="number"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (validationErrors.price) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.price;
                          return next;
                        });
                      }
                    }}
                    required
                    {...(validationErrors.price ? { error: validationErrors.price } : {})}
                  />
                  <span className="text-muted-foreground mt-1 block text-[11px]">
                    Buyers can arrange purchase with you directly.
                  </span>
                </div>
              )}
            </div>

            {/* Rental Capability (Progressive Disclosure) */}
            <div className="bg-muted/20 space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    id="field-availableForRent"
                    type="checkbox"
                    checked={availableForRent}
                    onChange={(e) => setAvailableForRent(e.target.checked)}
                    className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-foreground text-sm font-semibold">
                    📅 Available for Rent
                  </span>
                </label>
                {availableForRent && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Active
                  </span>
                )}
              </div>

              {availableForRent && (
                <div className="space-y-4 border-t pt-2">
                  <p className="text-muted-foreground text-xs">
                    Rent out this fashion piece for ceremonies, weddings, and celebrations. Renters
                    arrange payment, security deposit, and pickup directly with you.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div id="field-rentalPricePerDay">
                      <FormInput
                        label="Rental Price (ETB / day) *"
                        placeholder="e.g. 800"
                        type="number"
                        value={rentalPricePerDay}
                        onChange={(e) => {
                          setRentalPricePerDay(e.target.value);
                          if (validationErrors.rentalPricePerDay) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.rentalPricePerDay;
                              return next;
                            });
                          }
                        }}
                        required
                        {...(validationErrors.rentalPricePerDay
                          ? { error: validationErrors.rentalPricePerDay }
                          : {})}
                      />
                    </div>

                    <div id="field-rentalDeposit">
                      <FormInput
                        label="Security Deposit (ETB) *"
                        placeholder="e.g. 5000"
                        type="number"
                        value={rentalDeposit}
                        onChange={(e) => {
                          setRentalDeposit(e.target.value);
                          if (validationErrors.rentalDeposit) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.rentalDeposit;
                              return next;
                            });
                          }
                        }}
                        required
                        {...(validationErrors.rentalDeposit
                          ? { error: validationErrors.rentalDeposit }
                          : {})}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div id="field-minRentalDays">
                      <FormInput
                        label="Minimum Rental Period (days) *"
                        placeholder="e.g. 3"
                        type="number"
                        min="1"
                        value={minRentalDays}
                        onChange={(e) => {
                          setMinRentalDays(e.target.value);
                          if (validationErrors.minRentalDays) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.minRentalDays;
                              return next;
                            });
                          }
                        }}
                        required
                        {...(validationErrors.minRentalDays
                          ? { error: validationErrors.minRentalDays }
                          : {})}
                      />
                    </div>

                    <div id="field-maxRentalDays">
                      <FormInput
                        label="Maximum Rental Period (days)"
                        placeholder="e.g. 30 (Optional)"
                        type="number"
                        min="1"
                        value={maxRentalDays}
                        onChange={(e) => {
                          setMaxRentalDays(e.target.value);
                          if (validationErrors.maxRentalDays) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.maxRentalDays;
                              return next;
                            });
                          }
                        }}
                        {...(validationErrors.maxRentalDays
                          ? { error: validationErrors.maxRentalDays }
                          : {})}
                      />
                    </div>
                  </div>

                  {/* Multi-Day Package Deals (Ethiopian Ceremony & Wedding Best Practices) */}
                  <div className="border-primary/20 bg-primary/5 space-y-3 rounded-lg border p-3.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">✨</span>
                        <h4 className="text-foreground text-xs font-semibold">
                          Special Multi-Day Package Rates (Optional & Recommended)
                        </h4>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Traditional Habesha attire (Kemis, Kabas) has a natural 3-day rhythm
                        (Pickup/Fitting, Event day, Return). Offering bundled package rates attracts
                        wedding guests and reduces turnover stress.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div id="field-rentalThreeDayRate">
                        <FormInput
                          label="3-Day Event / Weekend Package (ETB)"
                          placeholder={
                            rentalPricePerDay
                              ? String(Math.round(Number(rentalPricePerDay) * 2.5))
                              : 'e.g. 2200'
                          }
                          type="number"
                          value={rentalThreeDayRate}
                          onChange={(e) => setRentalThreeDayRate(e.target.value)}
                          helperText="Discounted flat rate for 3-day event rentals"
                        />
                      </div>

                      <div id="field-rentalWeeklyRate">
                        <FormInput
                          label="7-Day Weekly / Holiday Package (ETB)"
                          placeholder={
                            rentalPricePerDay
                              ? String(Math.round(Number(rentalPricePerDay) * 5))
                              : 'e.g. 4500'
                          }
                          type="number"
                          value={rentalWeeklyRate}
                          onChange={(e) => setRentalWeeklyRate(e.target.value)}
                          helperText="Flat rate for holidays (Timkat, Enkutatash) or destination events"
                        />
                      </div>
                    </div>
                  </div>

                  <div id="field-rentalPickupLocation">
                    <FormInput
                      label="Pickup / Return Location or Method *"
                      placeholder="e.g. Seller pickup at shop in Bole, Addis Ababa"
                      type="text"
                      value={rentalPickupLocation}
                      onChange={(e) => {
                        setRentalPickupLocation(e.target.value);
                        if (validationErrors.rentalPickupLocation) {
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next.rentalPickupLocation;
                            return next;
                          });
                        }
                      }}
                      required
                      {...(validationErrors.rentalPickupLocation
                        ? { error: validationErrors.rentalPickupLocation }
                        : {})}
                    />
                  </div>

                  <div>
                    <FormTextarea
                      label="Rental Notes / Instructions [Optional]"
                      placeholder="e.g. Dry cleaning handled upon return. Renter must present valid ID upon pickup."
                      rows={2}
                      value={rentalNotes}
                      onChange={(e) => setRentalNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ════════ SECTION 5: CUSTOM-MADE OPTION ════════ */}
          <section className="bg-card space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
                  <span>✨</span> Custom-Made Option
                </h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Can this dress or outfit be tailored to a buyer&apos;s specific measurements or
                  color request?
                </p>
              </div>

              {/* Yes / No Toggle */}
              <div className="bg-muted/40 flex rounded-lg border p-0.5">
                <button
                  type="button"
                  onClick={() => setCustomOrderAvailable(false)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    !customOrderAvailable
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setCustomOrderAvailable(true)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    customOrderAvailable
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {/* Custom details (Progressive disclosure) */}
            {customOrderAvailable && (
              <div className="space-y-4 border-t pt-3">
                <p className="text-muted-foreground text-xs">
                  Select what customization options you offer for this listing:
                </p>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <label className="hover:bg-muted/30 flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5">
                    <Checkbox
                      checked={sizeAdjustments}
                      onChange={(e) => setSizeAdjustments(e.target.checked)}
                    />
                    <span className="text-xs font-medium">Bespoke Measurements</span>
                  </label>

                  <label className="hover:bg-muted/30 flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5">
                    <Checkbox
                      checked={colorFabricChanges}
                      onChange={(e) => setColorFabricChanges(e.target.checked)}
                    />
                    <span className="text-xs font-medium">Color & Fabric Variations</span>
                  </label>

                  <label className="hover:bg-muted/30 flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5">
                    <Checkbox
                      checked={embroidery}
                      onChange={(e) => setEmbroidery(e.target.checked)}
                    />
                    <span className="text-xs font-medium">Custom Tilf Patterns</span>
                  </label>
                </div>

                <div className="grid gap-4 pt-1 sm:grid-cols-2">
                  <div>
                    <FormInput
                      label="Tailoring / Production Time (Days)"
                      type="number"
                      placeholder="e.g. 7"
                      value={productionDays}
                      onChange={(e) => setProductionDays(e.target.value)}
                    />
                    <span className="text-muted-foreground mt-1 block text-[11px]">
                      Estimated days needed to tailor and prepare the custom order.
                    </span>
                  </div>

                  <div>
                    <FormInput
                      label="Custom Order Starting Price (ETB) - Optional"
                      type="number"
                      placeholder="e.g. 500"
                      value={additionalCustomPrice}
                      onChange={(e) => setAdditionalCustomPrice(e.target.value)}
                    />
                    <span className="text-muted-foreground mt-1 block text-[11px]">
                      Starting custom price or base customization surcharge.
                    </span>
                  </div>
                </div>

                <div>
                  <FormInput
                    label="Customization Instructions (Optional)"
                    placeholder="e.g. Provide bust, waist, and shoulder-to-floor measurements in inches or cm."
                    value={otherCustomization}
                    onChange={(e) => setOtherCustomization(e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ════════ SECTION 6: CONTACT PREFERENCES ════════ */}
          <section
            id="field-contact"
            className="bg-card space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6"
          >
            <div>
              <h3 className="text-foreground flex items-center gap-2 text-base font-semibold">
                <span>📞</span> Contact Preferences
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                How should interested buyers reach you? Reused automatically from your seller
                profile.
              </p>
            </div>

            {validationErrors.contact && (
              <p className="text-destructive text-xs font-medium">{validationErrors.contact}</p>
            )}

            <div className="space-y-3">
              <label className="hover:bg-muted/30 flex cursor-pointer items-start gap-3 rounded-xl border p-3">
                <Checkbox
                  checked={inAppMessaging}
                  onChange={(e) => setInAppMessaging(e.target.checked)}
                />
                <div>
                  <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                    Platform Chat{' '}
                    <span className="bg-primary/10 py-0.2 text-primary rounded px-1.5 text-[10px]">
                      Recommended
                    </span>
                  </span>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Receive instant messages securely within Habesha Market.
                  </p>
                </div>
              </label>

              <label className="hover:bg-muted/30 flex cursor-pointer items-start gap-3 rounded-xl border p-3">
                <Checkbox checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />
                <div>
                  <span className="text-foreground text-xs font-semibold">Phone Call</span>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Display your verified phone number to buyers on the listing page.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid gap-4 pt-1 sm:grid-cols-2">
              <div>
                <FormInput
                  label="WhatsApp Number (Optional)"
                  placeholder="e.g. +251911123456"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                <span className="text-muted-foreground mt-1 block text-[11px]">
                  Enables a 1-click &quot;Chat on WhatsApp&quot; button for buyers.
                </span>
              </div>

              <div>
                <FormInput
                  label="Telegram Username (Optional)"
                  placeholder="e.g. @ethio_fashion"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ════════ SUBMIT ACTION & ERROR REPORTING ════════ */}
          <div className="space-y-4 pt-2">
            {/* Single clean error location right above the primary submit button */}
            {error && (
              <Alert variant="error" {...(onClearError ? { onDismiss: onClearError } : {})}>
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Submission Error</p>
                  <p className="text-xs">
                    {typeof error === 'string' ? error : getApiErrorMessage(error)}
                  </p>
                </div>
              </Alert>
            )}

            <div className="bg-muted/30 flex flex-col items-center justify-between gap-4 rounded-2xl border p-4 sm:flex-row">
              <div className="text-muted-foreground text-xs">
                <p className="text-foreground font-medium">Listing Approval Process</p>
                <p className="mt-0.5 text-[11px]">
                  Your listing will be submitted to our admin team for quality review before
                  publishing.
                </p>
              </div>

              <div className="flex w-full items-center gap-3 sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex-1 sm:flex-initial"
                >
                  Preview
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[160px] flex-1 sm:flex-initial"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" /> Submitting...
                    </span>
                  ) : (
                    submitLabel
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar (Desktop): Live Buyer Card Preview */}
        <div className="sticky top-24 hidden space-y-4 lg:col-span-4 lg:block">
          <div className="flex items-center justify-between">
            <h4 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
              Live Buyer Preview
            </h4>
            <span className="text-primary text-[11px] font-medium">Updates live</span>
          </div>

          {BuyerPreviewCard}

          <div className="bg-card text-muted-foreground space-y-1 rounded-xl border p-3 text-xs">
            <p className="text-foreground text-[11px] font-semibold">💡 Seller Tip</p>
            <p className="text-[11px] leading-relaxed">
              Listings with detailed cultural fabric info and clear Habesha Kemis photos receive 3×
              more calls and inquiries.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Preview Modal */}
      <Modal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Buyer Listing Preview"
      >
        <div className="space-y-4 p-4">
          {BuyerPreviewCard}
          <div className="flex justify-end">
            <Button type="button" onClick={() => setIsPreviewOpen(false)}>
              Back to Editing
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
