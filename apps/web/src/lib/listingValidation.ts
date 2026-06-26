import { z } from 'zod';

// Listing type enum
export const listingTypeSchema = z.enum(['sale', 'rental', 'custom']);

// Category schema
export const categorySchema = z.object({
  categoryId: z.string().min(1, 'Please select a category'),
  subCategoryId: z.string().optional(),
});

// Photos schema
export const photosSchema = z.object({
  images: z
    .array(z.any())
    .min(1, 'Add at least 1 photo')
    .max(10, 'Maximum 10 photos allowed')
    .refine((files) => files.every((file) => !file || file.size <= 10 * 1024 * 1024), 'Each image must be less than 10MB')
    .refine((files) => files.every((file) => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)), 'Images must be JPG, PNG, or WebP'),
  coverImageIndex: z.number().min(0).optional(),
});

// Description schema
export const descriptionSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must not exceed 100 characters')
    .refine((val) => !/^\s+$/.test(val), 'Title cannot be only spaces'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .refine((val) => !/^\s+$/.test(val), 'Description cannot be only spaces'),
  specifications: z
    .array(
      z.object({
        key: z.string().min(1, 'Specification key is required'),
        value: z.string().min(1, 'Specification value is required'),
      })
    )
    .optional(),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'used']).default('new'),
});

// Pricing schema
export const pricingSchema = z.object({
  price: z
    .number()
    .min(1, 'Price must be at least 1 ETB')
    .max(10000000, 'Price must not exceed 10,000,000 ETB'),
  currency: z.enum(['ETB', 'USD']).default('ETB'),
  discountPrice: z
    .number()
    .min(0, 'Discount price must be at least 0')
    .max(10000000, 'Discount price must not exceed 10,000,000 ETB')
    .optional(),
  discountPercent: z
    .number()
    .min(0, 'Discount percent must be at least 0')
    .max(100, 'Discount percent must not exceed 100')
    .optional(),
  negotiable: z.boolean().default(false),
});

// Inventory schema
export const inventorySchema = z.object({
  stock: z
    .number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock must not exceed 10,000'),
  sku: z.string().optional(),
  trackInventory: z.boolean().default(true),
  lowStockThreshold: z
    .number()
    .int('Low stock threshold must be a whole number')
    .min(1, 'Low stock threshold must be at least 1')
    .optional(),
});

// Rental settings schema
export const rentalSettingsSchema = z.object({
  dailyRate: z
    .number()
    .min(1, 'Daily rate must be at least 1 ETB')
    .max(100000, 'Daily rate must not exceed 100,000 ETB'),
  currency: z.enum(['ETB', 'USD']).default('ETB'),
  minRentalDays: z
    .number()
    .int('Minimum rental days must be a whole number')
    .min(1, 'Minimum rental days must be at least 1')
    .max(30, 'Minimum rental days must not exceed 30')
    .default(1),
  maxRentalDays: z
    .number()
    .int('Maximum rental days must be a whole number')
    .min(1, 'Maximum rental days must be at least 1')
    .max(365, 'Maximum rental days must not exceed 365')
    .optional(),
  securityDeposit: z
    .number()
    .min(0, 'Security deposit must be at least 0')
    .max(100000, 'Security deposit must not exceed 100,000 ETB')
    .optional(),
  lateFeePerDay: z
    .number()
    .min(0, 'Late fee must be at least 0')
    .max(10000, 'Late fee must not exceed 10,000 ETB')
    .optional(),
});

// Custom-made settings schema
export const customMadeSettingsSchema = z.object({
  basePrice: z
    .number()
    .min(1, 'Base price must be at least 1 ETB')
    .max(10000000, 'Base price must not exceed 10,000,000 ETB'),
  currency: z.enum(['ETB', 'USD']).default('ETB'),
  leadTimeDays: z
    .number()
    .int('Lead time must be a whole number')
    .min(1, 'Lead time must be at least 1 day')
    .max(180, 'Lead time must not exceed 180 days')
    .default(7),
  maxCapacityPerMonth: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(1000, 'Capacity must not exceed 1000')
    .optional(),
  requiresMeasurement: z.boolean().default(true),
  customizationOptions: z
    .array(
      z.object({
        name: z.string().min(1, 'Option name is required'),
        type: z.enum(['color', 'size', 'material', 'other']),
        required: z.boolean().default(false),
        additionalCost: z.number().min(0).default(0),
      })
    )
    .optional(),
});

// Combined listing schema
export const listingSchema = z.object({
  listingType: listingTypeSchema,
  category: categorySchema,
  photos: photosSchema,
  description: descriptionSchema,
  pricing: pricingSchema,
  inventory: inventorySchema,
  rentalSettings: rentalSettingsSchema.optional(),
  customMadeSettings: customMadeSettingsSchema.optional(),
}).refine(
  (data) => {
    if (data.listingType === 'rental') {
      return !!data.rentalSettings;
    }
    return true;
  },
  {
    message: 'Rental settings are required for rental listings',
    path: ['rentalSettings'],
  }
).refine(
  (data) => {
    if (data.listingType === 'custom') {
      return !!data.customMadeSettings;
    }
    return true;
  },
  {
    message: 'Custom-made settings are required for custom listings',
    path: ['customMadeSettings'],
  }
);

export type ListingInput = z.infer<typeof listingSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
