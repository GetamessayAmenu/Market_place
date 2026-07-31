# Seller Dashboard Restructure Summary

## Overview
The Seller Dashboard has been successfully restructured from 15 separate modules into 6 streamlined hubs, designed specifically for Ethiopian artisans, tailors, and rental shop owners.

## New Hub Structure

### 1. Overview Hub (`/seller/dashboard`)
**Purpose:** Action triage and quick access to critical seller activities

**Features:**
- **Action Triage Bar:** Urgent action cards showing:
  - New Inquiries
  - Pending Rental Requests
  - Upcoming Handovers/Returns
  - Unread Messages
- **Quick Action Shortcuts:** Single-click triggers for:
  - Add New Listing
  - Update Blackout Calendar
  - Share Storefront Link
- **Engagement Health Metrics:** Counters for:
  - WhatsApp Clicks
  - Phone Number Reveals
  - In-App Chat Threads Initiated
- **Cultural Holiday Alert Banner:** Contextual prompts before major Ethiopian holidays (Enkutatash, Meskel, Timket, Fasika, Wedding Season)

**File:** `apps/web/src/app/seller/dashboard/page.tsx`

---

### 2. Catalog & Stock Manager (`/seller/catalog`)
**Purpose:** Unified management of listings, inventory, and rental availability

**Features:**
- **Unified Listing Form:** Dynamic form with business model toggles:
  - Sale: Quantity, size variants, retail price
  - Rental: Deposit requirement, care rules, multi-tier duration pricing
  - Custom Orders: Body measurement requirements, default turnaround lead time
- **Interactive Blackout Calendar:** Block specific date ranges for cleaning, repairs, or offline shop use
- **Stock Quick-Edit Table:** Rapid inline status toggle (In Stock, Rented Out, Out of Stock)
- **Traditional Fabric Presets:** Quick-select attributes (Menen, Saba, Tilf embroidery, Kutna, Netela, Gabi, Shema)

**File:** `apps/web/src/app/seller/catalog/page.tsx`

---

### 3. Orders & Requests Pipeline (`/seller/orders`)
**Purpose:** Unified management of sales, rentals, and custom orders

**Features:**
- **Unified Pipeline View:** Kanban-style grid tracking all order models with status stages:
  - Requested/Inquiry → Approved/Confirmed → In Progress/Handover → Completed/Returned
- **Visual Model Badges:** Color-coded badges for Sale, Rental, and Custom orders
- **Custom Order Milestone Tracker:** Visual step updater:
  - Measurements Received → Fabric Cutting → Tailoring in Progress → Ready for Fitting/Handover
- **Pre-Handover Condition Logger:** Photo-upload drawer for documenting garment conditions
- **Rental Extension Handler:** Interface to approve/reject extension requests
- **Agreement Generator:** Generate printable Handover Care & Deposit Agreement sheets

**File:** `apps/web/src/app/seller/orders/page.tsx`

---

### 4. Direct Communication Center (`/seller/messages`)
**Purpose:** Order-linked messaging with quick response capabilities

**Features:**
- **Order-Linked Chat Interface:** Real-time messaging linked to specific listings, rental requests, or custom orders
- **Localized Quick Response Templates:** Pre-saved responses for common questions:
  - Store location (Shiro Meda, Bole, etc.)
  - Measurement instructions
  - Deposit policy explanations
  - General greetings
- **Off-Platform Triggers:** Direct deep-links to:
  - WhatsApp chats with pre-filled order context
  - Direct phone calls
- **Custom Quote Builder:** Modal to issue custom price quotes or rental counter-offers within message threads

**File:** `apps/web/src/app/seller/messages/page.tsx`

---

### 5. Store & Profile Manager (`/seller/store`)
**Purpose:** Storefront settings, verification, and business configuration

**Features:**
- **Verification & KYC Upload Desk:** Upload documents for "Verified Designer / Authentic Habesha Seller" badge:
  - Business License
  - Taxpayer Identification Number (TIN)
  - Artisan Certificate (optional)
- **Sub-City & Market Hub Selector:** Dropdown selectors for:
  - Addis Ababa sub-cities (Shiro Meda, Bole, Kazanchis, Merkato, Piassa)
  - Regional hubs (Hawassa, Bahir Dar, Mekelle, Dire Dawa, Jimma)
- **Promotions & Banners:** Controls to:
  - Feature pinned listings on storefront
  - Add promotional announcement banners
- **Storefront QR & Link Generator:** Auto-generated printable QR code and social link

**File:** `apps/web/src/app/seller/store/page.tsx`

---

### 6. Insights & Customer Feedback (`/seller/insights`)
**Purpose:** Performance analytics, deposit tracking, and customer management

**Features:**
- **Engagement Analytics:** Metric graphs for:
  - Listing views
  - Chat starts
  - WhatsApp clicks
  - Phone reveals
- **Manual Offline Transaction & Deposit Log:** Ledger table for:
  - Offline cash payments
  - Security deposits held
  - Deposit refunds
- **Reviews & Ratings Manager:** Read and respond to buyer reviews; flag abusive ratings
- **Customer Directory:** Contact list with:
  - Past buyer information
  - Stored body measurements (for custom re-orders)
  - Rental return history

**File:** `apps/web/src/app/seller/insights/page.tsx`

---

## Navigation Components

### Seller Sidebar
**File:** `apps/web/src/components/seller/SellerSidebar.tsx`

**Features:**
- Collapsible sidebar with 6 hub navigation items
- Active state indicators
- Badge support for unread messages
- Mobile-responsive design

### Seller Header
**File:** `apps/web/src/components/seller/SellerHeader.tsx`

**Features:**
- Global notifications bell icon
- Help center link
- User profile access
- Brand logo

### Seller Layout
**File:** `apps/web/src/app/seller/layout.tsx`

**Features:**
- Wraps all seller hub pages
- Integrates sidebar and header
- Responsive main content area

---

## Routing Structure

```
/seller
├── /dashboard          # Hub 1: Overview
├── /catalog            # Hub 2: Catalog & Stock Manager
├── /orders             # Hub 3: Orders & Requests Pipeline
├── /messages           # Hub 4: Direct Communication Center
├── /store              # Hub 5: Store & Profile Manager
└── /insights           # Hub 6: Insights & Customer Feedback
```

---

## Business Model Integration

All hubs support the three business models:

1. **Product Sales:** Direct purchase transactions
2. **Fashion Rentals:** Temporary garment rentals with deposits
3. **Custom-Made Orders:** Bespoke tailoring with measurements

The system is designed for listing and direct communication only - no integrated payment processing, escrow, or automated delivery logistics. All payments, deposits, and handovers happen off-platform.

---

## Cultural Context Features

### Ethiopian Holiday Alerts
The dashboard includes contextual alerts 2-3 weeks before major Ethiopian holidays:
- **Enkutatash:** Ethiopian New Year (September)
- **Meskel:** Finding of the True Cross (September)
- **Timket:** Epiphany (January)
- **Fasika:** Ethiopian Easter (April/May)
- **Wedding Season (Tlek Serg):** Peak wedding months

### Traditional Fabric Attributes
Built-in support for Ethiopian textile terminology:
- **Menen:** Traditional cotton fabric
- **Saba:** Woven textile pattern
- **Tilf:** Hand embroidery style
- **Kutna:** Traditional garment type
- **Netela:** Lightweight shawl
- **Gabi:** Heavy blanket/cape
- **Shema:** Handwoven cotton

### Location-Based Organization
Sub-city and regional hub selectors tailored to Ethiopian geography:
- Addis Ababa sub-cities
- Major regional cities

---

## Technical Implementation

### Frontend Stack
- **Framework:** Next.js App Router with React Server Components
- **Styling:** Tailwind CSS with mobile-first design
- **Form Validation:** Zod schemas with React Hook Form (to be implemented)
- **State Management:** React hooks with local state

### Architecture Notes
- **Modular Monolith:** Maintains clean separation of concerns
- **Mobile-First:** All components designed for mobile responsiveness
- **No Enterprise Bloat:** Stripped of shipping calculators, tax engines, multi-warehouse logic, payment gateways

---

## Next Steps

### Immediate (Required for Production)
1. **API Integration:** Connect all mock data to actual backend endpoints
2. **Form Validation:** Implement Zod schemas for all forms
3. **Authentication:** Ensure proper auth checks on all routes
4. **Error Handling:** Add comprehensive error states and loading indicators

### Medium Priority
1. **Real-time Updates:** Implement WebSocket connections for live notifications
2. **File Uploads:** Enable document uploads for KYC and condition photos
3. **QR Code Generation:** Implement actual QR code generation for storefront links
4. **PDF Generation:** Enable printable agreement generation

### Future Enhancements
1. **Analytics Dashboard:** More detailed performance charts and trends
2. **Customer Segmentation:** Advanced customer categorization
3. **Automated Reminders:** Holiday alert automation
4. **Multi-language Support:** Amharic language toggle

---

## Migration Notes

### Old Structure (15 Modules)
- Overview
- Listings
- Custom Orders
- Rentals
- Rental Queue
- Messages
- Analytics
- Reviews
- Create Listing
- My Rentals
- Saved Items
- Notifications
- Profile
- Settings
- Security

### New Structure (6 Hubs)
- Overview (merges: Overview, Notifications, Quick Actions)
- Catalog (merges: Listings, Create Listing, Inventory)
- Orders (merges: Custom Orders, Rentals, Rental Queue)
- Messages (merges: Messages, Notification Preferences, Quick Responses)
- Store (merges: Profile, Settings, Promotions, Location)
- Insights (merges: Analytics, Reviews, Customer Directory)

---

## Testing Checklist

- [ ] All hub pages render without errors
- [ ] Navigation between hubs works correctly
- [ ] Mobile responsive design verified
- [ ] Form validation implemented
- [ ] API endpoints connected
- [ ] Authentication flow tested
- [ ] File uploads functional
- [ ] Holiday alerts display correctly
- [ ] Quick response templates work
- [ ] Deposit log functionality tested

---

## Support & Maintenance

For questions or issues related to the seller dashboard restructure, refer to:
- Project Context: `PROJECT_CONTEXT.md`
- Component documentation in respective files
- API documentation (when available)
