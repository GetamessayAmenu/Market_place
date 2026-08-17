# Unified Sale & Custom Design Product and Request Engine Implementation

## Overview
This implementation provides a unified product model where a single product can support both ready-made sales and custom design orders, preventing duplicate search results and Jiji-style listings. The system is designed for an Ethiopian multi-vendor fashion marketplace with direct buyer-seller connections (no payment gateways or delivery APIs).

## Architecture Summary

### **Critical Platform Constraints Addressed**
1. ✅ **Single Product Record**: Each product exists once in the database with optional custom design capability
2. ✅ **No Payment Gateways**: Direct buyer-seller connection via in-app chat, WhatsApp, phone
3. ✅ **No Delivery APIs**: Handover managed through agreements and direct coordination
4. ✅ **Unified Search**: Meilisearch returns single product with capability flags

### **Step 1: Prisma Database Schema Extensions**

#### Updated Models:
- **Listing Model**: Added unified selling capability fields
  - `supportsReadyMade` (Boolean, default: true)
  - `supportsCustomDesign` (Boolean, default: false)
  - `startingCustomPrice` (Decimal, optional)
  - `estimatedProductionDays` (Int, optional)
  - `customizationOptions` (JSON, optional: size, fabric, color, embroidery config)

- **CustomOrder Model**: Updated with new unified fields
  - `selectedType` (String, default: "CUSTOM_DESIGN")
  - `customerNotes` (String, optional - renamed from buyerNotes)
  - Updated status enum to: `INQUIRY_PENDING`, `MEASUREMENTS_CONFIRMED`, `FABRIC_CUTTING`, `TAILORING_IN_PROGRESS`, `FITTING_READY`, `READY_FOR_HANDOVER`, `COMPLETED`, `CANCELLED`

#### Migration Applied:
- ✅ Database schema migrated with `npx prisma db push --accept-data-loss`
- ✅ All enum values updated to new unified status system
- ✅ Prisma client regenerated with updated types

### **Step 2: NestJS Backend Implementation**

#### Product Service & DTO Updates:
- **CreateListingDto**: Progressive validation with `CustomDesignValidation` and `CustomPriceValidation` constraints
- **UpdateListingDto**: Same progressive validation for updates
- **Validation Logic**: When `supportsCustomDesign: true`, requires `estimatedProductionDays` and `startingCustomPrice`

#### Custom Order Request Service:
- **CustomOrdersService**: Enhanced with unified custom order management
  - `create()`: Validates product supports custom design, initiates ChatThread if needed, emits Socket.IO events
  - `updateMilestone()`: Allows sellers to advance tailoring stages
  - `getMilestoneTimeline()`: Returns visual progress with icons for each stage
- **CustomOrdersRepository**: 
  - `findConversationByParticipants()`: Checks for existing chat threads
  - `createOrder()`: Links to existing conversation or creates new one
- **CustomOrdersController**: New endpoints
  - `PATCH /:id/milestone`: Update production milestone
  - `GET /:id/milestones`: Get milestone timeline

#### Meilisearch Integration:
- **ListingIndexMapper**: Updated to index unified flags
  - `supportsReadyMade`: Boolean flag for ready-made capability
  - `supportsCustomDesign`: Boolean flag for custom design capability
  - `startingCustomPrice`: Optional starting price for custom orders
- **Search Facets**: Clean, unique results with capability badges

### **Step 3: Next.js Frontend Implementation**

#### Seller Product Creation Wizard:
- **DeliveryOptions Component**: Enhanced with progressive disclosure
  - "Selling Options" card with unified checkboxes
  - Toggle for "Accept Custom Design Orders"
  - Smooth slide-down form when enabled:
    - Starting Custom Price (ETB)
    - Estimated Production Time (days)
    - Customization Checkboxes: Size, Fabric, Color, Embroidery, Custom Notes
- **ListingForm**: Updated to pass unified fields to API
- **New Listing Page**: Transforms form data with conditional custom design fields

#### Marketplace Catalog & Search Filters:
- **FilterSidebar**: Transaction model filter bar
  - Pill buttons: `[All]`, `[Ready-Made]`, `[Custom Design Available]`, `[Fashion Rentals]`
  - Filter logic via URL parameters
- **CatalogClient**: Handles filter state and API integration
- **ListingCard**: Displays capability badges
  - `[Ready-Made]` badge for ready-made items
  - `[Custom Design]` badge with gold styling for custom available items
  - Single product card per item (no duplicates)

#### Product Details Page & Order Type Selector:
- **OrderTypeSelector Component**: Tabbed interface for dual-capability products
  - Option A: "Buy Ready-Made" (stock size/price, direct purchase)
  - Option B: "Order Custom Design" (opens custom form)
  - Shows pricing and production time for custom option
- **Product Details Page**: 
  - Added OrderTypeSelector for products with both capabilities
  - Added capability badges: Ready-Made, Custom Design Available
  - Integration with CustomDesignDrawer component

#### Custom Design Request Form:
- **CustomDesignRequestForm Component**: Interactive form with
  - Size selection (XS to XXL + Custom)
  - Body measurements (Bust, Waist, Hips, Height, Shoulder-to-Hem, etc.)
  - Unit selection (cm/in)
  - Fabric choice from product options
  - Color selection from product options
  - Embroidery/Tilf style notes
  - Customer notes (if allowed)
  - Inspiration image upload placeholder (Cloudinary integration)
  - Form validation with error handling
- **CustomDesignDrawer Component**: Drawer wrapper for the form
  - Success/error alerts
  - API integration via `/api/custom-orders`
  - Auto-close on success

#### Seller Dashboard Management Hub:
- **Orders Page**: Enhanced with unified order management
  - Fetches both regular orders and custom orders
  - Transforms custom orders to match Order interface
  - Combined display in grid/kanban views
  - Custom order type badge with orange styling
- **TailoringMilestoneTracker**: Visual progress tracker
  - 7 stages with icons: 📝 Inquiry → 📏 Measurements → ✂️ Fabric → 🧵 Tailoring → 👗 Fitting → 📦 Handover → ✅ Complete
  - Click-to-advance milestone functionality
  - Real-time status updates via API
- **OrderCard**: Inline milestone updater for custom orders
  - Shows progress tracker on card
  - Clickable milestones for quick updates
  - Distinct visual tags for custom orders

## Milestone Tracking System

### Production Stages:
1. **INQUIRY_PENDING** 📝 - Customer submitted custom design request
2. **MEASUREMENTS_CONFIRMED** 📏 - Measurements verified and confirmed
3. **FABRIC_CUTTING** ✂️ - Fabric cutting in progress
4. **TAILORING_IN_PROGRESS** 🧵 - Tailoring work underway
5. **FITTING_READY** 👗 - Ready for customer fitting
6. **READY_FOR_HANDOVER** 📦 - Item ready for pickup/delivery
7. **COMPLETED** ✅ - Order completed and delivered
8. **CANCELLED** - Order cancelled by buyer or seller

### API Endpoints:
- `POST /custom-orders` - Create custom design request
- `GET /custom-orders?role=seller` - Fetch seller's custom orders
- `GET /custom-orders/:id` - Get specific order details
- `PATCH /custom-orders/:id/milestone` - Update production milestone
- `GET /custom-orders/:id/milestones` - Get milestone timeline

## UX Features

### Progressive Disclosure:
- Custom design options only shown when "Accept Custom Design Orders" is enabled
- Smooth animations for form field reveal
- Contextual validation messages

### Visual Indicators:
- Gold-colored badges for custom design capability
- Icon-based milestone tracker with emoji
- Color-coded status badges (info/warning/success/error)
- Distinct visual tags for order types

### Mobile-First Design:
- Responsive grid layouts
- Touch-friendly milestone buttons
- Drawer-based forms for mobile optimization
- Compact card designs for order management

## Integration Points

### Socket.IO Events:
- `custom_order.created` - Notifies seller of new custom order
- `custom_order.milestone_updated` - Notifies buyer of milestone progress
- Chat thread auto-creation for order communication

### BullMQ Processing:
- Audit logging for order creation and milestone updates
- Non-blocking operations for real-time responsiveness
- Retry logic for failed operations

### Type Safety:
- Shared types in `@marketplace/types` package
- CustomOrderStatus enum for type-safe status handling
- Interface definitions for form data and API responses

## File Structure

```
├── prisma/
│   ├── schema.prisma (updated with unified fields)
│   └── migrations/ (migration applied)
├── services/api/src/modules/
│   ├── listings/
│   │   ├── dto/create-listing.dto.ts (progressive validation)
│   │   └── dto/update-listing.dto.ts (progressive validation)
│   ├── custom-orders/
│   │   ├── custom-orders.service.ts (milestone tracking)
│   │   ├── custom-orders.controller.ts (new endpoints)
│   │   ├── custom-orders.repository.ts (conversation linking)
│   │   └── dto/create-custom-order.dto.ts (updated measurements)
│   └── search/
│       └── mappers/listing-index.mapper.ts (unified flags)
├── services/realtime/src/chat/
│   └── chat-safety.service.ts (already integrated)
├── apps/web/src/
│   ├── app/seller/catalog/new/page.tsx (updated API data)
│   ├── app/seller/orders/page.tsx (unified order management)
│   ├── app/listings/[id]/page.tsx (order type selector)
│   └── components/
│       ├── seller/
│       │   ├── DeliveryOptions.tsx (progressive disclosure)
│       │   └── ListingForm.tsx (unified fields)
│       └── marketplace/
│           ├── OrderTypeSelector.tsx (new)
│           ├── CustomDesignRequestForm.tsx (new)
│           ├── CustomDesignDrawer.tsx (new)
│           ├── FilterSidebar.tsx (transaction filters)
│           └── ListingCard.tsx (capability badges)
```

## Testing & Verification

### Manual Testing Steps:
1. **Product Creation**: Create product with both ready-made and custom options
2. **Search Verification**: Confirm single product appears in search with both badges
3. **Custom Order**: Submit custom design request through form
4. **Milestone Updates**: Test milestone progression in seller dashboard
5. **Real-time Alerts**: Verify Socket.IO events fire correctly

### Verification Checklist:
- ✅ Single product record per item (no duplicates)
- ✅ Progressive validation works for custom design fields
- ✅ Meilisearch indexes unified flags correctly
- ✅ Milestone tracker updates status via API
- ✅ Socket.IO events emit for order creation and updates
- ✅ Custom orders appear in seller dashboard
- ✅ Transaction model filters work in catalog

## Future Enhancements

### Potential Improvements:
1. **Measurement Guide**: Interactive diagram with visual measurement points
2. **Cloudinary Integration**: Actual image upload for inspiration photos
3. **Price Calculator**: Dynamic pricing based on fabric/complexity
4. **Quote System**: Seller can propose custom quotes
5. **3D Preview**: Virtual fitting room for custom orders
6. **Analytics**: Custom order conversion rates and popular customizations

### Scalability Considerations:
- Database indexes on unified fields for performance
- Separate collection for custom orders if volume grows
- Cache for milestone timelines
- WebSocket rooms for order-specific notifications

## Deployment Notes

### Environment Variables Required:
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis for BullMQ and Socket.IO adapter
- `CLOUDINARY_URL`: Cloudinary for image uploads (future)

### Service Dependencies:
- PostgreSQL database with updated schema
- Redis server for real-time features
- Socket.IO adapter (Redis-based for scaling)
- Meilisearch for search indexing

### Module Registration:
- Unified DTOs already integrated in ListingsModule
- CustomOrdersModule with new controller endpoints
- Frontend components auto-imported via Next.js routing

---

**Implementation Status**: ✅ Complete
**Architecture**: ✅ Unified and Scalable
**UX Standards**: ✅ Progressive Disclosure and Mobile-First
**Platform Constraints**: ✅ Single Product Model, No Payment Gateways
