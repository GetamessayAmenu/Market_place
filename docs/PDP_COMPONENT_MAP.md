# Product Detail Page - Component Architecture Map

## 🗺️ Visual Component Hierarchy

```
ListingPage (apps/web/src/app/listings/[id]/page.tsx)
│
├── Container
│   ├── Breadcrumb Navigation
│   │   └── Home → Category → Listing Title
│   │
│   ├── Main Grid (lg:grid-cols-5)
│   │   │
│   │   ├── [Left Column - 60%] (lg:col-span-3)
│   │   │   └── ImageGallery ⭐ (existing)
│   │   │       └── Product images with navigation
│   │   │
│   │   └── [Right Column - 40%] (lg:col-span-2)
│   │       │
│   │       ├── Title & Actions
│   │       │   ├── Title (h1)
│   │       │   ├── ShareButton ⭐ (existing)
│   │       │   └── FavoriteButton ⭐ (existing)
│   │       │
│   │       ├── Price Section
│   │       │   ├── Price Display
│   │       │   ├── PriceHistoryButton 🆕
│   │       │   └── Rental Price (conditional)
│   │       │
│   │       ├── Badges Section
│   │       │   ├── Condition Badge
│   │       │   ├── Featured Badge
│   │       │   └── Status Badge
│   │       │
│   │       ├── ListingActions ⭐ (existing)
│   │       │   ├── Buy Button
│   │       │   ├── Rent Button
│   │       │   └── Custom Order Button
│   │       │
│   │       ├── RequestCallbackButton 🆕
│   │       │   └── Opens Modal
│   │       │       ├── Name Input
│   │       │       ├── Phone Input
│   │       │       ├── Preferred Time Input
│   │       │       └── Message Textarea
│   │       │
│   │       ├── Meta Information
│   │       │   ├── Location Icon + Text
│   │       │   ├── Date Posted Icon + Text
│   │       │   └── Favorites Count Icon + Text
│   │       │
│   │       ├── Contact Options
│   │       │   ├── Show Contact Button
│   │       │   ├── WhatsApp Link
│   │       │   ├── Telegram Link
│   │       │   └── ChatButton ⭐ (existing)
│   │       │
│   │       ├── SellerInfoCard 🆕
│   │       │   ├── Avatar (XL)
│   │       │   ├── Name + Verification Badge
│   │       │   ├── Member Duration
│   │       │   ├── Response Time Indicator
│   │       │   ├── TrustBadges ⭐ (existing)
│   │       │   └── View Profile CTA
│   │       │
│   │       ├── SafetyTips 🆕
│   │       │   ├── Collapsible Header
│   │       │   └── Tips List (5 items)
│   │       │
│   │       └── Action Buttons Row
│   │           ├── MarkUnavailableButton 🆕
│   │           └── ReportAbuseButton 🆕
│   │               └── Opens Modal
│   │                   ├── Reason Radio Group
│   │                   └── Details Textarea
│   │
│   ├── Description Section
│   │   ├── Heading (h2)
│   │   └── Description Text
│   │
│   ├── Reviews Section
│   │   ├── Heading (h2)
│   │   └── ReviewSection ⭐ (existing)
│   │
│   ├── Related Listings Section
│   │   ├── Heading (h2)
│   │   └── Grid of ListingCard ⭐ (existing)
│   │
│   ├── Post Similar Ad CTA Section 🆕
│   │   ├── Gradient Background Card
│   │   ├── Heading (h2)
│   │   ├── Description Text
│   │   └── PostSimilarAdButton 🆕
│   │
│   └── JSON-LD Schema (SEO)
```

**Legend:**
- ⭐ Existing component (kept/used)
- 🆕 New component (created)

---

## 🎨 Component Interaction Flow

### 1. Price History Flow
```
User clicks "Price History" button
    ↓
PriceHistoryButton opens Modal
    ↓
Fetches data from /api/listings/:id/price-history
    ↓
Displays historical prices with dates
    ↓
Highlights current price
```

### 2. Request Callback Flow
```
User clicks "Request Callback" button
    ↓
RequestCallbackButton opens Modal with form
    ↓
User fills: name, phone, preferred time, message
    ↓
Submits to POST /api/callback-requests
    ↓
Shows success toast
    ↓
Seller receives notification
```

### 3. Seller Trust Flow
```
User views listing
    ↓
Sees SellerInfoCard with:
  - Verification badge
  - Member since date
  - Response time
  - Trust badges
    ↓
Builds confidence
    ↓
Clicks contact or callback
```

### 4. Safety Education Flow
```
User concerned about safety
    ↓
Clicks on SafetyTips (collapsed by default)
    ↓
Expands to show 5 safety guidelines
    ↓
User feels informed and secure
    ↓
Proceeds with transaction
```

### 5. Report Abuse Flow
```
User sees suspicious listing
    ↓
Clicks "Report Abuse" button
    ↓
ReportAbuseButton opens Modal
    ↓
Selects reason + adds details
    ↓
Submits to POST /api/reports
    ↓
Moderators notified
```

### 6. Mark Unavailable Flow (Owner Only)
```
Listing owner wants to hide listing
    ↓
Clicks "Mark Unavailable" button
    ↓
MarkUnavailableButton shows confirmation modal
    ↓
Confirms action
    ↓
PATCH /api/listings/:id/mark-unavailable
    ↓
Listing hidden from search
```

### 7. Growth Conversion Flow
```
User views listing
    ↓
Scrolls to bottom
    ↓
Sees "Post Similar Ad" CTA
    ↓
Clicks PostSimilarAdButton
    ↓
Navigates to /dashboard/seller/create
    ↓
Category pre-filled (if available)
    ↓
User becomes seller
```

---

## 📦 Component Dependencies

### External Package Dependencies
```typescript
// All new components use:
import { Button, Modal, Input, Textarea, useToast } from '@marketplace/ui'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
```

### Internal Dependencies
```typescript
// SellerInfoCard imports:
import TrustBadges from './TrustBadges'
import { Avatar } from '@marketplace/ui'
```

---

## 🎯 Component Props Reference

### 1. RequestCallbackButton
```typescript
interface RequestCallbackButtonProps {
  listingId: string        // Required: ID of the listing
  sellerId: string         // Required: ID of the seller
  listingTitle: string     // Required: Display in modal
}
```

### 2. PriceHistoryButton
```typescript
interface PriceHistoryButtonProps {
  listingId: string        // Required: ID for fetching history
  currentPrice: number     // Required: Display current price
  currency: string         // Required: Currency symbol/code
}
```

### 3. SellerInfoCard
```typescript
interface SellerInfoCardProps {
  seller: {
    id: string
    name: string
    avatarUrl?: string | null
    emailVerifiedAt?: string | null
    phoneVerifiedAt?: string | null
    createdAt?: string     // Used to calculate member duration
  }
  responseTime?: string    // Optional: e.g., "Within minutes"
  className?: string       // Optional: Additional styles
}
```

### 4. SafetyTips
```typescript
interface SafetyTipsProps {
  className?: string       // Optional: Additional styles
}
```

### 5. ReportAbuseButton
```typescript
interface ReportAbuseButtonProps {
  listingId: string        // Required: ID of listing to report
  listingTitle: string     // Required: Display in modal
}
```

### 6. MarkUnavailableButton
```typescript
interface MarkUnavailableButtonProps {
  listingId: string        // Required: ID of listing
  listingTitle: string     // Required: Display in modal
  isOwner: boolean         // Required: Only show to owner
}
```

### 7. PostSimilarAdButton
```typescript
interface PostSimilarAdButtonProps {
  categorySlug?: string | undefined  // Optional: Pre-fill category
  className?: string                 // Optional: Additional styles
}
```

---

## 🔄 State Management Map

### Component-Level State

#### RequestCallbackButton
```typescript
const [isOpen, setIsOpen] = useState(false)           // Modal visibility
const [loading, setLoading] = useState(false)         // Submit state
const [formData, setFormData] = useState({            // Form fields
  name: '',
  phone: '',
  preferredTime: '',
  message: ''
})
```

#### PriceHistoryButton
```typescript
const [isOpen, setIsOpen] = useState(false)           // Modal visibility
const [history, setHistory] = useState([])            // Price history data
const [loading, setLoading] = useState(false)         // Fetch state
```

#### SafetyTips
```typescript
const [isExpanded, setIsExpanded] = useState(false)   // Collapse state
```

#### ReportAbuseButton
```typescript
const [isOpen, setIsOpen] = useState(false)           // Modal visibility
const [loading, setLoading] = useState(false)         // Submit state
const [reason, setReason] = useState('')              // Selected reason
const [details, setDetails] = useState('')            // Additional details
```

#### MarkUnavailableButton
```typescript
const [isOpen, setIsOpen] = useState(false)           // Modal visibility
const [loading, setLoading] = useState(false)         // Submit state
```

---

## 🎨 Styling Patterns

### Common Button Styles
```typescript
// Primary CTA (Green in reference image)
className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground"

// Secondary CTA (Outline in reference image)
className="w-full rounded-lg border border-primary bg-transparent px-4 py-2 text-primary"

// Destructive Action (Red)
className="rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10"
```

### Card Styles
```typescript
// Standard card
className="rounded-lg border bg-card p-4"

// Elevated card
className="rounded-lg border bg-card p-6 space-y-4"

// Gradient CTA card
className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-8"
```

### Modal Sizes
```typescript
size="sm"   // Small modals (confirmations)
size="md"   // Medium modals (forms)
size="lg"   // Large modals (complex content)
```

---

## 📱 Responsive Behavior

### Desktop (lg and above)
```
┌─────────────────────┬───────────────────┐
│                     │                   │
│  Gallery (60%)      │  Sidebar (40%)    │
│                     │                   │
└─────────────────────┴───────────────────┘
```

### Tablet & Mobile
```
┌─────────────────────────────────────────┐
│  Gallery (100%)                         │
├─────────────────────────────────────────┤
│  Sidebar (100%)                         │
└─────────────────────────────────────────┘
```

### Button Responsiveness
```typescript
// Desktop
className="w-auto"

// Mobile
className="w-full sm:w-auto"
```

---

## 🔌 API Integration Points

### Component → API Mapping

| Component | API Endpoint | Method | Purpose |
|-----------|--------------|--------|---------|
| RequestCallbackButton | `/api/callback-requests` | POST | Submit callback request |
| PriceHistoryButton | `/api/listings/:id/price-history` | GET | Fetch price history |
| ReportAbuseButton | `/api/reports` | POST | Submit abuse report |
| MarkUnavailableButton | `/api/listings/:id/mark-unavailable` | PATCH | Hide listing |

---

## ✅ Component Checklist

Use this to verify implementation:

### RequestCallbackButton
- [x] Opens modal on click
- [x] Form validates required fields
- [x] Shows loading state during submit
- [x] Displays success/error toast
- [x] Closes modal on success
- [x] Resets form after submit
- [x] Keyboard accessible

### PriceHistoryButton
- [x] Opens modal on click
- [x] Shows loading state while fetching
- [x] Displays price timeline
- [x] Highlights current price
- [x] Handles empty state
- [x] Keyboard accessible

### SellerInfoCard
- [x] Displays large avatar
- [x] Shows verification badge
- [x] Calculates member duration
- [x] Shows response time indicator
- [x] Integrates trust badges
- [x] Links to seller profile
- [x] Responsive layout

### SafetyTips
- [x] Collapsed by default
- [x] Expands on click
- [x] Displays all 5 tips
- [x] Accessible with ARIA
- [x] Smooth animation
- [x] Mobile friendly

### ReportAbuseButton
- [x] Opens modal on click
- [x] Radio button categories work
- [x] Validates reason selection
- [x] Shows warning about false reports
- [x] Displays success/error toast
- [x] Destructive styling
- [x] Keyboard accessible

### MarkUnavailableButton
- [x] Only shows for owner
- [x] Confirmation modal works
- [x] Shows loading state
- [x] Displays success/error toast
- [x] Keyboard accessible

### PostSimilarAdButton
- [x] Navigates to create listing
- [x] Pre-fills category if available
- [x] Responsive button size
- [x] Proper icon display

---

## 🎓 Learning Resources

### Implementation References
1. **Modal Patterns**: `packages/ui/src/components/Modal.tsx`
2. **Form Handling**: `RequestCallbackButton.tsx`
3. **Collapsible Sections**: `SafetyTips.tsx`
4. **Trust Signals**: `SellerInfoCard.tsx`
5. **Navigation**: `PostSimilarAdButton.tsx`

### Best Practices Applied
- ✅ Single Responsibility Principle (each component does one thing)
- ✅ Props Drilling Avoidance (only necessary props)
- ✅ Loading States (all async operations)
- ✅ Error Boundaries (try-catch with toast)
- ✅ Accessibility (ARIA labels, keyboard nav)
- ✅ Mobile First (responsive by default)

---

**Component Map Version**: 1.0
**Last Updated**: Implementation Complete
**Total Components**: 7 new + integration with 8 existing
**Status**: ✅ Production Ready
