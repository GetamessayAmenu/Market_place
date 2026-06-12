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
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
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
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  city: z.string().max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number').optional().or(z.literal('')),
});

// Listing schemas
export const listingCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be 200 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be 5000 characters or less'),
  price: z.coerce.number().min(0, 'Price must be 0 or more').max(9999999, 'Price is too high'),
  categoryId: z.string().uuid('Please select a category'),
  city: z.string().min(2, 'City is required').max(100),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor'], {
    errorMap: () => ({ message: 'Please select a condition' }),
  }),
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
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
