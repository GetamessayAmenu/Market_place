# Shop Location Map - Visibility Fix

## Issue
Shop Location Map component was not visible on the product detail page.

## Root Cause
The seller's `location` and `createdAt` fields were not being fetched from the API.

## Solution Applied

### 1. Backend Changes

#### Updated: `services/api/src/modules/listings/listings.repository.ts`

Added `location` and `createdAt` to the seller select fields:

```typescript
const listingInclude = {
  images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  category: { select: { id: true, name: true, slug: true, parentId: true } },
  seller: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      phone: true,
      location: true,        // ✅ Added
      createdAt: true,       // ✅ Added
    },
  },
  _count: { select: { favorites: true } },
} satisfies Prisma.ListingInclude;
```

#### Updated: `services/api/src/modules/listings/interfaces/listing-with-relations.interface.ts`

Updated TypeScript interface to include new fields:

```typescript
export type ListingWithRelations = Listing & {
  readonly images: readonly ListingImageRecord[];
  readonly category: Pick<Category, 'id' | 'name' | 'slug' | 'parentId'>;
  readonly seller: Pick<
    User,
    'id' | 'displayName' | 'avatarUrl' | 'emailVerifiedAt' | 'phoneVerifiedAt' | 'phone' | 'location' | 'createdAt'
    // ✅ Added location and createdAt
  >;
  readonly _count?: { readonly favorites: number };
};
```

### 2. Frontend Changes

#### Updated: `apps/web/src/app/listings/[id]/page.tsx`

Fixed field name from `name` to `displayName` to match API response:

**Before:**
```typescript
seller?: {
  id: string
  name: string  // ❌ API returns displayName
  // ...
}
```

**After:**
```typescript
seller?: {
  id: string
  displayName: string  // ✅ Matches API
  avatarUrl?: string | null
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  location?: string | null      // ✅ Added
  createdAt?: string            // ✅ Added
}
```

Updated all references:
- `listing.seller.name` → `listing.seller.displayName` (3 places)
- ChatButton component
- ShopLocationMap component
- JSON-LD schema

## Files Changed

### Backend (2 files)
1. ✅ `services/api/src/modules/listings/listings.repository.ts`
2. ✅ `services/api/src/modules/listings/interfaces/listing-with-relations.interface.ts`

### Frontend (1 file)
3. ✅ `apps/web/src/app/listings/[id]/page.tsx`

## Verification

### TypeScript Checks
```bash
✅ All files: No TypeScript errors
✅ API builds successfully
✅ Frontend compiles without errors
```

### What Now Works

1. **Shop Location Map** - Now displays when seller has location data
2. **Enhanced Seller Card** - Can calculate member duration from createdAt
3. **Consistent Field Names** - Frontend and backend aligned on displayName

## Testing Steps

1. Restart the API server:
   ```bash
   cd services/api
   npm run start:dev
   ```

2. Refresh the web app

3. Navigate to any product listing

4. Check the sidebar - you should now see:
   - Enhanced Seller Card (with member duration)
   - **Shop Location Map** (if seller has location)
   - Safety Tips
   - Action buttons

## Expected Display

If a seller has location data, you'll see:

```
┌────────────────────────────────────┐
│ [Enhanced Seller Card]             │
├────────────────────────────────────┤
│ 📍 Shop Location    [Show Map]    │
│    Hope's Fashion                  │
│ ───────────────────────────────────│
│ 🏠 Bole, Addis Ababa              │
│                                    │
│ [Open in Maps] [Get Directions]   │
│ ───────────────────────────────────│
│ ℹ️  Visit the shop in person...   │
└────────────────────────────────────┘
```

If no location data exists, the component won't display (graceful handling).

## Database Check

To verify sellers have location data:

```sql
-- Check which sellers have locations
SELECT 
  id, 
  display_name, 
  location,
  created_at
FROM users 
WHERE seller_type IS NOT NULL;

-- Update a seller for testing (if needed)
UPDATE users 
SET location = 'Bole, Addis Ababa, Ethiopia'
WHERE id = 'your-seller-id';
```

## What the Fields Provide

### `location` field
- Used by: **ShopLocationMap** component
- Shows: Physical shop address/area
- Format: Free text (e.g., "Bole, Addis Ababa, Ethiopia")

### `createdAt` field
- Used by: **SellerInfoCard** component
- Shows: Member duration (e.g., "Member since 2023")
- Format: ISO timestamp

## API Response Example

After the fix, the API now returns:

```json
{
  "id": "listing-id",
  "title": "Product Title",
  "seller": {
    "id": "seller-id",
    "displayName": "Hope's Fashion",
    "avatarUrl": "https://...",
    "emailVerifiedAt": "2024-01-15T10:00:00Z",
    "phoneVerifiedAt": "2024-01-15T10:00:00Z",
    "phone": "+251912345678",
    "location": "Bole, Addis Ababa, Ethiopia",  // ✅ Now included
    "createdAt": "2023-06-20T08:30:00Z"          // ✅ Now included
  }
}
```

## Status

✅ **Fixed** - Shop Location Map now visible when seller has location data
✅ **All TypeScript errors resolved**
✅ **API and Frontend aligned**
✅ **Ready for testing**

## Next Steps

1. Restart servers and test
2. If sellers don't have location data, they can add it in their profile settings
3. Consider adding a prompt for sellers to add their shop location during onboarding
