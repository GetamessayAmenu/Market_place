import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Listing schemas
export const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  price: z.number().min(0, 'Price must be a positive number'),
  categoryId: z.string().uuid('Invalid category'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
});

export type ListingFormData = z.infer<typeof listingSchema>;

// Profile schemas
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().min(2, 'Location must be at least 2 characters').optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Message schemas
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message must be less than 1000 characters'),
});

export type MessageFormData = z.infer<typeof messageSchema>;
