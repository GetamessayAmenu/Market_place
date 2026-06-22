# Requirements Document

## Introduction

The Product Detail Page (PDP) is the primary conversion surface in the Ethiopian Fashion Marketplace web application (`apps/web`). It serves as the central hub where buyers evaluate listings, compare pricing options across three business models (Buy, Rent, Custom Order), assess seller credibility, and initiate purchase decisions. The PDP integrates with the existing NestJS backend API, real-time chat service, and leverages the established design system tokens and component library.

## Glossary

- **PDP**: Product Detail Page — the listing detail view at `/listings/[id]`
- **Buy_Model**: Direct purchase of a listing at the listed price (`availableForPurchase`)
- **Rent_Model**: Temporary rental of a listing at a daily rate (`availableForRent`, `rentalPricePerDay`)
- **Custom_Model**: Made-to-order request based on the listing design (`customOrderAvailable`, `customOrderBasePrice`)
- **OrderChoiceModal**: Modal that appears when both Buy and Custom are available, letting users choose "Buy As-Is" vs "Order Custom Made"
- **RentDatePicker**: Inline panel for selecting rental date range with price calculator
- **Gallery**: Image gallery component with thumbnails, zoom, and lightbox capabilities
- **StickyMobileCTA**: Fixed bottom action bar visible on mobile viewports
- **ListingActions**: Component orchestrating all purchase/rent/custom action buttons and flows
- **SellerCard**: Seller information card with verification status and contact options
- **ReviewSection**: Reviews display and submission interface
- **SimilarListings**: Related listings grid based on category matching

## Requirements

### Requirement 1: Image Gallery

**User Story:** As a buyer, I want to view high-quality images of a product from multiple angles, so that I can evaluate the item thoroughly before purchasing.

#### Acceptance Criteria

1. THE Gallery SHALL display a main hero image with aspect ratio 4:3 in a rounded container
2. THE Gallery SHALL show thumbnail images below the main image in a horizontally scrollable row
3. THE Gallery SHALL highlight the active thumbnail with a primary-colored border
4. WHEN a user clicks a thumbnail, THE Gallery SHALL update the main hero image to the selected image
5. THE Gallery SHALL display an image counter badge (e.g., "3 of 8") on the main image
6. WHEN a user clicks the main image on desktop, THE Gallery SHALL open a lightbox with full-screen viewing
7. WHEN in lightbox mode, THE Gallery SHALL support keyboard navigation (left/right arrows, escape to close)
8. WHEN in lightbox mode on mobile, THE Gallery SHALL support swipe gestures for image navigation
9. THE Gallery SHALL show zoom-on-hover capability on desktop viewports (≥1024px)
10. WHEN no images are available, THE Gallery SHALL display a placeholder with "No images available" message
11. THE Gallery SHALL lazy-load thumbnail images for performance optimization
12. THE Gallery SHALL display listing type badges (Buy/Rent/Custom) on the main image

### Requirement 2: Product Information Display

**User Story:** As a buyer, I want to see clear and comprehensive product information, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. THE PDP SHALL display the listing title in prominent typography (`text-2xl lg:text-3xl font-bold font-display`)
2. THE PDP SHALL display the primary buy price in large, bold typography with currency symbol
3. WHEN `availableForRent` is true, THE PDP SHALL display rental price per day below the buy price
4. WHEN `customOrderAvailable` is true, THE PDP SHALL display custom order base price with "from" prefix
5. THE PDP SHALL display condition badges (new, like_new, good, fair) with semantic color variants
6. THE PDP SHALL display a "Featured" badge when `isFeatured` is true
7. THE PDP SHALL display category as a clickable link to `/categories/[slug]`
8. THE PDP SHALL display location information with map pin icon
9. THE PDP SHALL display posted date in human-readable format
10. THE PDP SHALL display view count when greater than zero
11. THE PDP SHALL display favorites count when greater than zero
12. THE PDP SHALL truncate long descriptions with "Read more" toggle
13. WHEN `attributes` JSON exists, THE PDP SHALL display attributes in a 2-column key-value grid
14. THE PDP SHALL use `aria-labelledby` for section headings to support screen readers

### Requirement 3: Pricing Display

**User Story:** As a buyer, I want to understand all pricing options at a glance, so that I can choose the most suitable acquisition method.

#### Acceptance Criteria

1. THE PDP SHALL display buy price as the primary price in `text-3xl font-bold text-action-buy`
2. THE PDP SHALL display rent price with calendar icon prefix in `text-sm text-muted-foreground`
3. THE PDP SHALL display custom order price with scissors icon prefix in `text-sm text-muted-foreground`
4. WHEN `customOrderAvailable` is true, THE PDP SHALL display advisory text: "Price is estimated; designer confirms final quote"
5. THE PDP SHALL display availability indicator badges for each enabled business model
6. THE PDP SHALL use action color tokens: `--buy` (green), `--rent` (gold), `--custom` (wine)
7. THE PDP SHALL stack pricing information vertically with consistent spacing

### Requirement 4: Buy Action

**User Story:** As a buyer, I want to purchase a listing directly, so that I can acquire the item immediately.

#### Acceptance Criteria

1. WHEN `availableForPurchase` is true, THE PDP SHALL display a "Buy Now" button with price
2. THE "Buy Now" button SHALL use `bg-action-buy text-white` styling with full width
3. WHEN clicked, THE "Buy Now" button SHALL navigate to `/checkout/buy/[listingId]`
4. WHEN `customOrderAvailable` is also true, THE "Buy Now" button SHALL open OrderChoiceModal instead
5. THE OrderChoiceModal SHALL present "Buy As-Is" and "Order Custom Made" options
6. WHEN the user is not authenticated, THE PDP SHALL redirect to `/login?redirect=/listings/[listingId]`
7. WHEN the listing belongs to the current user, THE "Buy Now" button SHALL display "Your Listing" and be disabled
8. THE PDP SHALL validate authentication status before initiating checkout flow

### Requirement 5: Rent Action

**User Story:** As a buyer, I want to rent a listing for a specific period, so that I can use the item temporarily without full purchase.

#### Acceptance Criteria

1. WHEN `availableForRent` is true and `rentalPricePerDay` exists, THE PDP SHALL display a "Rent" button
2. THE "Rent" button SHALL use `border-2 border-brand-gold text-brand-gold` styling with full width
3. WHEN clicked, THE "Rent" button SHALL expand the RentDatePicker panel inline below the button
4. THE RentDatePicker SHALL provide start date and end date input fields (type="date", min=today)
5. THE RentDatePicker SHALL calculate and display total rental cost: `{days} × ${rate}/day = ${total}`
6. WHEN `rentalDeposit` exists, THE RentDatePicker SHALL display refundable deposit amount
7. THE RentDatePicker SHALL display a "Proceed to Checkout" button with gold styling
8. WHEN dates are invalid or missing, THE "Proceed to Checkout" button SHALL be disabled
9. WHEN checkout is initiated, THE PDP SHALL navigate to `/checkout/rent/[listingId]?start=X&end=Y&days=Z`
10. THE RentDatePicker SHALL include a "Cancel" button to collapse the panel

### Requirement 6: Custom Order Action

**User Story:** As a buyer, I want to request a custom-made version of a design, so that I can get a piece tailored to my specifications.

#### Acceptance Criteria

1. WHEN `customOrderAvailable` is true, THE PDP SHALL display a "Request Custom Design" button
2. THE "Request Custom Design" button SHALL use `border-2 border-brand-wine text-brand-wine` styling
3. THE PDP SHALL display a compact info card with wine-themed background (`bg-brand-wine/5`)
4. THE info card SHALL list customization features: measurements, fabric & color, design notes, reference images
5. THE info card SHALL display estimated lead time when `customOrderLeadTimeDays` is available
6. WHEN clicked, THE "Request Custom Design" button SHALL navigate to `/custom-order/[listingId]`
7. THE custom order form SHALL support the 4-step wizard: Measurements → Fabric & Color → Design & Customization → Review & Submit
8. THE PDP SHALL indicate that pricing is advisory and designer confirms final quote

### Requirement 7: Seller Information

**User Story:** As a buyer, I want to evaluate the seller's credibility and contact them easily, so that I can trust the transaction.

#### Acceptance Criteria

1. THE PDP SHALL display seller avatar, name, and verification status in a card component
2. THE PDP SHALL show "Verified" badge when seller has `emailVerifiedAt` or `phoneVerifiedAt`
3. THE seller name SHALL link to `/sellers/[sellerId]` with hover state
4. THE PDP SHALL display "Member since {year}" based on seller's `createdAt`
5. WHEN `contactOptions.showPhone` is true, THE PDP SHALL display a "Call" button with phone icon
6. WHEN `contactOptions.whatsapp` exists, THE PDP SHALL display a WhatsApp button linking to `wa.me/{number}`
7. WHEN `contactOptions.telegram` exists, THE PDP SHALL display a Telegram button linking to `t.me/{handle}`
8. WHEN `contactOptions.inAppMessaging` is true, THE PDP SHALL display a "Message Seller" button
9. THE PDP SHALL always display a ChatButton for real-time messaging when seller exists
10. THE "Call" button SHALL use `bg-primary text-primary-foreground` styling
11. THE WhatsApp button SHALL use `bg-green-600 text-white` styling
12. THE Telegram button SHALL use `bg-blue-500 text-white` styling
13. External contact links SHALL open in new tabs with `rel="noopener noreferrer"`

### Requirement 8: Save and Share Actions

**User Story:** As a buyer, I want to save listings for later and share them with others, so that I can organize my shopping and get opinions.

#### Acceptance Criteria

1. THE PDP SHALL display a FavoriteButton (heart icon) in the product info header
2. THE FavoriteButton SHALL toggle between saved/unsaved states with visual feedback
3. WHEN not authenticated, THE FavoriteButton SHALL redirect to login with return URL
4. THE PDP SHALL display a ShareButton (share icon) next to the FavoriteButton
5. THE ShareButton SHALL use Web Share API when available (native share sheet)
6. WHEN Web Share API is unavailable, THE ShareButton SHALL show a dropdown with share options
7. THE share dropdown SHALL include: Copy Link, WhatsApp, Telegram, Twitter/X, Facebook
8. THE share URL SHALL be `{siteUrl}/listings/{listingId}`
9. THE FavoriteButton SHALL update the favorites count display when toggled

### Requirement 9: Reviews Section

**User Story:** As a buyer, I want to read reviews from other customers, so that I can assess product quality and seller reliability.

#### Acceptance Criteria

1. THE PDP SHALL display a review summary card with average rating and distribution bars
2. THE PDP SHALL display individual review cards with reviewer avatar, name, date, and rating
3. THE PDP SHALL show "Verified Purchase" badge on reviews from confirmed buyers
4. THE PDP SHALL paginate reviews (5 per page) when more than 5 reviews exist
5. WHEN authenticated and not the seller, THE PDP SHALL show "Write a Review" button
6. THE review form SHALL include rating input (1-5 stars), optional title, and optional body
7. THE PDP SHALL prevent users from reviewing their own listings
8. THE PDP SHALL display "No reviews yet. Be the first to review!" when no reviews exist
9. Review authors SHALL be able to delete their own reviews
10. THE PDP SHALL show loading skeletons while reviews are being fetched

### Requirement 10: Similar Listings

**User Story:** As a buyer, I want to see similar products, so that I can compare options and find the best fit.

#### Acceptance Criteria

1. THE PDP SHALL display a "Similar Listings" section when related listings exist
2. THE PDP SHALL fetch listings from the same category, excluding the current listing
3. THE PDP SHALL display up to 4 similar listings in a responsive grid
4. THE PDP SHALL use ListingCard component with consistent styling
5. THE grid SHALL be 4 columns on desktop, 2 columns on tablet/mobile
6. WHEN no similar listings exist, THE PDP SHALL hide the section entirely
7. THE similar listings SHALL load asynchronously without blocking the main page render

### Requirement 11: Sticky Mobile CTA

**User Story:** As a mobile user, I want quick access to purchase actions while scrolling, so that I can act without scrolling back up.

#### Acceptance Criteria

1. THE PDP SHALL display a fixed bottom CTA bar on mobile viewports (<1024px)
2. THE StickyMobileCTA SHALL be positioned above the BottomNav component
3. THE StickyMobileCTA SHALL display the primary price on the left
4. THE StickyMobileCTA SHALL display the primary action button (Buy/Rent/Custom) on the right
5. THE StickyMobileCTA SHALL use backdrop blur and semi-transparent background
6. THE StickyMobileCTA SHALL be hidden on desktop viewports (≥1024px)
7. THE StickyMobileCTA SHALL not appear for the listing owner's own listings
8. THE StickyMobileCTA SHALL add bottom padding to the page content to prevent overlap

### Requirement 12: Breadcrumb Navigation

**User Story:** As a buyer, I want to navigate back to the category or homepage easily, so that I can continue browsing without using the browser back button.

#### Acceptance Criteria

1. THE PDP SHALL display breadcrumb navigation: Home > [Category Name] > [Listing Title]
2. THE "Home" link SHALL navigate to `/`
3. THE category link SHALL navigate to `/categories/[slug]`
4. THE listing title SHALL be plain text (current page, not clickable)
5. THE breadcrumb SHALL use `/` separators between items
6. THE breadcrumb SHALL be accessible with `aria-label="Breadcrumb"`

### Requirement 13: Error and Loading States

**User Story:** As a user, I want clear feedback when something goes wrong or is loading, so that I understand the page status.

#### Acceptance Criteria

1. WHEN the listing is loading, THE PDP SHALL display skeleton placeholders for gallery and info sections
2. WHEN the listing is not found, THE PDP SHALL display "Listing Not Found" with explanation
3. THE not-found state SHALL include a "Go to homepage" link
4. WHEN the listing status is 'sold' or 'expired', THE PDP SHALL show an overlay banner
5. THE unavailable banner SHALL state "This listing is no longer available"
6. WHEN an API error occurs, THE PDP SHALL display an error state with retry button
7. THE PDP SHALL maintain graceful degradation when optional data fails to load

### Requirement 14: SEO and Structured Data

**User Story:** As a platform operator, I want listings to be discoverable by search engines, so that we attract organic traffic.

#### Acceptance Criteria

1. THE PDP SHALL generate dynamic metadata: title, description, Open Graph tags
2. THE PDP SHALL include JSON-LD structured data with Product schema
3. THE JSON-LD SHALL include: name, description, image, url, offers (price, currency, availability)
4. THE JSON-LD SHALL include seller information when available
5. WHEN reviews exist, THE JSON-LD SHALL include aggregateRating (averageRating, reviewCount)
6. THE PDP SHALL set canonical URL to `{siteUrl}/listings/{listingId}`
7. THE PDP SHALL use semantic HTML with appropriate heading hierarchy (h1, h2)
8. THE PDP SHALL use `aria-labelledby` for section accessibility

### Requirement 15: Responsive Design

**User Story:** As a user, I want the PDP to work well on any device, so that I have a consistent experience.

#### Acceptance Criteria

1. THE PDP SHALL use a 2-column layout on desktop (≥1024px): 55% gallery, 45% info
2. THE PDP SHALL stack gallery and info vertically on tablet/mobile (<1024px)
3. THE PDP SHALL display 4-column similar listings grid on desktop, 2-column on mobile
4. THE PDP SHALL maintain minimum 44x44px touch targets for all interactive elements
5. THE PDP SHALL scale typography appropriately across breakpoints
6. THE PDP SHALL hide StickyMobileCTA on desktop viewports
7. THE PDP SHALL show zoom-on-hover only on desktop viewports
8. THE PDP SHALL support horizontal scrolling for thumbnail overflow on mobile
9. THE PDP SHALL test layouts at viewport widths: 320px, 375px, 768px, 1024px, 1440px

### Requirement 16: Accessibility

**User Story:** As a user with disabilities, I want to navigate and interact with the PDP using assistive technology, so that I have an equal shopping experience.

#### Acceptance Criteria

1. THE PDP SHALL provide descriptive alt text for all product images
2. THE PDP SHALL use semantic HTML elements (`<section>`, `<nav>`, `<article>`)
3. THE PDP SHALL include `aria-labelledby` attributes linking sections to their headings
4. THE PDP SHALL ensure all interactive elements have visible focus indicators
5. THE PDP SHALL support keyboard navigation for gallery (arrows, escape)
6. THE PDP SHALL maintain WCAG 2.1 AA color contrast ratios (4.5:1 minimum)
7. THE PDP SHALL include skip-to-content link targeting `id="main-content"`
8. THE PDP SHALL use appropriate ARIA roles for modal and lightbox components
9. Gallery thumbnails SHALL have `aria-label="View image {n}"`
