"use client"
import { Alert, Button, Spinner, cn } from '@marketplace/ui';
import React, { useCallback, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedImage {
  url: string;
  cloudinaryPublicId: string;
  sortOrder: number;
}

type ImageUploaderVariant = 'grid' | 'single';

export interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onUpload: (file: File) => Promise<UploadedImage | null>;
  onUploadMultiple?: (files: File[]) => Promise<UploadedImage[]>;
  variant?: ImageUploaderVariant;
  maxImages?: number;
  isUploading?: boolean;
  uploadError?: string | null;
  onClearError?: () => void;
  className?: string;
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageUploader({
  images,
  onImagesChange,
  onUpload,
  onUploadMultiple,
  variant = 'grid',
  maxImages = 10,
  isUploading = false,
  uploadError,
  onClearError,
  className,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);

  const processFiles = useCallback(async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const valid = fileList.filter((f) => allowed.includes(f.type) && f.size <= 5 * 1024 * 1024);
    const toUpload = valid.slice(0, remaining);

    if (toUpload.length === 0) return;

    let newImages: UploadedImage[] = [];
    if (onUploadMultiple) {
      newImages = await onUploadMultiple(toUpload);
    } else {
      setProgressText(`Uploading ${toUpload.length} image(s)...`);
      const results = await Promise.all(toUpload.map((f) => onUpload(f)));
      newImages = results.filter((r): r is UploadedImage => r !== null);
      setProgressText(null);
    }

    if (newImages.length > 0) {
      const updated = [
        ...images,
        ...newImages.map((img, idx) => ({ ...img, sortOrder: images.length + idx })),
      ];
      onImagesChange(updated);
    }
  }, [images, maxImages, onUpload, onUploadMultiple, onImagesChange]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleRemove = useCallback((index: number) => {
    const updated = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }));
    onImagesChange(updated);
  }, [images, onImagesChange]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const a = updated[index - 1];
    const b = updated[index];
    if (a && b) {
      updated[index - 1] = b;
      updated[index] = a;
    }
    onImagesChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
  }, [images, onImagesChange]);

  const handleMoveDown = useCallback((index: number) => {
    if (index === images.length - 1) return;
    const updated = [...images];
    const a = updated[index];
    const b = updated[index + 1];
    if (a && b) {
      updated[index + 1] = a;
      updated[index] = b;
    }
    onImagesChange(updated.map((img, i) => ({ ...img, sortOrder: i })));
  }, [images, onImagesChange]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [processFiles]);

  const atLimit = images.length >= maxImages;

  // Single variant: profile/avatar upload
  if (variant === 'single') {
    return (
      <div className={cn('space-y-3', className)}>
        {uploadError && (
          <Alert variant="error" {...(onClearError ? { onDismiss: onClearError } : {})}>{uploadError}</Alert>
        )}

        <div className="flex items-center gap-4">
          {images[0] && (
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-brand-gold/30">
              <img src={images[0].url} alt="Profile" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => { onImagesChange([]); }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100"
                aria-label="Remove image"
              >
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={(e) => { void handleFileSelect(e); }}
              className="hidden"
              id="image-uploader-single"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { fileInputRef.current?.click(); }}
              disabled={isUploading || (images.length > 0)}
            >
              {isUploading ? (
                <span className="flex items-center gap-2"><Spinner size="sm" /> Uploading...</span>
              ) : images.length > 0 ? 'Photo Uploaded' : 'Upload Photo'}
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG or WebP</p>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={cn('space-y-4', className)} aria-label="Upload images">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Listing Photos</h3>
          <p className="text-xs text-muted-foreground">Upload up to {String(maxImages)} photos. First photo is the primary image.</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {String(images.length)}/{String(maxImages)}
        </span>
      </div>

      {uploadError && (
        <Alert variant="error" {...(onClearError ? { onDismiss: onClearError } : {})}>{uploadError}</Alert>
      )}

      {/* Drop zone / Upload button */}
      {!atLimit && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => { void handleDrop(e); }}
          onClick={() => { fileInputRef.current?.click(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          role="button"
          tabIndex={0}
          aria-label="Click or drag to upload images"
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors',
            isDragOver
              ? 'border-brand-gold bg-brand-gold/5'
              : 'border-muted-foreground/25 hover:border-brand-gold/40 hover:bg-muted/30'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            onChange={(e) => { void handleFileSelect(e); }}
            className="hidden"
            id="image-uploader-grid"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <span className="text-sm text-muted-foreground">{progressText || 'Uploading...'}</span>
            </div>
          ) : (
            <>
              <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-foreground">Drop images here or click to browse</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP</p>
            </>
          )}
        </div>
      )}

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
                <div className="absolute left-1 top-1 rounded bg-brand-gold px-1.5 py-0.5 text-[10px] font-bold text-brand-gold-foreground">
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
                <button
                  type="button"
                  onClick={() => { handleRemove(index); }}
                  className="rounded p-0.5 text-white hover:bg-red-500"
                  aria-label="Remove image"
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

      {/* Status */}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {images.length === 0 && 'No photos uploaded yet'}
        {images.length > 0 && images.length < maxImages && String(maxImages - images.length) + ' more slot' + (maxImages - images.length !== 1 ? 's' : '') + ' available'}
        {atLimit && 'Maximum photos reached'}
      </p>
    </div>
  );
}
