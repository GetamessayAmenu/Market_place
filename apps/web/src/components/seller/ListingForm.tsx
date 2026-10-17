"use client"

import { Alert, Button, Checkbox, FormInput, FormSelect, FormTextarea, Modal, Select, Spinner } from '@marketplace/ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useAuth from '../../hooks/useAuth';
import { useCategories, type Category } from '../../hooks/useCategories';
import { useSellerProfile } from '../../hooks/seller/useSellerProfile';
import { useImageUpload, type UploadedImage } from '../../hooks/useSeller';
import { getApiErrorMessage } from '../../lib/api';

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
    quantity?: number;
  } | null;
  // Custom-made option
  customOrderAvailable: boolean;
  customDetails?: {
    sizeAdjustments: boolean;
    colorFabricChanges: boolean;
    embroidery: boolean;
    otherCustomization: string;
    additionalCustomPrice: string;
    productionDays?: string;
  } | null;
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

const ETHIOPIAN_SIZES = [
  'Free Size',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'Custom Fit',
];

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
    const updated = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }));
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
      {uploadError && <Alert variant="error" onDismiss={clearError}>{uploadError}</Alert>}
      {notice && <Alert variant="warning" onDismiss={() => setNotice(null)}>{notice}</Alert>}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {/* Drop area */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              Add photos of your Ethiopian fashion item
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
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

          <span className="text-[11px] text-muted-foreground">
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
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted shadow-sm transition-all hover:shadow"
            >
              <img
                src={img.url}
                alt={`Product photo ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {index === 0 && (
                <div className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
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
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
          <label className="block text-xs font-medium text-foreground mb-1">Category</label>
          <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/30 px-3 text-xs text-muted-foreground">
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

  // Form State
  const [listingType, setListingType] = useState<'sale' | 'rent'>(
    initialListingType ?? initialData?.listingType ?? 'sale',
  );
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [price, setPrice] = useState(initialData?.price ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [categoryName, setCategoryName] = useState(initialData?.categoryName ?? '');
  const [city, setCity] = useState(
    initialData?.city ?? sellerProfile?.location?.subCity ?? sellerProfile?.location?.regionalHub ?? 'Addis Ababa',
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

  // Rental Settings
  const [rentalPricePerDay, setRentalPricePerDay] = useState(
    initialData?.rentalInfo?.rentalPricePerDay ?? '',
  );
  const [rentalDeposit, setRentalDeposit] = useState(
    initialData?.rentalInfo?.rentalDeposit ?? '',
  );
  const [rentalQuantity, setRentalQuantity] = useState<number>(
    initialData?.rentalInfo?.quantity ?? 1,
  );
  const [minRentalDays, setMinRentalDays] = useState(
    initialData?.rentalInfo?.minRentalDays ?? '1',
  );
  const [maxRentalDays, setMaxRentalDays] = useState(
    initialData?.rentalInfo?.maxRentalDays ?? '30',
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
  const [embroidery, setEmbroidery] = useState(
    initialData?.customDetails?.embroidery ?? true,
  );
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
  const [telegram, setTelegram] = useState(
    initialData?.contactOptions?.telegram ?? '',
  );

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
          productDetails: { size, color, material, style, gender },
          rentalInfo: { rentalPricePerDay, rentalDeposit, minRentalDays, maxRentalDays, quantity: rentalQuantity },
          customOrderAvailable,
          customDetails: { sizeAdjustments, colorFabricChanges, embroidery, otherCustomization, additionalCustomPrice, productionDays },
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
    rentalPricePerDay,
    rentalDeposit,
    minRentalDays,
    maxRentalDays,
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
      }
      if (d.rentalInfo) {
        if (d.rentalInfo.rentalPricePerDay) setRentalPricePerDay(d.rentalInfo.rentalPricePerDay);
        if (d.rentalInfo.rentalDeposit) setRentalDeposit(d.rentalInfo.rentalDeposit);
        if (d.rentalInfo.minRentalDays) setMinRentalDays(d.rentalInfo.minRentalDays);
        if (d.rentalInfo.maxRentalDays) setMaxRentalDays(d.rentalInfo.maxRentalDays);
        if (d.rentalInfo.quantity) setRentalQuantity(d.rentalInfo.quantity);
      }
      if (d.customOrderAvailable !== undefined) setCustomOrderAvailable(d.customOrderAvailable);
      if (d.customDetails) {
        if (d.customDetails.sizeAdjustments !== undefined) setSizeAdjustments(d.customDetails.sizeAdjustments);
        if (d.customDetails.colorFabricChanges !== undefined) setColorFabricChanges(d.customDetails.colorFabricChanges);
        if (d.customDetails.embroidery !== undefined) setEmbroidery(d.customDetails.embroidery);
        if (d.customDetails.otherCustomization) setOtherCustomization(d.customDetails.otherCustomization);
        if (d.customDetails.additionalCustomPrice) setAdditionalCustomPrice(d.customDetails.additionalCustomPrice);
        if (d.customDetails.productionDays) setProductionDays(d.customDetails.productionDays);
      }
      if (d.contactOptions) {
        if (d.contactOptions.inAppMessaging !== undefined) setInAppMessaging(d.contactOptions.inAppMessaging);
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

    if (listingType === 'sale') {
      if (!price || Number(price) <= 0) {
        errors.price = 'Please enter a valid sale price in ETB.';
      }
    }

    if (listingType === 'rent') {
      if (!rentalPricePerDay || Number(rentalPricePerDay) <= 0) {
        errors.rentalPricePerDay = 'Daily rental price is required.';
      }
      if (!rentalDeposit || Number(rentalDeposit) < 0) {
        errors.rentalDeposit = 'Security deposit is required.';
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
      listingType,
      title: title.trim(),
      description: description.trim(),
      price: listingType === 'sale' ? price : (rentalPricePerDay || price || '0'),
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
      },
      rentalInfo:
        listingType === 'rent'
          ? {
              rentalPricePerDay,
              rentalDeposit,
              minRentalDays,
              maxRentalDays,
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
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-all">
      <div className="relative aspect-[4/3] bg-muted">
        {images.length > 0 && images[0]?.url ? (
          <img
            src={images[0].url}
            alt={title || 'Product preview'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
            <svg className="h-10 w-10 mb-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Photo will appear here</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm ${
            listingType === 'sale' ? 'bg-emerald-600' : 'bg-amber-600'
          }`}>
            {listingType === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
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

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-foreground text-sm line-clamp-1">
            {title || 'Your Ethiopian Fashion Title'}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            📍 {city || 'Addis Ababa'}
          </span>
        </div>

        {/* Price display */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-primary">
            {listingType === 'sale'
              ? (price ? `${Number(price).toLocaleString()} ETB` : 'Price in ETB')
              : (rentalPricePerDay ? `${Number(rentalPricePerDay).toLocaleString()} ETB / day` : 'Rental rate in ETB')}
          </span>
          {listingType === 'rent' && rentalDeposit && (
            <span className="text-[11px] text-muted-foreground">
              (+{Number(rentalDeposit).toLocaleString()} deposit)
            </span>
          )}
        </div>

        {/* Fashion details tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {categoryName && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
              {categoryName.split('>').pop()?.trim()}
            </span>
          )}
          {size && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
              Size: {size}
            </span>
          )}
          {condition && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium capitalize">
              {condition.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Contact preview pills */}
        <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📝</span>
            <div>
              <p className="text-xs font-semibold text-foreground">Unsaved listing draft found</p>
              <p className="text-[11px] text-muted-foreground">
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
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Form Fields: 8 columns on large screens */}
        <div className="space-y-8 lg:col-span-8">

          {/* ════════ SECTION 1: PHOTOS ════════ */}
          <section id="field-images" className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>📸</span> Photos
                </h3>
                <span className="text-xs font-medium text-muted-foreground">
                  {images.length}/8 uploaded
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clear photos from different angles increase inquiries by 3×. The first photo is your main cover.
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
          <section className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>ℹ️</span> Basic Information
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
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
          <section className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>👗</span> Fashion & Garment Details
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Attributes tailored to traditional and modern Ethiopian fashion.
              </p>
            </div>

            {/* Target Audience / Gender */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
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
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Size
              </label>
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
            <div className="grid gap-4 sm:grid-cols-2 pt-1">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Cultural Style / Design
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {ETHIOPIAN_STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Fabric / Material
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
          </section>

          {/* ════════ SECTION 4: LISTING TYPE & PRICING ════════ */}
          <section className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>💰</span> Listing Type & Pricing
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose whether you are selling this fashion piece or offering it for temporary rental.
              </p>
            </div>

            {/* Segmented Switch: Sale vs Rent */}
            <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-muted/50 border">
              <button
                type="button"
                onClick={() => setListingType('sale')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  listingType === 'sale'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🏷️</span> For Sale
              </button>

              <button
                type="button"
                onClick={() => setListingType('rent')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  listingType === 'rent'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>📅</span> For Rent
              </button>
            </div>

            {/* Sale Fields */}
            {listingType === 'sale' && (
              <div id="field-price" className="space-y-4 pt-1">
                <div className="max-w-xs">
                  <FormInput
                    label="Price (ETB)"
                    placeholder="e.g. 5500"
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
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    Buyers contact you directly through chat or phone to arrange purchase.
                  </span>
                </div>
              </div>
            )}

            {/* Rental Fields */}
            {listingType === 'rent' && (
              <div className="space-y-4 pt-1">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div id="field-rentalPricePerDay">
                    <FormInput
                      label="Daily Rental Rate (ETB / day)"
                      placeholder="e.g. 350"
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
                      label="Refundable Security Deposit (ETB)"
                      placeholder="e.g. 1000"
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

                {/* Rental Copies & Duration */}
                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Identical Rental Copies Available
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRentalQuantity(Math.max(1, rentalQuantity - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30 text-foreground hover:bg-muted"
                      >
                        -
                      </button>
                      <span className="flex h-9 w-12 items-center justify-center font-semibold text-sm">
                        {rentalQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRentalQuantity(rentalQuantity + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30 text-foreground hover:bg-muted"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      Used internally to manage multiple identical rental copies. Not displayed as bulk inventory to buyers.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FormInput
                        label="Min Days"
                        type="number"
                        value={minRentalDays}
                        onChange={(e) => setMinRentalDays(e.target.value)}
                      />
                    </div>
                    <div>
                      <FormInput
                        label="Max Days"
                        type="number"
                        value={maxRentalDays}
                        onChange={(e) => setMaxRentalDays(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ════════ SECTION 5: CUSTOM-MADE OPTION ════════ */}
          <section className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>✨</span> Custom-Made Option
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Can this dress or outfit be tailored to a buyer&apos;s specific measurements or color request?
                </p>
              </div>

              {/* Yes / No Toggle */}
              <div className="flex rounded-lg border bg-muted/40 p-0.5">
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
              <div className="space-y-4 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Select what customization options you offer for this listing:
                </p>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <label className="flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer hover:bg-muted/30">
                    <Checkbox
                      checked={sizeAdjustments}
                      onChange={(e) => setSizeAdjustments(e.target.checked)}
                    />
                    <span className="text-xs font-medium">Bespoke Measurements</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer hover:bg-muted/30">
                    <Checkbox
                      checked={colorFabricChanges}
                      onChange={(e) => setColorFabricChanges(e.target.checked)}
                    />
                    <span className="text-xs font-medium">Color & Fabric Variations</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer hover:bg-muted/30">
                    <Checkbox
                      checked={embroidery}
                      onChange={(e) => setEmbroidery(e.target.checked)}
                    />
                    <span className="text-xs font-medium">Custom Tilf Patterns</span>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-1">
                  <div>
                    <FormInput
                      label="Tailoring / Production Time (Days)"
                      type="number"
                      placeholder="e.g. 7"
                      value={productionDays}
                      onChange={(e) => setProductionDays(e.target.value)}
                    />
                    <span className="text-[11px] text-muted-foreground block mt-1">
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
                    <span className="text-[11px] text-muted-foreground block mt-1">
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
          <section id="field-contact" className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span>📞</span> Contact Preferences
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                How should interested buyers reach you? Reused automatically from your seller profile.
              </p>
            </div>

            {validationErrors.contact && (
              <p className="text-xs font-medium text-destructive">{validationErrors.contact}</p>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/30">
                <Checkbox
                  checked={inAppMessaging}
                  onChange={(e) => setInAppMessaging(e.target.checked)}
                />
                <div>
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    Platform Chat <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">Recommended</span>
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Receive instant messages securely within Habesha Market.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/30">
                <Checkbox
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                />
                <div>
                  <span className="text-xs font-semibold text-foreground">Phone Call</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Display your verified phone number to buyers on the listing page.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-1">
              <div>
                <FormInput
                  label="WhatsApp Number (Optional)"
                  placeholder="e.g. +251911123456"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                <span className="text-[11px] text-muted-foreground block mt-1">
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
          <div className="pt-2 space-y-4">
            {/* Single clean error location right above the primary submit button */}
            {error && (
              <Alert variant="error" {...(onClearError ? { onDismiss: onClearError } : {})}>
                <div className="space-y-1">
                  <p className="font-semibold text-xs">Submission Error</p>
                  <p className="text-xs">{typeof error === 'string' ? error : getApiErrorMessage(error)}</p>
                </div>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Listing Approval Process</p>
                <p className="text-[11px] mt-0.5">
                  Your listing will be submitted to our admin team for quality review before publishing.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
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
                  className="flex-1 sm:flex-initial min-w-[160px]"
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
        <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Live Buyer Preview
            </h4>
            <span className="text-[11px] text-primary font-medium">Updates live</span>
          </div>

          {BuyerPreviewCard}

          <div className="rounded-xl border bg-card p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-[11px]">💡 Seller Tip</p>
            <p className="text-[11px] leading-relaxed">
              Listings with detailed cultural fabric info and clear Habesha Kemis photos receive 3× more calls and inquiries.
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
        <div className="p-4 space-y-4">
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
