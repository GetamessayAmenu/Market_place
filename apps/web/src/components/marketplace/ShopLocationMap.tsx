'use client'

import { Button } from '@marketplace/ui'
import React, { useState } from 'react'

export interface ShopLocationMapProps {
  sellerName: string
  location: string
  shopAddress?: string
  latitude?: number
  longitude?: number
  className?: string
}

export default function ShopLocationMap({
  sellerName,
  location,
  shopAddress,
  latitude,
  longitude,
  className,
}: ShopLocationMapProps) {
  const [showMap, setShowMap] = useState(false)

  // Construct the full address
  const fullAddress = shopAddress || location

  // Generate Google Maps link
  const mapsQuery = encodeURIComponent(fullAddress)
  const googleMapsUrl = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  // Generate embed URL for iframe
  const embedUrl = latitude && longitude
    ? `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${latitude},${longitude}`
    : `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${mapsQuery}`

  return (
    <div className={className}>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Shop Location</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{sellerName}</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              aria-expanded={showMap}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>
        </div>

        {/* Address Details */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{fullAddress}</p>
              {shopAddress && shopAddress !== location && (
                <p className="text-xs text-muted-foreground mt-1">{location}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px]"
            >
              <Button variant="outline" className="w-full gap-2 text-xs">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                Open in Maps
              </Button>
            </a>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px]"
            >
              <Button variant="outline" className="w-full gap-2 text-xs">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                Get Directions
              </Button>
            </a>
          </div>
        </div>

        {/* Embedded Map */}
        {showMap && (
          <div className="border-t">
            <div className="relative w-full h-[300px] bg-muted/20">
              {/* Placeholder - Replace with actual map implementation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3 p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Interactive Map</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click "Open in Maps" to view full details
                    </p>
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="mt-2">
                      View on Google Maps
                    </Button>
                  </a>
                </div>
              </div>

              {/* Alternative: If you have Google Maps API key, uncomment this */}
              {/* <iframe
                title={`Map showing location of ${sellerName}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={embedUrl}
                allowFullScreen
              /> */}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="p-4 bg-muted/30 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Visit the shop in person for the best experience. Call ahead to confirm availability.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
