import { z } from 'zod';

// ─── Hub 2: Catalog & Stock Manager ────────────────────────────────────────

export const blackoutDateSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(200, 'Reason must be less than 200 characters'),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const listingStatusSchema = z.object({
  status: z.enum(['in_stock', 'rented_out', 'out_of_stock'], {
    required_error: 'Status is required',
  }),
});

export const listingStockSchema = z.object({
  stock: z.number().int().min(0, 'Stock cannot be negative').max(9999, 'Stock cannot exceed 9999'),
});

// ─── Hub 3: Orders & Requests Pipeline ─────────────────────────────────────

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled'], {
    required_error: 'Status is required',
  }),
});

export const customMilestoneSchema = z.object({
  milestone: z.enum(['submitted', 'under_review', 'approved', 'in_production', 'ready', 'delivered'], {
    required_error: 'Milestone is required',
  }),
});

// ─── Hub 4: Direct Communication Center ────────────────────────────────────

export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message must be less than 2000 characters'),
});

export const quickResponseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(500, 'Content must be less than 500 characters'),
});

// ─── Hub 5: Store & Profile Manager ───────────────────────────────────────

export const sellerProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100, 'Display name must be less than 100 characters'),
  phone: z.string().regex(/^251[9]\d{8}$/, 'Phone number must be a valid Ethiopian number (e.g., 251912345678)').optional().or(z.literal('')),
  location: z.object({
    subCity: z.string().optional(),
    regionalHub: z.string().optional(),
    address: z.string().min(10, 'Address must be at least 10 characters').optional(),
  }).optional(),
});

export const verificationDocumentsSchema = z.object({
  businessLicense: z.string().url('Business license must be a valid URL').optional().or(z.literal('')),
  tin: z.string().regex(/^\d{10}$/, 'TIN must be exactly 10 digits').optional().or(z.literal('')),
  artisanCertificate: z.string().url('Artisan certificate must be a valid URL').optional().or(z.literal('')),
});

export const promotionsSchema = z.object({
  pinnedListings: z.array(z.string()).max(6, 'You can pin up to 6 listings'),
  bannerText: z.string().max(100, 'Banner text must be less than 100 characters').optional(),
});

// ─── Hub 6: Insights & Customer Feedback ───────────────────────────────────

export const depositSchema = z.object({
  type: z.enum(['held', 'refunded'], {
    required_error: 'Deposit type is required',
  }),
  amount: z.number().positive('Amount must be positive').max(100000, 'Amount cannot exceed 100,000 ETB'),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100, 'Customer name must be less than 100 characters'),
  relatedOrder: z.string().min(1, 'Related order is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export const reviewResponseSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters').max(1000, 'Response must be less than 1000 characters'),
});

export const customerMeasurementsSchema = z.object({
  measurements: z.record(z.number().positive('Measurements must be positive').max(300, 'Measurements cannot exceed 300 cm')),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type BlackoutDateInput = z.infer<typeof blackoutDateSchema>;
export type ListingStatusInput = z.infer<typeof listingStatusSchema>;
export type ListingStockInput = z.infer<typeof listingStockSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
export type CustomMilestoneInput = z.infer<typeof customMilestoneSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type QuickResponseInput = z.infer<typeof quickResponseSchema>;
export type SellerProfileInput = z.infer<typeof sellerProfileSchema>;
export type VerificationDocumentsInput = z.infer<typeof verificationDocumentsSchema>;
export type PromotionsInput = z.infer<typeof promotionsSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type ReviewResponseInput = z.infer<typeof reviewResponseSchema>;
export type CustomerMeasurementsInput = z.infer<typeof customerMeasurementsSchema>;
