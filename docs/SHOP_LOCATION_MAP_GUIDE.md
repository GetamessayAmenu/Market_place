# Shop Location Map - Implementation Guide

## Overview

The `ShopLocationMap` component displays a seller's shop location with an interactive map interface, making it easy for buyers to find physical shop locations.

## Features

✅ **Display shop address** - Shows formatted address with icon
✅ **Open in Maps** - Direct link to Google Maps
✅ **Get Directions** - Direct navigation link
✅ **Toggle map view** - Collapsible embedded map
✅ **Responsive design** - Mobile-friendly layout
✅ **Multiple address formats** - Supports location string or full address
✅ **Coordinates support** - Can use lat/lng if available

## Component Location

```
apps/web/src/components/marketplace/ShopLocationMap.tsx
```

## Usage

### Basic Usage (Text Location Only)

```tsx
import ShopLocationMap from '@/components/marketplace/ShopLocationMap'

<ShopLocationMap 
  sellerName="Hope's Fashion Boutique"
  location="Bole, Addis Ababa, Ethiopia"
/>
```

### With Full Address

```tsx
<ShopLocationMap 
  sellerName="Hope's Fashion Boutique"
  location="Addis Ababa"
  shopAddress="123 Bole Road, Near Edna Mall, Bole, Addis Ababa, Ethiopia"
/>
```

### With GPS Coordinates

```tsx
<ShopLocationMap 
  sellerName="Hope's Fashion Boutique"
  location="Addis Ababa"
  shopAddress="123 Bole Road, Near Edna Mall"
  latitude={9.0192}
  longitude={38.7525}
/>
```

## Props Interface

```typescript
interface ShopLocationMapProps {
  sellerName: string          // Required: Name of the seller/shop
  location: string            // Required: City/area location
  shopAddress?: string        // Optional: Full street address
  latitude?: number          // Optional: GPS latitude
  longitude?: number         // Optional: GPS longitude
  className?: string         // Optional: Additional CSS classes
}
```

## Integration Points

### 1. Product Detail Page
Location: `apps/web/src/app/listings/[id]/page.tsx`

```tsx
{/* Shop Location Map */}
{listing.seller?.location ? (
  <ShopLocationMap 
    sellerName={listing.seller.name}
    location={listing.seller.location}
  />
) : null}
```

### 2. Seller Profile Page
Location: `apps/web/src/app/sellers/[id]/page.tsx`

```tsx
{seller.location != null && seller.location.length > 0 && (
  <ShopLocationMap 
    sellerName={seller.displayName}
    location={seller.location}
  />
)}
```

## Features Breakdown

### 1. Address Display

Shows the shop location with:
- House/shop icon
- Formatted address
- Secondary location (if different)

### 2. Action Buttons

Two primary actions:
- **Open in Maps**: Opens location in default maps app
- **Get Directions**: Opens navigation to location

### 3. Interactive Map (Collapsible)

- Toggle button to show/hide map
- Placeholder for embedded map
- Link to full Google Maps view

### 4. Helpful Tips

Bottom section with informational message about visiting in person.

## Google Maps Integration

### Current Implementation

The component generates Google Maps URLs without requiring an API key:

```typescript
// Direct link to location
const googleMapsUrl = latitude && longitude
  ? `https://www.google.com/maps?q=${latitude},${longitude}`
  : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

// Navigation/directions link
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`
```

### Adding Google Maps Embed (Optional)

To enable the embedded map iframe, you need a Google Maps API key:

#### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps Embed API**
4. Create credentials (API Key)
5. Restrict the key to your domain

#### Step 2: Add API Key to Environment

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

#### Step 3: Update Component

In `ShopLocationMap.tsx`, replace the placeholder section:

```tsx
{showMap && (
  <div className="border-t">
    <div className="relative w-full h-[300px]">
      <iframe
        title={`Map showing location of ${sellerName}`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        src={
          latitude && longitude
            ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${latitude},${longitude}`
            : `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(fullAddress)}`
        }
        allowFullScreen
      />
    </div>
  </div>
)}
```

### Alternative: OpenStreetMap (Free)

For a free alternative without API keys, use OpenStreetMap:

```tsx
<iframe
  title={`Map showing location of ${sellerName}`}
  width="100%"
  height="100%"
  style={{ border: 0 }}
  loading="lazy"
  src={
    latitude && longitude
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`
      : undefined
  }
/>
```

**Note**: OpenStreetMap requires coordinates; it doesn't support address search.

## Database Schema Extension

To fully support shop locations, consider adding these fields:

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN shop_address TEXT;
ALTER TABLE users ADD COLUMN shop_latitude DECIMAL(10, 7);
ALTER TABLE users ADD COLUMN shop_longitude DECIMAL(10, 7);
ALTER TABLE users ADD COLUMN shop_city VARCHAR(100);
ALTER TABLE users ADD COLUMN shop_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN shop_hours JSONB;

-- Example shop_hours JSON structure:
{
  "monday": { "open": "09:00", "close": "18:00" },
  "tuesday": { "open": "09:00", "close": "18:00" },
  "wednesday": { "open": "09:00", "close": "18:00" },
  "thursday": { "open": "09:00", "close": "18:00" },
  "friday": { "open": "09:00", "close": "18:00" },
  "saturday": { "open": "10:00", "close": "16:00" },
  "sunday": { "closed": true }
}
```

### Prisma Schema Update

```prisma
model User {
  // ... existing fields
  
  location        String?     @db.VarChar(200)
  shopAddress     String?     @map("shop_address") @db.Text
  shopLatitude    Decimal?    @map("shop_latitude") @db.Decimal(10, 7)
  shopLongitude   Decimal?    @map("shop_longitude") @db.Decimal(10, 7)
  shopCity        String?     @map("shop_city") @db.VarChar(100)
  shopPhone       String?     @map("shop_phone") @db.VarChar(20)
  shopHours       Json?       @map("shop_hours")
  
  // ... rest of fields
}
```

## API Integration

### Get Coordinates from Address

If you have addresses but not coordinates, use geocoding:

```typescript
// Example using Google Geocoding API
async function geocodeAddress(address: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  )
  const data = await response.json()
  
  if (data.results[0]) {
    return {
      latitude: data.results[0].geometry.location.lat,
      longitude: data.results[0].geometry.location.lng,
    }
  }
  return null
}
```

### Backend Endpoint

```typescript
// POST /api/sellers/:id/geocode-address
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { address } = await req.json()
  
  const coordinates = await geocodeAddress(address)
  
  if (coordinates) {
    await prisma.user.update({
      where: { id: params.id },
      data: {
        shopLatitude: coordinates.latitude,
        shopLongitude: coordinates.longitude,
      },
    })
  }
  
  return Response.json({ success: true, coordinates })
}
```

## Enhanced Features (Future)

### 1. Business Hours Display

```tsx
<div className="p-4 border-t">
  <h4 className="text-sm font-semibold mb-2">Business Hours</h4>
  <div className="space-y-1 text-sm">
    <div className="flex justify-between">
      <span className="text-muted-foreground">Monday - Friday</span>
      <span className="font-medium">9:00 AM - 6:00 PM</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Saturday</span>
      <span className="font-medium">10:00 AM - 4:00 PM</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Sunday</span>
      <span className="text-destructive">Closed</span>
    </div>
  </div>
</div>
```

### 2. Distance Calculator

```tsx
// Show distance from user's current location
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <svg className="h-4 w-4" /* navigation icon */ />
  <span>2.3 km away from your location</span>
</div>
```

### 3. Multiple Locations

For sellers with multiple shops:

```tsx
<select className="w-full p-2 border rounded">
  <option>Main Branch - Bole</option>
  <option>Branch 2 - Piazza</option>
  <option>Branch 3 - Merkato</option>
</select>
```

### 4. Photos of Shop

```tsx
<div className="grid grid-cols-3 gap-2">
  <img src="/shop-exterior.jpg" alt="Shop exterior" className="rounded" />
  <img src="/shop-interior.jpg" alt="Shop interior" className="rounded" />
  <img src="/shop-products.jpg" alt="Products" className="rounded" />
</div>
```

## Styling Customization

The component uses Tailwind CSS. Customize colors:

```tsx
// Change primary color accent
<div className="bg-primary/10 text-primary">
  {/* Change to */}
<div className="bg-blue-100 text-blue-600">

// Change border styles
<div className="rounded-lg border">
  {/* Change to */}
<div className="rounded-xl border-2 border-primary/20">
```

## Accessibility

The component includes:

- ✅ ARIA labels for interactive elements
- ✅ Semantic HTML structure
- ✅ Keyboard navigation support
- ✅ Screen reader-friendly descriptions
- ✅ Focus states on buttons

## Mobile Optimization

- Responsive button layout (stacks on mobile)
- Touch-friendly button sizes (min 44x44px)
- Optimized map height for mobile viewports
- Collapsible map to save space

## Testing Checklist

- [ ] Component renders with location only
- [ ] Component renders with full address
- [ ] Component renders with coordinates
- [ ] "Show Map" toggle works
- [ ] "Open in Maps" link opens correctly
- [ ] "Get Directions" link opens navigation
- [ ] Responsive on mobile devices
- [ ] Works without Google Maps API key
- [ ] Gracefully handles missing data

## Performance Considerations

1. **Lazy Load Map**: Map only loads when toggled open
2. **External Links**: No heavy map libraries loaded by default
3. **Conditional Rendering**: Only shows if location data exists
4. **Image Optimization**: Use Next.js Image for shop photos

## Summary

The `ShopLocationMap` component provides:

✅ Easy-to-implement location display
✅ Works without API keys (using Google Maps links)
✅ Optional embedded map with API key
✅ Mobile-friendly responsive design
✅ Clear call-to-actions for buyers
✅ Extensible for future features

Perfect for helping buyers find physical shop locations in your marketplace!
