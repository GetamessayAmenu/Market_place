# Seller Hub API Routes Documentation

## Overview
This document outlines the API routes and data hooks required to support the new 6-hub seller dashboard structure.

## Hub 1: Overview (`/seller/dashboard`)

### Required API Endpoints

#### GET `/api/seller/dashboard/kpis`
Returns key performance indicators for the seller dashboard.

**Response:**
```typescript
{
  listingViews: number;
  chatStarts: number;
  whatsappClicks: number;
  phoneReveals: number;
  pendingActions: number;
}
```

#### GET `/api/seller/dashboard/pending-actions`
Returns urgent actions requiring seller attention.

**Response:**
```typescript
{
  id: string;
  type: 'new_inquiry' | 'rental_request' | 'handover' | 'return' | 'unread_message';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  relatedId?: string;
  createdAt: string;
}[]
```

#### GET `/api/seller/dashboard/engagement-metrics`
Returns engagement health metrics with change percentages.

**Response:**
```typescript
{
  label: string;
  value: number;
  change: number;
}[]
```

#### GET `/api/seller/holidays`
Returns upcoming Ethiopian holidays for alert banners.

**Response:**
```typescript
{
  name: string;
  date: string;
  daysUntil: number;
  alertMessage: string;
}[]
```

---

## Hub 2: Catalog & Stock Manager (`/seller/catalog`)

### Required API Endpoints

#### GET `/api/seller/listings`
Returns all listings for the seller with filtering support.

**Query Params:**
- `status`: `'in_stock' | 'rented_out' | 'out_of_stock'`
- `search`: string
- `businessModel`: `'sale' | 'rental' | 'custom'`

**Response:**
```typescript
{
  id: string;
  title: string;
  price: number;
  status: 'in_stock' | 'rented_out' | 'out_of_stock';
  businessModels: ('sale' | 'rental' | 'custom')[];
  primaryImageUrl?: string;
  city?: string;
  condition: string;
}[]
```

#### POST `/api/seller/listings`
Creates a new listing.

**Request Body:**
```typescript
{
  title: string;
  description: string;
  price: number;
  businessModels: ('sale' | 'rental' | 'custom')[];
  images: string[];
  city: string;
  condition: string;
  fabricType?: string;
  // Sale-specific
  quantity?: number;
  // Rental-specific
  depositAmount?: number;
  dailyRate?: number;
  // Custom-specific
  turnaroundDays?: number;
  measurementRequirements?: string[];
}
```

#### PUT `/api/seller/listings/:id`
Updates an existing listing.

#### DELETE `/api/seller/listings/:id`
Deletes a listing.

#### GET `/api/seller/blackout-dates`
Returns blackout calendar dates for the seller.

**Response:**
```typescript
{
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}[]
```

#### POST `/api/seller/blackout-dates`
Adds a new blackout period.

**Request Body:**
```typescript
{
  startDate: string;
  endDate: string;
  reason: string;
}
```

#### DELETE `/api/seller/blackout-dates/:id`
Removes a blackout period.

#### PUT `/api/seller/listings/:id/status`
Quick updates listing stock status.

**Request Body:**
```typescript
{
  status: 'in_stock' | 'rented_out' | 'out_of_stock';
}
```

---

## Hub 3: Orders & Requests Pipeline (`/seller/orders`)

### Required API Endpoints

#### GET `/api/seller/orders`
Returns all orders for the seller with filtering.

**Query Params:**
- `model`: `'sale' | 'rental' | 'custom'`
- `status`: `'requested' | 'approved' | 'in_progress' | 'completed' | 'returned' | 'cancelled'`

**Response:**
```typescript
{
  id: string;
  model: 'sale' | 'rental' | 'custom';
  status: OrderStatus;
  title: string;
  customerName: string;
  price?: number;
  deposit?: number;
  rentalDates?: { start: string; end: string };
  customMilestone?: CustomMilestone;
  createdAt: string;
}[]
```

#### GET `/api/seller/orders/:id`
Returns detailed order information.

#### PUT `/api/seller/orders/:id/status`
Updates order status.

**Request Body:**
```typescript
{
  status: OrderStatus;
}
```

#### PUT `/api/seller/orders/:id/milestone`
Updates custom order milestone.

**Request Body:**
```typescript
{
  milestone: 'measurements_received' | 'fabric_cutting' | 'tailoring' | 'ready';
}
```

#### POST `/api/seller/orders/:id/condition`
Logs pre-handover condition with photos.

**Request Body:**
```typescript
{
  photos: string[];
  notes: string;
}
```

#### POST `/api/seller/orders/:id/extension-request`
Handles rental extension request approval/rejection.

**Request Body:**
```typescript
{
  approved: boolean;
  newEndDate?: string;
  additionalCharge?: number;
}
```

#### GET `/api/seller/orders/:id/agreement`
Generates handover agreement document.

**Response:**
```typescript
{
  pdfUrl: string;
  agreementText: string;
}
```

---

## Hub 4: Direct Communication Center (`/seller/messages`)

### Required API Endpoints

#### GET `/api/seller/conversations`
Returns all message threads.

**Query Params:**
- `filter`: `'all' | 'unread' | 'with_order'`

**Response:**
```typescript
{
  id: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  relatedOrder?: {
    id: string;
    title: string;
    model: 'sale' | 'rental' | 'custom';
  };
}[]
```

#### GET `/api/seller/conversations/:id/messages`
Returns messages for a specific conversation.

**Response:**
```typescript
{
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}[]
```

#### POST `/api/seller/conversations/:id/messages`
Sends a message in a conversation.

**Request Body:**
```typescript
{
  content: string;
}
```

#### PUT `/api/seller/conversations/:id/read`
Marks conversation as read.

#### GET `/api/seller/quick-responses`
Returns seller's quick response templates.

**Response:**
```typescript
{
  id: string;
  title: string;
  content: string;
  category: 'location' | 'measurements' | 'deposit' | 'general';
}[]
```

#### POST `/api/seller/quick-responses`
Creates a new quick response template.

**Request Body:**
```typescript
{
  title: string;
  content: string;
  category: 'location' | 'measurements' | 'deposit' | 'general';
}
```

#### PUT `/api/seller/quick-responses/:id`
Updates a quick response template.

#### DELETE `/api/seller/quick-responses/:id`
Deletes a quick response template.

#### POST `/api/seller/conversations/:id/quote`
Sends a custom quote within a conversation.

**Request Body:**
```typescript
{
  amount: number;
  description: string;
  validUntil: string;
}
```

---

## Hub 5: Store & Profile Manager (`/seller/store`)

### Required API Endpoints

#### GET `/api/seller/profile`
Returns seller profile information.

**Response:**
```typescript
{
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  location?: {
    subCity?: string;
    regionalHub?: string;
    address?: string;
  };
  verificationStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  storefrontUrl: string;
}
```

#### PUT `/api/seller/profile`
Updates seller profile information.

**Request Body:**
```typescript
{
  displayName?: string;
  phone?: string;
  location?: {
    subCity?: string;
    regionalHub?: string;
    address?: string;
  };
}
```

#### POST `/api/seller/verification-documents`
Submits verification documents.

**Request Body:**
```typescript
{
  businessLicense?: File;
  tin?: string;
  artisanCertificate?: File;
}
```

#### GET `/api/seller/verification-status`
Returns current verification status.

**Response:**
```typescript
{
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}
```

#### GET `/api/seller/promotions`
Returns current promotions and pinned listings.

**Response:**
```typescript
{
  pinnedListings: string[];
  bannerText?: string;
}
```

#### PUT `/api/seller/promotions`
Updates promotions and pinned listings.

**Request Body:**
```typescript
{
  pinnedListings?: string[];
  bannerText?: string;
}
```

#### GET `/api/seller/storefront/qr`
Returns QR code for storefront.

**Response:**
```typescript
{
  qrCodeUrl: string;
  storefrontUrl: string;
}
```

---

## Hub 6: Insights & Customer Feedback (`/seller/insights`)

### Required API Endpoints

#### GET `/api/seller/analytics`
Returns engagement analytics.

**Query Params:**
- `period`: `'7d' | '30d' | '90d'`

**Response:**
```typescript
{
  listingViews: number;
  chatStarts: number;
  whatsappClicks: number;
  phoneReveals: number;
  conversionRate: number;
  period: string;
}
```

#### GET `/api/seller/deposits`
Returns deposit log.

**Response:**
```typescript
{
  id: string;
  type: 'held' | 'refunded';
  amount: number;
  customerName: string;
  relatedOrder: string;
  date: string;
  notes?: string;
}[]
```

#### POST `/api/seller/deposits`
Adds a manual deposit entry.

**Request Body:**
```typescript
{
  type: 'held' | 'refunded';
  amount: number;
  customerName: string;
  relatedOrder: string;
  notes?: string;
}
```

#### GET `/api/seller/reviews`
Returns customer reviews.

**Query Params:**
- `rating`: number (optional filter)
- `listingId`: string (optional filter)

**Response:**
```typescript
{
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  listing?: string;
}[]
```

#### POST `/api/seller/reviews/:id/response`
Adds seller response to a review.

**Request Body:**
```typescript
{
  response: string;
}
```

#### GET `/api/seller/customers`
Returns customer directory.

**Query Params:**
- `search`: string (optional search)

**Response:**
```typescript
{
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalOrders: number;
  lastOrderDate: string;
  storedMeasurements?: Record<string, number>;
}[]
```

#### GET `/api/seller/customers/:id`
Returns detailed customer information including order history.

#### PUT `/api/seller/customers/:id/measurements`
Updates stored customer measurements.

**Request Body:**
```typescript
{
  measurements: Record<string, number>;
}
```

---

## React Hooks

### Custom hooks to be created:

```typescript
// hooks/seller/useDashboardKpis.ts
export function useDashboardKpis(sellerId: string) {
  return useQuery(['dashboard-kpis', sellerId], () => 
    fetch(`/api/seller/dashboard/kpis`).then(r => r.json())
  );
}

// hooks/seller/usePendingActions.ts
export function usePendingActions(sellerId: string) {
  return useQuery(['pending-actions', sellerId], () => 
    fetch(`/api/seller/dashboard/pending-actions`).then(r => r.json())
  );
}

// hooks/seller/useListings.ts
export function useListings(sellerId: string, filters?: ListingFilters) {
  return useQuery(['listings', sellerId, filters], () => 
    fetch(`/api/seller/listings?${new URLSearchParams(filters)}`).then(r => r.json())
  );
}

// hooks/seller/useOrders.ts
export function useOrders(sellerId: string, filters?: OrderFilters) {
  return useQuery(['orders', sellerId, filters], () => 
    fetch(`/api/seller/orders?${new URLSearchParams(filters)}`).then(r => r.json())
  );
}

// hooks/seller/useConversations.ts
export function useConversations(sellerId: string, filter?: string) {
  return useQuery(['conversations', sellerId, filter], () => 
    fetch(`/api/seller/conversations?filter=${filter}`).then(r => r.json())
  );
}

// hooks/seller/useSellerProfile.ts
export function useSellerProfile(sellerId: string) {
  return useQuery(['seller-profile', sellerId], () => 
    fetch(`/api/seller/profile`).then(r => r.json())
  );
}

// hooks/seller/useAnalytics.ts
export function useAnalytics(sellerId: string, period: string = '30d') {
  return useQuery(['analytics', sellerId, period], () => 
    fetch(`/api/seller/analytics?period=${period}`).then(r => r.json())
  );
}
```

---

## Implementation Priority

### Phase 1 (Critical for Basic Functionality)
1. `GET /api/seller/listings` - Catalog display
2. `POST /api/seller/listings` - Create listings
3. `PUT /api/seller/listings/:id/status` - Quick stock updates
4. `GET /api/seller/orders` - Orders display
5. `PUT /api/seller/orders/:id/status` - Order status updates

### Phase 2 (Enhanced Features)
6. `GET /api/seller/dashboard/kpis` - Overview metrics
7. `GET /api/seller/conversations` - Messages display
8. `POST /api/seller/conversations/:id/messages` - Send messages
9. `GET /api/seller/blackout-dates` - Blackout calendar
10. `POST /api/seller/blackout-dates` - Add blackout periods

### Phase 3 (Advanced Features)
11. `GET /api/seller/analytics` - Insights analytics
12. `GET /api/seller/reviews` - Reviews display
13. `POST /api/seller/verification-documents` - KYC upload
14. `GET /api/seller/deposits` - Deposit log
15. `GET /api/seller/customers` - Customer directory

---

## Database Schema Considerations

### New Tables/Fields Required:

- `blackout_dates` table for rental availability
- `quick_responses` table for message templates
- `deposit_log` table for offline deposit tracking
- `customer_measurements` table for stored measurements
- `verification_documents` table for KYC uploads
- `promotions` table for storefront promotions

### Existing Tables to Extend:

- `listings` - Add `business_models` array field
- `orders` - Add `model` field, `custom_milestone` field
- `conversations` - Add `related_order_id` field
- `sellers` - Add `verification_status`, `location` fields

---

## Authentication & Authorization

All seller API routes should:
1. Require seller authentication via JWT/session
2. Validate that the authenticated user owns the requested resources
3. Return 401 for unauthenticated requests
4. Return 403 for unauthorized access attempts

---

## Error Handling

Standard error responses:

```typescript
{
  error: string;
  code: string;
  details?: any;
}
```

Common error codes:
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Not authorized
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `CONFLICT` - Resource conflict
- `INTERNAL_ERROR` - Server error
