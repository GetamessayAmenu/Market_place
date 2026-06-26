import { z } from 'zod';

// Step 1: Shop Name
export const shopNameSchema = z.object({
  shopName: z
    .string()
    .min(3, 'Shop name must be at least 3 characters')
    .max(50, 'Shop name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s\u1200-\u137F'-]+$/, 'Shop name can only contain letters, numbers, spaces, and special characters')
    .refine((val) => !/^\s+$/.test(val), 'Shop name cannot be only spaces'),
});

// Step 2: Logo (file upload validation)
export const logoSchema = z.object({
  logo: z
    .any()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, 'Logo must be less than 5MB')
    .refine((file) => !file || ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type), 'Logo must be JPG, PNG, WebP, or SVG')
    .optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

// Step 3: Banner (file upload validation)
export const bannerSchema = z.object({
  banner: z
    .any()
    .refine((file) => !file || file.size <= 10 * 1024 * 1024, 'Banner must be less than 10MB')
    .refine((file) => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 'Banner must be JPG, PNG, or WebP')
    .optional(),
  bannerUrl: z.string().url().optional().or(z.literal('')),
});

// Step 4: About Shop
export const aboutShopSchema = z.object({
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .refine((val) => !/^\s+$/.test(val), 'Description cannot be only spaces'),
  story: z
    .string()
    .max(2000, 'Story must not exceed 2000 characters')
    .optional()
    .refine((val) => !val || !/^\s+$/.test(val), 'Story cannot be only spaces'),
});

// Step 5: Address
export const addressSchema = z.object({
  address: z
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters')
    .refine((val) => !/^\s+$/.test(val), 'Address cannot be only spaces'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must not exceed 50 characters')
    .refine((val) => !/^\s+$/.test(val), 'City cannot be only spaces'),
  subCity: z
    .string()
    .min(2, 'Sub-city must be at least 2 characters')
    .max(50, 'Sub-city must not exceed 50 characters')
    .optional()
    .refine((val) => !val || !/^\s+$/.test(val), 'Sub-city cannot be only spaces'),
  kebele: z
    .string()
    .min(1, 'Kebele must be at least 1 character')
    .max(20, 'Kebele must not exceed 20 characters')
    .optional()
    .refine((val) => !val || !/^\s+$/.test(val), 'Kebele cannot be only spaces'),
  landmark: z
    .string()
    .max(100, 'Landmark must not exceed 100 characters')
    .optional()
    .refine((val) => !val || !/^\s+$/.test(val), 'Landmark cannot be only spaces'),
});

// Step 6: Delivery Areas
export const deliveryAreaSchema = z.object({
  deliveryAreas: z
    .array(
      z.object({
        area: z.string().min(2, 'Area name must be at least 2 characters'),
        fee: z.number().min(0, 'Delivery fee must be at least 0').max(10000, 'Delivery fee must not exceed 10,000 ETB'),
        estimatedTime: z.string().min(2, 'Estimated time must be at least 2 characters'),
      })
    )
    .min(1, 'Add at least one delivery area')
    .max(20, 'Maximum 20 delivery areas allowed'),
  freeDeliveryThreshold: z.number().min(0, 'Threshold must be at least 0').optional(),
});

// Step 7: Social Links
export const socialLinksSchema = z.object({
  facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  telegram: z.string().url('Invalid Telegram URL').optional().or(z.literal('')),
  tiktok: z.string().url('Invalid TikTok URL').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

// Step 8: Business Hours
export const businessHoursSchema = z.object({
  hours: z.array(
    z.object({
      day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
      isOpen: z.boolean(),
      openTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
      closeTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    })
  ),
});

// Combined schema for entire shop setup
export const shopSetupSchema = z.object({
  shopName: shopNameSchema.shape.shopName,
  logoUrl: logoSchema.shape.logoUrl,
  bannerUrl: bannerSchema.shape.bannerUrl,
  description: aboutShopSchema.shape.description,
  story: aboutShopSchema.shape.story,
  address: addressSchema.shape.address,
  city: addressSchema.shape.city,
  subCity: addressSchema.shape.subCity,
  kebele: addressSchema.shape.kebele,
  landmark: addressSchema.shape.landmark,
  deliveryAreas: deliveryAreaSchema.shape.deliveryAreas,
  freeDeliveryThreshold: deliveryAreaSchema.shape.freeDeliveryThreshold,
  facebook: socialLinksSchema.shape.facebook,
  instagram: socialLinksSchema.shape.instagram,
  telegram: socialLinksSchema.shape.telegram,
  tiktok: socialLinksSchema.shape.tiktok,
  website: socialLinksSchema.shape.website,
  hours: businessHoursSchema.shape.hours,
});

export type ShopSetupInput = z.infer<typeof shopSetupSchema>;
