import { z } from 'zod';

/**
 * Shared Zod validation schemas for the marketplace web app.
 * Used with react-hook-form + @hookform/resolvers/zod.
 */

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    userType: z.enum(['buyer', 'seller']).default('buyer'),
    displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    phone: z.string().regex(/^(\+251|0)(9|7)\d{8}$/, 'Enter a valid Ethiopian phone number (e.g. 09XXXXXXXX or +2519XXXXXXXX)'),
    termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.userType === 'seller' || data.phone === '', {
    message: 'Phone is required for sellers',
    path: ['phone'],
  });

// Seller registration schema (similar to buyer but phone is required)
export const sellerRegisterSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^(\+251|0)(9|7)\d{8}$/, 'Enter a valid Ethiopian phone number (e.g. 09XXXXXXXX or +2519XXXXXXXX)'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    token: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

// Profile schemas
export const profileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^(\+251|0)(9|7)\d{8}$/, 'Enter a valid Ethiopian phone number (e.g. 09XXXXXXXX or +2519XXXXXXXX)').optional().or(z.literal('')),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  chatNotifications: z.boolean().default(true),
  listingAlerts: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

// Listing schemas
const contactOptionsSchema = z.object({
  showPhone: z.boolean().default(false),
  whatsapp: z.string().max(30).optional().or(z.literal('')),
  telegram: z.string().max(64).optional().or(z.literal('')),
  inAppMessaging: z.boolean().default(true),
});

const listingImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  cloudinaryPublicId: z.string().min(1, 'Image ID is required'),
  sortOrder: z.number().int().min(0).max(11).optional(),
  isPrimary: z.boolean().optional(),
});

export const listingCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be 200 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be 5000 characters or less'),
  price: z.coerce.number().min(0, 'Price must be 0 or more').max(9999999, 'Price is too high'),
  categoryId: z.string().uuid('Please select a category'),
  city: z.string().min(2, 'City is required').max(100),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor'], {
    errorMap: () => ({ message: 'Please select a condition' }),
  }),
  contactOptions: contactOptionsSchema.optional(),
  images: z.array(listingImageSchema).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
  // Type-specific fields
  availableForPurchase: z.boolean().optional(),
  availableForRent: z.boolean().optional(),
  customOrderAvailable: z.boolean().optional(),
  rentalPricePerDay: z.coerce.number().min(0).max(9999999).optional(),
  rentalDeposit: z.coerce.number().min(0).max(9999999).optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const listingUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be 200 characters or less').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be 5000 characters or less').optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more').max(9999999, 'Price is too high').optional(),
  categoryId: z.string().uuid('Please select a category').optional(),
  city: z.string().min(2, 'City is required').max(100).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor'], {
    errorMap: () => ({ message: 'Please select a condition' }),
  }).optional(),
  contactOptions: contactOptionsSchema.optional(),
  images: z.array(listingImageSchema).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed').optional(),
  // Type-specific fields
  availableForPurchase: z.boolean().optional(),
  availableForRent: z.boolean().optional(),
  customOrderAvailable: z.boolean().optional(),
  rentalPricePerDay: z.coerce.number().min(0).max(9999999).optional(),
  rentalDeposit: z.coerce.number().min(0).max(9999999).optional(),
  attributes: z.record(z.unknown()).optional(),
});

// Report schema
export const reportSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'scam', 'misleading', 'other'], {
    errorMap: () => ({ message: 'Please select a reason' }),
  }),
  description: z.string().min(10, 'Please provide more details (min 10 characters)').max(1000),
});

// Type exports for use with react-hook-form
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SellerRegisterInput = z.infer<typeof sellerRegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
