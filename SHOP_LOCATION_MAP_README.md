# Shop Location Map Feature - Quick Reference

## ✅ What Was Added

Added a **Shop Location Map** component that displays seller shop addresses with map integration on both product detail pages and seller profile pages.

## 📦 New Component

**File**: `apps/web/src/components/marketplace/ShopLocationMap.tsx`

## 🎯 Features

1. **📍 Address Display** - Shows shop location with icon
2. **🗺️ Open in Maps** - Direct link to Google Maps
3. **🧭 Get Directions** - Navigation button
4. **👁️ Toggle Map View** - Collapsible embedded map section
5. **📱 Mobile Responsive** - Optimized for all devices
6. **🆓 Works Without API Key** - Uses Google Maps links (no API key needed)

## 📍 Where It Appears

### 1. Product Detail Page
When viewing a listing, buyers see the seller's shop location in the sidebar.

### 2. Seller Profile Page
On the seller's profile, the shop location appears as a dedicated section.

## 🚀 Quick Usage

```tsx
import ShopLocationMap from '@/components/marketplace/ShopLocationMap'

// Basic usage (uses existing location field)
<ShopLocationMap 
  sellerName="Hope's Fashion"
  location="Bole, Addis Ababa"
/>

// With coordinates (optional)
<ShopLocationMap 
  sellerName="Hope's Fashion"
  location="Addis Ababa"
  shopAddress="123 Bole Road, Near Edna Mall"
  latitude={9.0192}
  longitude={38.7525}
/>
```

## 🎨 What It Looks Like

```
┌─────────────────────────────────────────┐
│ 📍 Shop Location          [Show Map]   │
│    Hope's Fashion                       │
├─────────────────────────────────────────┤
│ 🏠 Bole, Addis Ababa, Ethiopia         │
│                                          │
│ [Open in Maps]  [Get Directions]       │
├─────────────────────────────────────────┤
│ ℹ️  Visit the shop in person for the   │
│    best experience. Call ahead to       │
│    confirm availability.                │
└─────────────────────────────────────────┘
```

When "Show Map" is clicked:
```
┌─────────────────────────────────────────┐
│ 📍 Shop Location          [Hide Map]   │
│    Hope's Fashion                       │
├─────────────────────────────────────────┤
│ 🏠 Bole, Addis Ababa, Ethiopia         │
│                                          │
│ [Open in Maps]  [Get Directions]       │
├─────────────────────────────────────────┤
│                                          │
│         [Interactive Map Area]          │
│      (300px height placeholder)         │
│                                          │
├─────────────────────────────────────────┤
│ ℹ️  Visit the shop in person...        │
└─────────────────────────────────────────┘
```

## 🔧 How It Works

### Current Implementation

1. **Uses existing `location` field** from User model
2. **Generates Google Maps links** (no API key required)
3. **Shows placeholder for embedded map** (can be enhanced with API key)

### Map Links Generated

- **View Location**: `https://www.google.com/maps/search/?api=1&query=ADDRESS`
- **Get Directions**: `https://www.google.com/maps/dir/?api=1&destination=ADDRESS`

## 🎯 Benefits

### For Buyers
✅ Easy to find physical shop locations
✅ One-click navigation to seller's shop
✅ Can plan visits to multiple sellers
✅ Better trust knowing shop has physical presence

### For Sellers
✅ Increases foot traffic to physical shops
✅ Builds credibility with visible location
✅ Helps buyers find them easily
✅ Reduces "Where are you located?" messages

## 🚀 Optional Enhancements

### Add Google Maps API Key

To show embedded interactive maps:

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```
3. Uncomment iframe section in component

### Add GPS Coordinates

Extend database schema:

```sql
ALTER TABLE users ADD COLUMN shop_latitude DECIMAL(10, 7);
ALTER TABLE users ADD COLUMN shop_longitude DECIMAL(10, 7);
```

Then use in component:
```tsx
<ShopLocationMap 
  sellerName={seller.name}
  location={seller.location}
  latitude={seller.shopLatitude}
  longitude={seller.shopLongitude}
/>
```

## 📊 Data Requirements

### Minimum (Current)
- ✅ `location` field (already exists in User model)

### Optional (Future)
- Shop address (street, building, etc.)
- GPS coordinates (latitude/longitude)
- Business hours
- Shop phone number
- Shop photos

## 🧪 Testing

Test the component by:

1. Navigate to any listing page with a seller
2. Look for "Shop Location" section in sidebar
3. Click "Show Map" to expand
4. Click "Open in Maps" - should open Google Maps
5. Click "Get Directions" - should open navigation
6. Test on mobile device

## 📱 Mobile Experience

- ✅ Responsive layout
- ✅ Touch-friendly buttons (44x44px minimum)
- ✅ Optimized map height (300px)
- ✅ Collapsible to save space

## 🎓 Documentation

**Full Guide**: `/docs/SHOP_LOCATION_MAP_GUIDE.md`

Includes:
- Complete usage examples
- Google Maps API integration
- Database schema extensions
- Future enhancement ideas
- Styling customization
- Accessibility features

## ✅ Summary

**Created**: 1 new component
**Updated**: 2 pages (listing detail, seller profile)
**Documentation**: 2 files
**Status**: ✅ Production ready
**API Key Required**: ❌ No (optional for embedded maps)

The shop location map is now live and helps buyers find sellers' physical locations easily! 🎉
