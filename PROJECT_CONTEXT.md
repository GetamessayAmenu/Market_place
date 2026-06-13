# Project Context

Living record of implementation progress. Updated after each phase.

**Last updated:** Phase 17 (2026-06-13)

---

## Current System Status

| Layer | Status |
|-------|--------|
| Monorepo / shared packages | Ready |
| Database (PostgreSQL + Prisma) | Schema migrated, seeded |
| API (`services/api`) | NestJS + auth + listings + search + notifications + reports + analytics + verification |
| Realtime (`services/realtime`) | Socket.IO chat + notifications + Redis adapter |
| Meilisearch | Integrated (index `listings`) |
| Notifications system | Event-driven, BullMQ queues, real-time delivery |
| Web / Admin apps | Design system + layouts + UI components (Phase 14) |
| Public Marketplace Pages | Full marketplace experience with SSR/ISR (Phase 15) |
| Authentication & User Area | Complete auth flow + user profile + settings (Phase 16) |
| Seller Dashboard & Listing Management | Full seller experience with CRUD, stats, image upload (Phase 17) |

**Next:** Phase 18 — Testing & Deployment Preparation

---

## Phase 9 — Frontend Marketplace Application (apps/web)

### Progress
- 9A Frontend architecture + layouts + routing: COMPLETED (scaffolded Next.js App Router, layouts, core providers, basic pages and components)
- 9B Public pages: COMPLETED (search, listing details, category, seller profile)
- 9C Authentication + protected routes: COMPLETED
- 9D Dashboard pages: COMPLETED (saved listings, messages, notifications, profile settings)
- 9E Chat + notifications: COMPLETED (initial chat thread UI + realtime notifications client)
 - 9F SEO + performance optimization: COMPLETED (sitemap, robots, ISR, metadata, JSON-LD)

---

## Phase 10 — Admin Panel (apps/admin)

### Progress
- 10A Admin scaffold: COMPLETED (Next.js App Router, layout, providers, header, sidebar)
- 10B RBAC server helper: COMPLETED (`requireAdmin()` enforces allowed admin roles)
- 10C Core pages: COMPLETED (dashboard overview, users, listings, reports, verification, chat moderation, notifications, audit, analytics placeholders)
- 10D Typecheck & imports: COMPLETED (basic TypeScript validation)

Notes: Implemented a production-grade admin app shell under `apps/admin/src` that follows existing architecture patterns and RBAC rules. Server-side helper `src/lib/authServer.ts` calls `/auth/me` and checks `roles` against allowed admin roles before rendering pages. Pages use `src/lib/serverApi.ts` for server-side API requests with credentials included.

Next: integrate detailed moderation actions (approve/reject listings, suspend/ban users, report workflow) and UI data grids in follow-up sub-phases; do not run backend services automatically in this phase.

---

## Phase 11 — Security Hardening (services/api, services/realtime)

### Summary
Implemented focused security hardening items that preserve existing architecture and module boundaries. Work performed:

- **Authentication:** Reviewed JWT access and refresh strategies. `JwtAccessStrategy` verifies blacklist + session activity and rejects suspended/banned users. `JwtRefreshStrategy` validates opaque refresh tokens and delegates rotation to `SessionsService` which implements refresh token rotation, session invalidation, and blacklist support.
- **Cookies & Session security:** `AuthService` sets HttpOnly cookies via `cookie.util.ts` and `ApiConfigService` drives `cookieSecure` (enabled for `production`/`staging`) and `sameSite='lax'` — secure-by-default behavior preserved.
- **RBAC & ownership checks:** Verified `RolesGuard`, `PermissionsGuard`, and `ListingOwnerGuard` exist and are applied on controllers (listings, uploads, etc.) to prevent privilege escalation and enforce ownership.
- **Rate limiting:** Redis-backed `RateLimitGuard` is used for auth/search endpoints; realtime chat has `ChatRateLimitService` to prevent message floods. Login/register/refresh endpoints already have `@RateLimit` annotations.
- **Anti-Spam:** Messaging rate limits and moderation queues are in place. Listing upload limits and verification workflows are present; recommend adding ML-based spam scoring in next iteration.
- **Upload security:** `UploadsService` enforces `ALLOWED_LISTING_IMAGE_MIME_TYPES`, `MAX_LISTING_IMAGE_BYTES`, and caps image count to `MAX_LISTING_IMAGES`. Signed Cloudinary uploads configured and `createSignedUpload()` respects `MAX_LISTING_IMAGES`.
- **Audit logging:** Added a persistent `AdminLogsService` and a global `AdminAuditInterceptor` which records admin/support/moderator actions to `admin_logs` for auditability. This logs actor, action, resource, optional resourceId, metadata, IP, and user-agent.
- **Realtime security:** `SocketAuthService` authenticates sockets by verifying JWT, checking blacklist, validating server-side session existence in Redis, and enforcing user status. Chat gateway applies `ChatRateLimitService` for flood protection.

### Files added / changed
- `services/api/src/modules/admin-logs/admin-logs.service.ts` — persistent admin log writer (Prisma)
- `services/api/src/common/interceptors/admin-audit.interceptor.ts` — logs admin actions for routes protected by roles/permissions
- `services/api/src/app.module.ts` — interceptor registered globally

### Validation performed
- Confirmed existing JWT verification, refresh rotation, session invalidation, and cookie handling logic.
- Confirmed RBAC guards and ownership guards are applied in controllers (`PermissionsGuard`, `RolesGuard`, `ListingOwnerGuard`).
- Verified upload validation methods exist in `UploadsService`.
- Verified realtime socket authentication and chat rate limiting exist in `services/realtime`.
- Implemented admin audit logging (see files above) and ran local TypeScript builds for touched services.

### Recommendations / Next steps
- Add server-side ML or heuristics for listing spam detection (deprioritize or auto-queue suspicious listings for review).
- Add explicit moderation APIs that call `AdminLogsService` when admin actions (approve/reject/suspend/ban) occur; currently interceptor logs admin endpoints that require roles/permissions.
- Consider exporting an audit decorator for explicit, high-cardinality events (role changes, verification approvals) to ensure structured metadata.
- Extend ChatRateLimitService keys to include IP and sessionId for more precise throttling and implement exponential backoff warnings.



Notes: initial scaffold created under `apps/web/src` with App Router pages: home, search, listings/[id], categories/[slug], sellers/[id], and dashboard layout. Providers for React Query and basic Socket hook added.

9B details:
- Search: client-side search with `useListings` (React Query) and search input; `/app/search` wired to `/api/v1/search`.
- Listing details: server-rendered page (`/app/listings/[id]`) with `generateMetadata`, server-side fetch to `/api/v1/listings/:id` via `src/lib/serverApi.ts`.
- Category page: server-rendered (`/app/categories/[slug]`) fetching category data with metadata.
- Seller profile: server-rendered (`/app/sellers/[id]`) fetching user profile and metadata.

9C details:
- Client auth helpers: `src/lib/authClient.ts` (login/logout/me) integrated with `src/lib/api.ts`.
- Server auth helper: `src/lib/authServer.ts` exposes `requireUser()` used by server components to protect routes (redirects to `/login`).
- Client hydration: `src/providers/Providers.tsx` now fetches `/auth/me` on mount and populates the `useAuth` Zustand store.
- Login flow: `src/app/login/page.tsx` (react-hook-form) posts to `/auth/login`, sets auth state, and redirects to `/dashboard` on success.
- Dashboard protection: `src/app/dashboard/layout.tsx` calls `requireUser()` server-side, ensuring only authenticated users can access dashboard pages (shows user name in header).

9D details:
- Saved Listings: `src/app/dashboard/saved/page.tsx` (server-side, protected via `requireUser()`, fetches `/favorites`).
- Messages: `src/app/dashboard/messages/page.tsx` (server-side fetch of `/conversations`) with client `MessagesClient` at `src/components/dashboard/MessagesClient.tsx` — connects to Socket.IO via `useSocket` and listens for `chat:new_message` events.
- Notifications: `src/app/dashboard/notifications/page.tsx` with client `NotificationsClient` at `src/components/dashboard/NotificationsClient.tsx` — server fetch of `/notifications` and realtime updates via Socket.IO (`notifications:new`, `notifications:read`).
- Profile Settings: `src/app/dashboard/settings/page.tsx` — client form using `react-hook-form`, reads `useAuth` store, posts updates to `/users/:id`.

9E details:
- Conversation thread page: `src/app/dashboard/messages/[id]/page.tsx` — server fetch for conversation and messages, protected by `requireUser()`.
- Message thread client: `src/components/dashboard/MessageThread.tsx` — joins conversation rooms (`chat:join`), listens for `chat:new_message`, renders messages, and sends messages via `chat:send` with HTTP fallback to `/conversations/:id/messages`.
- Socket tweaks: `src/hooks/useSocket.ts` transports updated for reliability; clients `MessagesClient` and `NotificationsClient` already listen for relevant socket events.

Notes: This phase provides a working conversation thread UI and notification listeners using the existing realtime service contract.

9F details:
- ISR + revalidation: `src/lib/serverApi.ts` now accepts a `revalidate` option and pages use ISR where appropriate (listings: 60s, categories/sellers: 120s).
- Metadata: enhanced `generateMetadata` usage on listing, category, and seller pages; Open Graph `images` and `alternates` where available.
- Schema.org: embedded `application/ld+json` Product schema on listing pages (`src/app/listings/[id]/page.tsx`).
- Sitemap & Robots: `src/app/sitemap.xml/route.ts` and `src/app/robots.txt/route.ts` added for search engine discoverability.
- Typecheck: ran `npm run -w apps/web typecheck` after fixes (dependencies installation and package adjustments). Minor TS fixes applied for strict rules.

Next: integration testing and performance profiling in a local dev environment (run `npm install` then `npm run dev` in `apps/web`).

---

## Phase 14 — Design System & UI Foundation

### Summary
Implemented a comprehensive design system and UI foundation for the marketplace application, including shared UI components, layouts, navigation, and marketplace-specific components. All components use strict TypeScript, forwardRef, ARIA attributes, and are styled with Tailwind CSS using design tokens from a centralized CSS variable system.

### Dependencies
- Added `clsx` and `tailwind-merge` to `packages/ui` for className utilities
- Fixed React peer dependency in `packages/ui/package.json` to accept `^18.2.0 || ^19.0.0`
- `@hookform/resolvers` already present in `apps/web`

### Configuration
- **Tailwind & PostCSS:**
  - `apps/web/tailwind.config.ts` with full design token extensions (colors, spacing, typography, breakpoints, shadows, animations)
  - `apps/web/postcss.config.js` with tailwindcss and autoprefixer
  - `apps/web/next.config.js` with `transpilePackages: ['@marketplace/ui']` for source-first imports
  - `apps/admin/tailwind.config.ts`, `postcss.config.js`, `next.config.js` with same configuration

### Design Tokens & Theme CSS
- **packages/ui/src/styles/globals.css** with full token set:
  - Colors: primary, secondary, accent, destructive, success, warning, info
  - Semantic tokens: background, foreground, card, popover, border, input, ring
  - Typography scale: text-xs through text-4xl with proper line heights
  - Spacing scale, border-radius scale, shadow scale
  - Dark mode support via `[data-theme="dark"]` selector
  - Utility classes and scrollbar styling
- **apps/web/src/styles/globals.css** imports `@marketplace/ui/styles.css` and adds base layer styles

### UI Utilities
- **packages/ui/src/lib/cn.ts** - proper clsx + tailwind-merge implementation for className merging
- **packages/ui/src/lib/cva.ts** - lightweight Class Variance Authority (CVA) for component variants (no external dependency)

### UI Primitive Components (packages/ui/src/components/)
**Core controls:**
- Button.tsx - variants (primary, secondary, outline, ghost, destructive, link), sizes (sm, md, lg, icon), loading state
- Input.tsx - label, error state, helper text, prefix/suffix slots
- Textarea.tsx - auto-resize option, character count
- Select.tsx - native select with styling, label, error
- Checkbox.tsx - label, indeterminate state

**Feedback:**
- Alert.tsx - variants (info, success, warning, error), dismissible
- Toast.tsx + Toaster.tsx - toast provider + hook pattern (lightweight, no external dep)
- Skeleton.tsx - pulse animation, configurable shape
- Spinner.tsx - size variants

**Overlay:**
- Modal.tsx - portal-based, focus trap concept, close on escape
- Drawer.tsx - side panel, left/right variants
- Dropdown.tsx - trigger + menu pattern

**Data display:**
- Card.tsx - header/body/footer slots, hover variant
- Table.tsx - responsive wrapper, sortable header hints
- Pagination.tsx - page numbers, prev/next, ellipsis
- Tabs.tsx - controlled tabs with keyboard nav
- Badge.tsx - variants (default, success, warning, error, info)
- Avatar.tsx - image with fallback initials, size variants

### Form Patterns (packages/ui/src/components/form/)
- FormControl.tsx - generic form field wrapper with label + error
- FormInput.tsx - Input + FormControl combined
- FormTextarea.tsx - Textarea + FormControl
- FormSelect.tsx - Select + FormControl

### App Layouts (apps/web/src/components/layouts/)
- PublicLayout.tsx - for public pages (home, search, listings, categories, sellers)
- AuthLayout.tsx - centered card layout for login/register
- DashboardLayout.tsx - sidebar + main content area, responsive

### Navigation Components (apps/web/src/components/navigation/)
- Header.tsx - logo, nav links, search icon, user menu, mobile hamburger
- MobileNav.tsx - slide-out mobile navigation with overlay
- Footer.tsx - multi-column links, copyright, social links
- Sidebar.tsx - collapsible sidebar for dashboard
- UserMenu.tsx - avatar + dropdown for logged-in/logged-out states

### Marketplace Components (apps/web/src/components/marketplace/)
- ListingCard.tsx - image, title, price, location, condition badge, favorite button
- SellerCard.tsx - avatar, name, rating, verified badge, listing count
- CategoryCard.tsx - icon/image, name, listing count
- SearchBar.tsx - input with icon, suggestions dropdown, debounced
- FilterPanel.tsx - category, price range, condition, city filters
- ImageGallery.tsx - main image + thumbnails, lightbox-ready

### Validation Schemas (apps/web/src/lib/validation.ts)
- loginSchema — email and password validation
- registerSchema — name, email, password, confirmPassword with matching
- forgotPasswordSchema — email validation
- resetPasswordSchema — password + confirmPassword with token
- changePasswordSchema — currentPassword + newPassword + confirmNewPassword
- profileUpdateSchema — name, email, phone, bio, location
- listingCreateSchema — title, description, price, category, condition, location, images
- reportSchema — reason, description, listingId

### Page Integration
- Updated `apps/web/src/app/layout.tsx` to use PublicLayout
- Updated `apps/web/src/app/dashboard/layout.tsx` to use DashboardLayout
- Updated `apps/web/src/app/login/page.tsx` to use AuthLayout with new form components

### Validation
- TypeScript compilation: `npm run -w apps/web typecheck` passes with 0 errors
- UI package typecheck: `npm run -w packages/ui typecheck` passes with 0 errors
- All imports resolve correctly with transpilePackages configuration
- No circular dependencies between packages

### Files Added/Modified
**packages/ui/src/** (~35 new files):
- lib/cn.ts (updated), lib/cva.ts (new)
- components/Button.tsx, Input.tsx, Textarea.tsx, Select.tsx, Checkbox.tsx
- components/Modal.tsx, Drawer.tsx, Dropdown.tsx
- components/Card.tsx, Table.tsx, Pagination.tsx, Tabs.tsx, Badge.tsx, Avatar.tsx
- components/Alert.tsx, Toast.tsx, Skeleton.tsx, Spinner.tsx
- components/form/FormControl.tsx, FormInput.tsx, FormTextarea.tsx, FormSelect.tsx
- index.ts (updated), styles/globals.css (updated)

**apps/web/** (~20 new/updated files):
- tailwind.config.ts, postcss.config.js, next.config.js (new)
- src/components/layouts/PublicLayout.tsx, AuthLayout.tsx, DashboardLayout.tsx (new)
- src/components/navigation/Header.tsx, MobileNav.tsx, Footer.tsx, Sidebar.tsx, UserMenu.tsx (new)
- src/components/marketplace/ListingCard.tsx, SellerCard.tsx, CategoryCard.tsx, SearchBar.tsx, FilterPanel.tsx, ImageGallery.tsx (new)
- src/lib/validation.ts (new)
- src/styles/globals.css (updated - already had import)
- src/app/layout.tsx, src/app/dashboard/layout.tsx, src/app/login/page.tsx (updated)

**apps/admin/** (~3 new files):
- tailwind.config.ts, postcss.config.js, next.config.js (new)

### Architecture Decisions
- **Source-first exports:** `transpilePackages: ['@marketplace/ui']` in Next.js config allows apps to import TS source directly (no build step needed for dev)
- **Tailwind config at app level:** Design tokens reference CSS custom properties from `@marketplace/ui`
- **All components use React.forwardRef** where appropriate for ref forwarding
- **Strict TypeScript** with proper type exports
- **ARIA attributes** on all interactive components
- **Class Variance Authority (CVA)** pattern for component variants (lightweight implementation, no external dependency)
- **Form patterns** combine FormControl with input components for consistent form field styling
- **ExactOptionalPropertyTypes** TypeScript strict mode requires conditional prop spreading for optional properties

---

## Phase 15 — Public Marketplace Experience (apps/web)

### Summary
Implemented the full public-facing marketplace experience across 5 pages: Homepage, Search Results, Category Page, Listing Details, and Seller Profile. All pages use the existing design system (`@marketplace/ui`), marketplace components (ListingCard, CategoryCard, SearchBar, FilterPanel, ImageGallery), and backend API contracts — with zero backend modifications.

### Pages Implemented

**Homepage (`src/app/page.tsx`):**
- Hero search section with `HeroSearch` client component navigating to `/search?q=...`
- Featured listings grid (fetched from `GET /listings?featured=true&limit=8`)
- Categories grid (top-level categories from `GET /categories`)
- Recent listings grid (fetched from `GET /listings?sortBy=newest&limit=12`)
- Server-rendered with `Promise.allSettled` for graceful error handling
- `generateMetadata` with Open Graph tags

**Search Results (`src/app/search/page.tsx` + `SearchClient.tsx`):**
- Client component with URL-driven state (query, page, sort, filters)
- `SearchBar` pre-filled from URL, `FilterPanel` with category/price/condition/city filters
- Sort dropdown (relevance, newest, oldest, price_asc, price_desc)
- Pagination via `Pagination` component
- Loading state with skeleton grid, error state with retry, empty state
- Suspense wrapper in page for `useSearchParams` compatibility

**Category Page (`src/app/categories/[slug]/page.tsx`):**
- Server component fetching category + listings (`GET /listings?categorySlug=:slug`)
- Subcategory pill navigation for child categories
- Breadcrumb navigation
- Listings grid with server-side pagination
- ISR revalidate 120s
- `generateMetadata` with category name, description, Open Graph

**Listing Details (`src/app/listings/[id]/page.tsx`):**
- Server component fetching listing + related listings
- `ImageGallery` component for listing images
- Listing info: title, price, condition badge, location, posted date, favorites count
- Seller info card with Avatar, name, verified badge, link to profile
- Contact actions: Call, WhatsApp, Telegram, in-app messaging (based on `contactOptions`)
- `FavoriteButton` client component with optimistic UI update
- Related listings grid (same category, excludes current listing)
- Schema.org JSON-LD with Product + Offer + Seller
- ISR revalidate 60s, `generateMetadata` with Open Graph images, canonical URL

**Seller Profile (`src/app/sellers/[id]/page.tsx`):**
- Server component fetching seller profile + seller listings
- Seller header: Avatar, name, bio, location, member since date
- Verification badges: Email Verified, Phone Verified
- Statistics grid: listing count, verified status, member since, response rate placeholder
- Seller listings grid with server-side pagination
- ISR revalidate 120s, `generateMetadata` with profile type Open Graph

### New Hooks Added
- `useCategories.ts` — fetch category tree with 5-minute stale time
- `useFavorites.ts` — fetch user favorites + `useToggleFavorite` mutation (POST/DELETE with optimistic updates)
- `useSeller.ts` — `useSeller` (profile) + `useSellerListings` (paginated listings)
- Updated `useListings.ts` — full filter params, typed `PaginatedResponse<Listing>` return
- Updated `useSearch.ts` — full search params with `undefined` support for `exactOptionalPropertyTypes`

### API Helper Updates
- `api.ts` — added `apiDelete` and `apiPatch` helpers, typed generics default to `unknown`
- `serverApi.ts` — added `params` option for query string building, typed generics default to `unknown`
- `authServer.ts` — typed `requireUser()` with `AuthUser` interface, removed `any`

### New Components Added
- `HeroSearch.tsx` — client component with search input, navigates to `/search`
- `SearchClient.tsx` — full search experience client component
- `FavoriteButton.tsx` — client component for toggle favorite with optimistic UI
- `ListingCardSkeleton.tsx` — skeleton loader matching ListingCard layout
- `CategoryCardSkeleton.tsx` — skeleton loader matching CategoryCard layout

### Pre-existing Files Fixed (Type Compatibility)
- `src/app/dashboard/messages/page.tsx` — typed `serverGet` response
- `src/app/dashboard/messages/[id]/page.tsx` — typed `serverGet` responses
- `src/app/dashboard/notifications/page.tsx` — typed `serverGet` response
- `src/app/dashboard/saved/page.tsx` — typed `serverGet` response, removed `any`
- `src/app/sitemap.xml/route.ts` — typed `serverGet` response, removed `any`
- `src/providers/Providers.tsx` — typed `apiGet` response, fixed import ordering
- `src/app/layout.tsx` — enhanced root metadata with `metadataBase`, Open Graph, robots

### SEO Implementation
- SSR on server components (Homepage, Category, Listing Details, Seller Profile)
- ISR: listings 60s, categories/sellers 120s
- `generateMetadata` on all pages with title, description, Open Graph tags
- Schema.org JSON-LD on listing pages (Product, Offer, Seller)
- Canonical URLs on listing pages
- Root layout `metadataBase` with site URL

### Validation
- TypeScript compilation: `npm run -w apps/web typecheck` passes with 0 errors
- All imports resolve correctly
- `exactOptionalPropertyTypes` strict mode respected (conditional prop spreading)
- No backend service modifications

### Architecture Decisions
- **Server components by default:** All pages are server components; client components only where interactivity is needed (SearchClient, FavoriteButton, HeroSearch)
- **`Promise.allSettled`** for parallel data fetching with graceful fallback on partial failures
- **URL-driven search state:** Search page syncs all filter/sort/pagination state to URL searchParams for shareability and back-button support
- **Suspense boundary** on search page for `useSearchParams` compatibility (Next.js requirement)
- **Conditional prop spreading** for `exactOptionalPropertyTypes` compliance: `...(value !== undefined && { prop: value })`
- **No external state management** for public pages — React Query handles all client-side data fetching

### Files Added/Modified

**New files (~10):**
- `src/hooks/useCategories.ts`, `useFavorites.ts`, `useSeller.ts`
- `src/components/marketplace/HeroSearch.tsx`, `SearchClient.tsx`, `FavoriteButton.tsx`
- `src/components/marketplace/ListingCardSkeleton.tsx`, `CategoryCardSkeleton.tsx`

**Updated files (~15):**
- `src/hooks/useListings.ts`, `useSearch.ts`
- `src/lib/api.ts`, `serverApi.ts`, `authServer.ts`
- `src/app/page.tsx`, `layout.tsx`
- `src/app/search/page.tsx`
- `src/app/categories/[slug]/page.tsx`
- `src/app/listings/[id]/page.tsx`
- `src/app/sellers/[id]/page.tsx`
- `src/providers/Providers.tsx`
- `src/app/dashboard/messages/page.tsx`, `[id]/page.tsx`
- `src/app/dashboard/notifications/page.tsx`
- `src/app/dashboard/saved/page.tsx`
- `src/app/sitemap.xml/route.ts`

---

## Phase 16 — Authentication & User Area (apps/web)

### Summary
Implemented the complete authentication experience and user account area: login, register, forgot/reset password, email verification, user profile (view + edit), account settings, security settings, notification preferences, route protection, and navigation updates. All forms use React Hook Form + Zod validation. Zero backend modifications.

### Auth Foundation Fixes
- **`useAuth.ts`** — Updated Zustand store from `{ id, name, email }` to full `AuthUser` type matching backend (`displayName`, `avatarUrl`, `emailVerified`, `phoneVerified`, `role`). Added `isLoading` state for auth resolution.
- **`authClient.ts`** — Added `register()`, `forgotPassword()`, `resetPassword()`, `changePassword()`, `updateProfile()`. Fixed response contracts: `res.user` not `res.data`.
- **`authServer.ts`** — Updated `AuthUser` interface, added `optionalUser()` that returns `null` instead of redirecting.
- **`Providers.tsx`** — Fixed `/auth/me` response reading: `res.user` instead of `res.data`. Calls `clear()` on auth error.
- **`validation.ts`** — Fixed `registerSchema` to use `displayName` (matching backend DTO), added `changePasswordSchema`, `notificationPreferencesSchema`.

### Auth Pages Implemented

**Login (`/login`):**
- Email + password form with error/success alerts
- Loading state on submit, links to register and forgot-password
- Redirect parameter support for post-login navigation

**Register (`/register`):**
- Display name, email, optional phone, password, confirm password
- Password strength validation (8+ chars, uppercase, number)
- Redirects to `/verify-email` on successful registration

**Forgot Password (`/forgot-password`):**
- Email form with anti-enumeration safe success message
- Link back to login

**Reset Password (`/reset-password`):**
- Reads `token` from URL searchParams
- New password + confirm with same strength rules as register
- Redirects to `/login?reset=success` on completion
- Suspense boundary for `useSearchParams` compatibility

**Verify Email (`/verify-email`):**
- Auto-calls `POST /auth/verify/email` with token from URL
- Loading, success, and error states

**Verification Status (`/verification-status`):**
- Server component showing email and phone verification badges
- Account information display (name, role, ID)

### User Profile Pages

**Profile View (`/dashboard/profile`):**
- Server component with Avatar, verification badges, account details
- Link to edit profile

**Profile Edit (`/dashboard/profile/edit`):**
- Client form with `profileUpdateSchema` (displayName, phone)
- Calls `PATCH /users/me`, updates Zustand store on success
- Pre-populated from current user data

### Settings Pages

**Settings Index (`/dashboard/settings`):**
- Server component with card links to sub-pages
- Account overview summary (name, email, role, verification)

**Account Settings (`/dashboard/settings/account`):**
- Display name and phone form, calls `PATCH /users/me`
- Email shown as read-only

**Security Settings (`/dashboard/settings/security`):**
- Change password form with current/new/confirm fields
- Calls `POST /auth/change-password`
- Account information display

**Notification Preferences (`/dashboard/settings/notifications`):**
- Toggle checkboxes for 5 notification types
- Email, push, chat, listing alerts, marketing emails
- Client component with local state + save (TODO: API when available)

### Route Protection
- **`middleware.ts`** — Next.js middleware checks `access_token` cookie on `/dashboard/*`, redirects to `/login` with redirect param. Also redirects authenticated users away from `/login` and `/register`.
- **`ProtectedRoute.tsx`** — Client-side auth guard component for wrapping interactive content. Shows spinner during auth resolution.
- **Dashboard layout** — Server-side `requireUser()` guard remains as primary protection.

### Navigation Updates
- **Sidebar** — Added Profile, Account Settings, Security, Notification Preferences links
- **UserMenu** — Fixed `user.name` → `user.displayName`, added avatar with `avatarUrl`, added Profile/Account/Security/Notifications menu items, proper logout with API call + store cleanup
- **AuthLayout** — Added gradient background, back-to-home link, footer with Terms/Privacy/Help links

### Files Added (~12)
- `src/app/register/page.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/verify-email/page.tsx`
- `src/app/verification-status/page.tsx`
- `src/app/dashboard/profile/page.tsx`
- `src/app/dashboard/profile/edit/page.tsx`
- `src/app/dashboard/settings/account/page.tsx`
- `src/app/dashboard/settings/security/page.tsx`
- `src/app/dashboard/settings/notifications/page.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/middleware.ts`

### Files Modified (~10)
- `src/hooks/useAuth.ts` — Full AuthUser type, isLoading state
- `src/lib/authClient.ts` — All auth functions added
- `src/lib/authServer.ts` — optionalUser(), AuthUser interface
- `src/lib/validation.ts` — Fixed schemas, added new schemas
- `src/providers/Providers.tsx` — Fixed response handling
- `src/app/login/page.tsx` — Full auth flow with errors/loading
- `src/app/dashboard/settings/page.tsx` — Rewritten as settings hub
- `src/components/navigation/Sidebar.tsx` — Added profile/settings links
- `src/components/navigation/UserMenu.tsx` — Fixed user.name, proper logout
- `src/components/layouts/AuthLayout.tsx` — Enhanced design, footer, back link
- `src/app/dashboard/saved/page.tsx` — Fixed `user.name` → `user.displayName`

### Architecture Decisions
- **Server components by default** for profile/settings pages; client only for forms
- **`PATCH /users/me`** for all profile updates (backend contract)
- **Response mapping**: `{ user, tokens }` for auth, `{ user }` for `/auth/me`
- **Zustand store** holds full `AuthUser` object from backend types
- **React Hook Form + Zod** for all forms
- **`Alert` component** from `@marketplace/ui` for error/success feedback
- **No new dependencies** added
- **Suspense boundaries** on pages using `useSearchParams`
- **Conditional prop spreading** for `exactOptionalPropertyTypes` compliance

### Validation
- TypeScript compilation: `npm run -w apps/web typecheck` passes with 0 errors
- All imports resolve correctly
- `exactOptionalPropertyTypes` strict mode respected
- No backend service modifications

---

## Phase 17 — Seller Dashboard & Listing Management (apps/web)

### Summary
Implemented the complete seller experience and listing management system: Seller Dashboard with stats and performance metrics, My Listings with filters/pagination/status actions, Create/Edit Listing with multi-step form and Cloudinary image upload integration, and Listing Detail management page with full CRUD operations. All pages use React Hook Form + Zod validation, TanStack Query for data fetching, and the existing design system — with zero backend modifications.

### Pages Implemented

**Seller Dashboard (`/dashboard/seller`):**
- Client component with `useMyListings` hook fetching all seller listings
- Stat cards: Active Listings, Sold Listings, Pending Review, Total Favorites
- Performance overview: active rate, sold rate, avg. favorites per listing
- Quick actions: Create Listing, Manage Listings, View Messages, Settings
- Recent listings grid (top 5) with status badges and image thumbnails
- Loading skeletons, error state with retry, empty state with CTA

**My Listings (`/dashboard/seller/listings`):**
- Client component with full filter bar: search, status filter, sort options
- Status filters: All, Active, Pending Review, Sold, Hidden, Rejected, Expired
- Sort options: Newest, Oldest, Price High/Low
- Pagination via `Pagination` component
- Per-listing actions: Edit, Mark Sold, Hide, Unhide, Renew, Delete
- Delete confirmation modal with loading state
- Success/error alerts for all actions
- Loading spinner, error retry, empty state

**Create Listing (`/dashboard/seller/create`):**
- Uses `ListingForm` multi-step component
- Calls `POST /listings` via `useCreateListing` mutation
- Redirects to `/dashboard/seller/listings` on success
- Error handling with dismissible alert

**Edit Listing (`/dashboard/seller/listings/[id]/edit`):**
- Pre-populates `ListingForm` with existing listing data
- Calls `PATCH /listings/:id` via `useUpdateListing` mutation
- Redirects to listing detail page on success
- Loading skeleton while fetching

**Listing Detail (`/dashboard/seller/listings/[id]`):**
- Full listing view with image gallery, details, description, contact options
- Performance metrics: favorites count, condition, featured status
- Action buttons: Mark Sold, Hide, Publish, Renew, Delete (context-dependent on status)
- Delete confirmation modal
- Success/error alerts with auto-dismiss
- Loading skeleton, error retry

### Components Added

**ListingForm (`src/components/seller/ListingForm.tsx`):**
- Multi-step form with 4 steps: Details, Photos, Contact, Review
- Step indicator with clickable back-navigation
- Step validation before proceeding
- Image upload section with Cloudinary signed upload integration
- Image preview grid with reorder (move up/down), remove, primary indicator
- Category picker using `useCategories` hook with flattened tree
- Contact options: phone toggle, in-app messaging toggle, WhatsApp, Telegram
- Review step with full summary before submission
- Responsive design, loading states on upload

### Hooks Added (`src/hooks/useSeller.ts`)
- `useMyListings(userId, params)` — paginated seller listings with filters
- `useMyListing(id)` — single listing detail
- `useCreateListing()` — mutation, invalidates `my-listings`
- `useUpdateListing()` — mutation, invalidates `my-listings` + `my-listing`
- `useDeleteListing()` — mutation with optional hard delete
- `useMarkSold()` — mutation, invalidates queries
- `useRenewListing()` — mutation, invalidates queries
- `useHideListing()` — mutation, invalidates queries
- `usePublishListing()` — mutation, invalidates queries
- `useImageUpload()` — Cloudinary signed upload with loading/error state

### API Client Added (`src/lib/sellerApi.ts`)
- `fetchMyListings(params)` — GET `/listings` with `sellerId` filter
- `fetchMyListing(id)` — GET `/listings/:id`
- `createListing(data)` — POST `/listings`
- `updateListing(id, data)` — PATCH `/listings/:id`
- `deleteListing(id, hard)` — DELETE `/listings/:id`
- `markListingSold(id)` — POST `/listings/:id/sold`
- `renewListing(id)` — POST `/listings/:id/renew`
- `hideListing(id)` — POST `/listings/:id/hide`
- `publishListing(id)` — POST `/listings/:id/publish`
- `getSignedUpload(count)` — POST `/uploads/sign`
- `computeSellerStats(listings)` — client-side stats computation
- Full TypeScript interfaces: `SellerListing`, `ListingImage`, `ContactOptions`, etc.

### Validation Schemas Updated (`src/lib/validation.ts`)
- Enhanced `listingCreateSchema` with `contactOptions` (showPhone, whatsapp, telegram, inAppMessaging) and `images` array (url, cloudinaryPublicId, sortOrder, isPrimary)
- Added `listingUpdateSchema` with all optional fields for PATCH operations
- Added `ListingUpdateInput` type export

### Sidebar Updated
- Added Seller Dashboard, My Listings, Create Listing links to default sidebar items

### Files Added (~8)
- `src/lib/sellerApi.ts`
- `src/hooks/useSeller.ts`
- `src/components/seller/ListingForm.tsx`
- `src/app/dashboard/seller/page.tsx`
- `src/app/dashboard/seller/listings/page.tsx`
- `src/app/dashboard/seller/create/page.tsx`
- `src/app/dashboard/seller/listings/[id]/page.tsx`
- `src/app/dashboard/seller/listings/[id]/edit/page.tsx`

### Files Modified (~3)
- `src/lib/validation.ts` — Enhanced listing schemas with contact options and images
- `src/components/navigation/Sidebar.tsx` — Added seller navigation links
- `PROJECT_CONTEXT.md` — Updated with Phase 17

### Architecture Decisions
- **Client components** for all seller pages (forms require interactivity)
- **TanStack Query mutations** for all CRUD operations with automatic cache invalidation
- **Multi-step form** pattern with local state and step-level validation
- **Cloudinary signed upload** — client-side upload using server-signed parameters
- **Client-side stats computation** from listings array (no separate analytics endpoint needed for seller)
- **Conditional prop spreading** for `exactOptionalPropertyTypes` compliance
- **No backend modifications** — uses existing API contracts
- **`useAuth` Zustand store** for current user context in hooks and components

### Validation
- TypeScript compilation: `npm run -w apps/web typecheck` passes with 0 errors
- All imports resolve correctly
- `exactOptionalPropertyTypes` strict mode respected
- No backend service modifications

---

## Phase 12 — Backend Completion (services/api)

### Summary
Implemented all remaining backend gaps to bring the API to ~98% MVP readiness. Total new endpoints added: **16** across both services. Both `services/api` and `services/realtime` typecheck with zero errors.

### New modules / controllers added
1. **Reports module** — full CRUD: create (with duplicate detection), find mine, admin list/stats/detail/review/resolve. Uses ReportsRepository + AdminLogsService.
2. **Admin Users controller** — list (paginated, searchable), stats (by status), detail, admin update (suspend/ban/activate/role change).
3. **Admin Audit Log read** — `GET /admin/audit-logs` with pagination and filtering by actor, resource, action.
4. **Analytics module** — dashboard stats (10 parallel counts), listings-by-status, users-by-status, top-categories.
5. **Verification module** — public email/phone token verify endpoints + admin identity/business review.
6. **Admin Listings controller** — browse all listings (any status), detail, bulk actions (approve/reject/archive up to 50).
7. **Profile controller** — `PATCH /users/me` self-service profile update, `DELETE /users/me` account self-deletion (soft delete).
8. **Password reset flow** — `POST /auth/forgot-password` (generates Redis token), `POST /auth/reset-password` (consumes token, updates password).
9. **Notification unread count** — `GET /notifications/unread-count` returns badge number.
10. **Password change** — `POST /auth/change-password` (verifies current password, sets new one).

### All new API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reports` | JWT | Create report (duplicate check) |
| GET | `/reports/mine` | JWT | My filed reports |
| GET | `/reports` | Admin | All reports (paginated) |
| GET | `/reports/stats` | Admin | Report status counts |
| GET | `/reports/:id` | Admin | Report detail |
| PATCH | `/reports/:id/review` | Admin | Set under review |
| PATCH | `/reports/:id/resolve` | Admin | Resolve/dismiss |
| GET | `/admin/users` | Admin | List users (search/filter) |
| GET | `/admin/users/stats` | Admin | User status counts |
| GET | `/admin/users/:id` | Admin | User detail with counts |
| PATCH | `/admin/users/:id` | Admin | Suspend/ban/activate/role |
| GET | `/admin/audit-logs` | Admin | Paginated audit logs |
| GET | `/admin/analytics/dashboard` | Admin | Aggregated stats |
| GET | `/admin/analytics/listings-by-status` | Admin | Listing breakdown |
| GET | `/admin/analytics/users-by-status` | Admin | User breakdown |
| GET | `/admin/analytics/top-categories` | Admin | Top categories |
| POST | `/auth/verify/email` | Public | Verify email token |
| POST | `/auth/verify/phone` | Public | Verify phone token |
| GET | `/admin/verifications` | Admin | List verifications |
| PATCH | `/admin/verifications/:id` | Admin | Approve/reject |
| GET | `/admin/listings` | Admin | Browse all listings |
| GET | `/admin/listings/:id` | Admin | Listing detail |
| POST | `/admin/listings/bulk-action` | Admin | Bulk approve/reject/archive |
| PATCH | `/users/me` | JWT | Update own profile |
| DELETE | `/users/me` | JWT | Soft-delete own account |
| POST | `/auth/change-password` | JWT | Change password |
| POST | `/auth/forgot-password` | Public | Request reset token (rate limited) |
| POST | `/auth/reset-password` | Public | Reset password with token (rate limited) |
| GET | `/notifications/unread-count` | JWT | Unread badge count |

### Prisma schema coverage: 14/14 models (100%)
All database models have corresponding REST API endpoints.

### Security measures
- Password reset tokens: SHA256-hashed, Redis-stored, 1-hour TTL, auto-consume
- Rate limiting on forgot-password (5/min) and reset-password (10/min)
- Anti-enumeration: forgot-password always returns success
- Account self-deletion uses soft delete + suspends status
- Bulk listing actions capped at 50 items, all logged to audit trail

### Typecheck status
- `services/api`: 0 errors
- `services/realtime`: 0 errors

---

## Phase 1 — Monorepo Foundation

### Implemented
- Turborepo monorepo with npm workspaces (`apps/*`, `services/*`, `packages/*`)
- Strict TypeScript (`@marketplace/typescript-config`), ESLint flat config, Prettier
- Shared packages: `config`, `types`, `utils`, `ui`
- App/service placeholders: `apps/web`, `apps/admin`, `services/api`, `services/realtime`
- Env strategy (Zod schemas, `.env.example` per app/service)
- Infra skeleton: Docker Compose base, nginx config, `bootstrap-dev.sh`

### Modules added
- `@marketplace/config`, `@marketplace/types`, `@marketplace/utils`, `@marketplace/ui`
- `@marketplace/typescript-config`, `@marketplace/eslint-config` (tooling)

### Database changes
- None (Prisma folder placeholder only)

### API endpoints
- None

### Architecture decisions
- **Modular monolith** target; `api` and `realtime` as separate deployable workspaces
- **Acyclic package deps:** `types`/`utils` are leaves; apps never import `services/*`
- **Env validation** centralized in `@marketplace/config` (Zod at bootstrap)
- **Import paths:** `@marketplace/{package}` workspace protocol

---

## Phase 2 — Database + Prisma Foundation

### Implemented
- `prisma/schema.prisma` — full domain schema
- Initial migration `20250522120000_init`
- `prisma/seed.ts` — roles + permissions
- Root scripts: `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:seed`, `db:validate`, `db:studio`
- PostgreSQL in Docker Compose (host port **5433**)
- `infra/scripts/db-migrate.sh` for CLI when host port unavailable

### Modules added
- None (Prisma at repo root; client via `@prisma/client` on root package)

### Database changes
- **14 tables:** `users`, `roles`, `permissions`, `role_permissions`, `categories`, `listings`, `listing_images`, `favorites`, `conversations`, `messages`, `reports`, `notifications`, `admin_logs`, `verification_requests`
- **UUID PKs** (`@db.Uuid`), `created_at` / `updated_at` on mutable entities
- **Soft delete** (`deleted_at`): User, Category, Listing, ListingImage, Conversation, Message, VerificationRequest
- **Seed data:** 6 roles (`buyer`, `seller`, `moderator`, `admin`, `super_admin`, `support`), 20 permissions
- `guest` role not persisted (unauthenticated only)

### API endpoints
- None

### Architecture decisions
- **Single Prisma schema** at `/prisma` shared by `services/api` (modular monolith)
- **Snake_case** DB columns/tables via `@map` / `@@map`
- **RBAC model:** Role ↔ Permission (M:N), User → Role
- **Conversation uniqueness:** `(listing_id, buyer_id, seller_id)`
- **Postgres host port 5433** to avoid conflict with local `:5432`

---

## Phase 3 — NestJS Backend Core

### Implemented
- NestJS bootstrap (`src/main.ts`): URI versioning `/api/v1`, helmet, compression, CORS, dotenv
- Global `ValidationPipe`, `AllExceptionsFilter`, `PrismaExceptionFilter`, `TransformResponseInterceptor`
- **Infrastructure module:** config (`ApiConfigService` + Zod), Prisma, Redis (ioredis), Pino logging, BullMQ (4 queues), EventEmitter
- **RBAC:** `@Public()`, `@Roles()`, `@Permissions()`, `JwtAuthGuard` (global), `RolesGuard`, `PermissionsGuard`, `@CurrentUser()`
- **Abstractions:** `BaseRepository`, `DomainEvent` base, `PaginationQueryDto`, `toPaginatedResponse()`
- **Health module:** `GET /api/v1/health` (public) — DB + Redis checks

### Modules added (services/api)
- `infrastructure/` — config, database, redis, logging, queue, events
- `common/` — decorators, guards, filters, interceptors, dto, interfaces
- `modules/health/`

### Database changes
- None

### API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1` | Public | Service metadata |
| GET | `/api/v1/health` | Public | Liveness (Postgres + Redis) |

### Architecture decisions
- **Controller → Service → Repository → DB** enforced; health logic in `HealthService` only
- **Standard API envelope:** `{ success, data }` / `{ success: false, error, timestamp, path? }` via `@marketplace/types`
- **JWT guard** requires `request.user` (populated in Phase 4); public routes via `@Public()`
- **BullMQ queue names** reserved: `notifications`, `search-index`, `email`, `moderation`
- **`@marketplace/config`** built as CommonJS for Nest runtime compatibility
- Root **`rxjs` override** to avoid duplicate Observable types in monorepo

---

## Phase 4 — Authentication System

### Implemented
- **Auth module:** register, login, refresh (rotation), logout, me
- **Password security:** Argon2id hashing
- **JWT access tokens** (Bearer + HttpOnly `access_token` cookie) with `jti` blacklist
- **Opaque refresh tokens** in HttpOnly `refresh_token` cookie + Redis session store
- **Session tracking:** device info (IP, user-agent), rotation detection (`suspicious` flag on reuse)
- **RBAC:** role + permission loading per request via `JwtAccessStrategy`; `@Roles()` / `@Permissions()` guards
- **Verification structure:** email/phone tokens (Redis + `verification_requests` table)
- **Rate limiting hooks:** `@RateLimit()` + `RateLimitGuard` on auth routes
- **Cookie strategy:** secure + SameSite=lax in staging/production; `cookie-parser` middleware

### Modules added (services/api)
- `modules/auth/` — controller, service, repository, strategies, DTOs, utils, verification
- `modules/users/` — repository, service
- `modules/roles/` — repository, service
- `modules/permissions/` — repository, service
- `modules/sessions/` — Redis repository + service

### Database changes
- None (uses existing `users`, `roles`, `permissions`, `verification_requests`)

### API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register (default role: buyer) |
| POST | `/api/v1/auth/login` | Public | Login |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh token, new access token |
| POST | `/api/v1/auth/logout` | JWT | Invalidate session + blacklist access token |
| GET | `/api/v1/auth/me` | JWT | Current user profile |

### Security architecture
- **Refresh token rotation** with old token invalidation on each refresh
- **Redis keys:** `mp:session:*`, `mp:refresh:*`, `mp:blacklist:access:*`, `mp:user:sessions:*`, `mp:verification:*`
- **Auth errors:** centralized exceptions (`INVALID_CREDENTIALS`, `SESSION_INVALID`, `ACCOUNT_SUSPENDED`, etc.)
- **Register default status:** `pending_verification` + email verification token (dev returns token in response)

---

## Phase 5 — Marketplace Listings System

### Implemented
- **Listings module:** CRUD, soft/hard delete, seller ownership guard, status transitions (publish, sold, renew, hide), pagination + filters, SEO slugs, view counter, spam/moderation event hooks
- **Categories module:** hierarchical tree, slug lookup, admin CRUD (`category:manage`)
- **Favorites module:** add/remove favorite, paginated user favorites, favorite counts on listings
- **Uploads module:** Cloudinary signed upload, file validation, image delete, transformation URLs
- **Redis cache hooks:** popular/homepage/category invalidation keys (structure only)
- **Analytics hooks:** `ListingAnalyticsListener` + domain events (views, favorites, contact clicks)
- **Optional JWT** on public listing reads (`@OptionalAuth()`) for personalized favorite state

### Schema changes (minimal)
- `listings.is_featured` (boolean, default false)
- `listings.contact_options` (JSONB — phone, WhatsApp, Telegram, in-app messaging)
- Migration: `20250525120000_listing_contact_featured`

### Listing statuses (Prisma ↔ API aliases)
| Prisma enum | Business alias |
|-------------|----------------|
| `active` | ACTIVE |
| `sold` | SOLD |
| `archived` | HIDDEN |
| `pending_review` | PENDING |
| `rejected` | REJECTED |
| `expired` | EXPIRED |
| `draft` | (seller draft) |

### Modules added (services/api)
- `modules/listings/` — controller, service, repository, DTOs, guards, policies, serializer, events, cache, analytics listener
- `modules/categories/`
- `modules/favorites/`
- `modules/uploads/`

### API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/listings` | `listing:create` | Create listing (`pending_review`) |
| GET | `/api/v1/listings` | Public (+ optional JWT) | Paginated active listings + filters |
| GET | `/api/v1/listings/:id` | Public (+ optional JWT) | Single listing (+ view count) |
| PATCH | `/api/v1/listings/:id` | Owner / moderator | Update listing |
| DELETE | `/api/v1/listings/:id` | Owner / moderator | Soft delete (`?hard=true` for hard delete) |
| POST | `/api/v1/listings/:id/favorite` | JWT | Save favorite |
| DELETE | `/api/v1/listings/:id/favorite` | JWT | Remove favorite |
| POST | `/api/v1/listings/:id/sold` | Owner | Mark sold |
| POST | `/api/v1/listings/:id/renew` | Owner | Renew (active + new expiry) |
| POST | `/api/v1/listings/:id/hide` | Owner | Archive (hidden) |
| POST | `/api/v1/listings/:id/publish` | Owner / moderator | Set active |
| GET | `/api/v1/users/:id/listings` | Public (+ optional JWT) | Seller listings |
| GET | `/api/v1/favorites` | JWT | User's favorited listings |
| GET | `/api/v1/categories` | Public | Category tree |
| GET | `/api/v1/categories/:slug` | Public | Category + children |
| POST/PATCH/DELETE | `/api/v1/categories/...` | `category:manage` | Admin category CRUD |
| POST | `/api/v1/uploads/sign` | `listing:create` | Cloudinary signed upload params |
| POST | `/api/v1/uploads/validate` | `listing:create` | Validate mime/size before upload |

### Filters (GET `/listings`)
- `categoryId`, `categorySlug`, `city`, `condition`, `status`, `featured`, `sellerVerified`, `minPrice`, `maxPrice`, `search`, `sortBy` (`newest` \| `oldest` \| `price_asc` \| `price_desc`), `page`, `limit`

### Architecture decisions
- **Status mapping** uses existing Prisma `ListingStatus` enum; `archived` = hidden visibility
- **Favorites count** computed via Prisma `_count.favorites` (no denormalized column yet)
- **Seller verification filter** uses `emailVerifiedAt` / `phoneVerifiedAt` on seller
- **Default listing TTL:** 30 days (`LISTING_DEFAULT_TTL_DAYS`); renew resets `expiresAt`
- **Images** stored in `listing_images` with `cloudinary_public_id`; uploads must use folder `marketplace/listings`
- **Contact options** JSON: `{ showPhone?, whatsapp?, telegram?, inAppMessaging? }`
- **Event names** under `listing.*` for future BullMQ/analytics workers
- **Global `JwtAuthGuard`** now uses Passport `jwt-access` strategy

---

## Phase 6 — Search System (Meilisearch)

### Implemented
- **Search module:** `MeilisearchService` (client + index settings), `SearchService` (query abstraction), `ListingSearchIndexerService` (DB → index mapper)
- **Queue-based indexing:** BullMQ `search-index` queue + `ListingSearchIndexProcessor`
- **Event-driven sync:** `ListingSearchIndexListener` on `listing.created`, `listing.updated`, `listing.deleted`, `listing.sold`, `listing.renewed`
- **Public search API:** full-text + typo tolerance (Meilisearch defaults), filters, sort, offset pagination
- **Suggestions API:** lightweight title/category/city suggestions
- **Security:** DTO validation, query sanitization (200 char cap), rate limits (`120/min` search, `180/min` suggestions), active-only filter by default

### Index: `listings` (Meilisearch)
| Setting | Fields |
|---------|--------|
| **Searchable** | `title`, `description`, `city`, `location`, `categoryName`, `subcategoryName`, `categorySlug`, `subcategorySlug` |
| **Filterable** | `categoryId`, `categorySlug`, `subcategoryId`, `subcategorySlug`, `city`, `condition`, `price`, `verified`, `featured`, `status` |
| **Sortable** | `createdAt`, `price`, `featured` |

**Indexed document fields:** `id`, `title`, `slug`, `description`, `categoryId`, `categorySlug`, `categoryName`, `subcategoryId`, `subcategorySlug`, `subcategoryName`, `city`, `location`, `condition`, `price`, `verified`, `featured`, `status`, `createdAt`, `primaryImageUrl`

**Indexability rule:** only `active`, non-deleted, non-expired listings are upserted; others are removed from the index.

### Modules added (services/api)
- `modules/search/` — controller, services, indexer, listener, processor, DTOs, mapper, utils

### API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/search` | Public | Search listings (Meilisearch) |
| GET | `/api/v1/search/suggestions` | Public | Typeahead suggestions |

### Search query params (`GET /search`)
- `q` — full-text query (max 200 chars)
- `categoryId`, `categorySlug`, `city`, `condition`, `verified`, `featured`, `minPrice`, `maxPrice`
- `sortBy` — `relevance` (default) \| `newest` \| `oldest` \| `price_asc` \| `price_desc`
- `page`, `limit` — pagination (reuse `PaginationQueryDto` limits)

### Architecture decisions
- **No Postgres fallback** for search reads — Meilisearch required (`SEARCH_UNAVAILABLE` if env missing)
- **Indexing is async** via BullMQ for horizontal scaling (workers can run separately later)
- **Featured prioritization:** `sortBy=newest` uses `featured:desc, createdAt:desc`
- **Category filter:** matches parent `categorySlug` or `subcategorySlug`
- **Env:** `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY` (optional in Zod; required at runtime for search routes)
- **Subcategory mapping:** child category → `subcategory*` fields; parent → `category*` fields

---

## Phase 7 — Realtime Chat System

### Implemented
- **Standalone `services/realtime`** NestJS app (port **3002**) — decoupled from `services/api`, shares DB + JWT/Redis session keys
- **Socket.IO + Redis adapter** (`RedisIoAdapter`) for multi-instance pub/sub
- **JWT socket auth** — handshake `auth.token` / Bearer / query; validates Redis session + access-token blacklist (same keys as API)
- **Chat module:** create conversation (buyer → listing seller), list conversations, message history, mark read
- **Chat gateway:** `chat:join`, `chat:send`, `chat:typing`, `chat:read` with DTO validation
- **Presence:** Redis-backed online/offline, per-user socket sets, typing TTL, unread counters
- **Rate limits:** Redis hooks on send/typing (60/min send, 120/min typing per user)
- **Moderation hooks:** `ChatModerationListener` + domain events (`chat.message_sent`, `chat.spam_suspected`, `chat.report_ready`)

### Schema changes
- None (uses `conversations`, `messages`, `users`, `listings`)

### Modules (`services/realtime/src`)
- `chat/` — controller, service, repository, DTOs, moderation listener
- `gateway/` — `ChatGateway`, `ChatRateLimitService`
- `websocket/` — `SocketAuthService`, `SocketAuthMiddleware`, `HttpAuthGuard`, `RedisIoAdapter`
- `presence/` — `PresenceService`
- `infrastructure/` — config (Zod `parseRealtimeEnv`), Prisma, Redis
- `health/` — `GET /api/v1/health`

### HTTP endpoints (`/api/v1`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Postgres + Redis liveness |
| POST | `/conversations` | JWT | Create/get conversation for listing |
| GET | `/conversations` | JWT | Paginated conversation list + unread |
| GET | `/conversations/:id/messages` | JWT | Paginated message history |
| POST | `/conversations/:id/read` | JWT | Mark messages read |

### Socket events
| Direction | Event | Purpose |
|-----------|-------|---------|
| Client | `chat:join` | Join `conversation:{id}` room |
| Client | `chat:send` | Send message (persisted) |
| Client | `chat:typing` | Typing indicator |
| Client | `chat:read` | Read receipts |
| Server | `chat:new_message` | Broadcast new message |
| Server | `chat:user_typing` | Typing broadcast |
| Server | `chat:message_read` | Read receipt broadcast |
| Server | `chat:user_online` / `chat:user_offline` | Global presence |
| Server | `chat:joined` | Join acknowledgment |

### Architecture decisions
- **Conversation uniqueness:** `(listing_id, buyer_id, seller_id)` per Prisma schema
- **Buyer-initiated only:** sellers cannot open a chat on their own listing
- **Suspended/banned users** blocked on HTTP and socket send
- **Rooms:** `conversation:{uuid}` for thread broadcasts; `user:{uuid}` for direct user delivery
- **Read status:** `messages.read_at` (null = unread)
- **Env:** `packages/config` → `parseRealtimeEnv()` (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `CORS_ORIGINS`)
- **Notifications:** `CHAT_DOMAIN_EVENTS.MESSAGE_SENT` ready for BullMQ/notifications worker

---

## Phase 8 — Notifications + Event System

### Implemented
- **Notifications module** (complete realization of Phase 3 placeholder):
  - `NotificationsService` — factory methods for 6 notification types
  - `NotificationsRepository` — pagination, read status, unread counts, soft operations
  - `NotificationsController` — `GET /notifications`, `PATCH /:id/read`, `PATCH /read-all`
  - `NotificationEventListener` — event-driven triggers for all notification types
  - `NotificationQueueProcessor` — BullMQ `notifications` queue processor

- **Domain events system:**
  - 6 notification event types: `MessageReceivedEvent`, `ListingApprovedEvent`, `ListingRejectedEvent`, `ListingFavoritedEvent`, `SellerVerifiedEvent`, `SystemAnnouncementEvent`
  - Event emission from services (auth, listings, favorites, chat)
  - `EventEmitter2` integration for in-process pub/sub

- **Realtime notifications (services/realtime):**
  - `NotificationsGateway` — Socket.IO gateway for real-time delivery
  - `userRoom(userId)` room-based delivery per connected socket
  - Server socket events: `notifications:new`, `notifications:read`, `notifications:read_all`, `notifications:unread_count`
  - Chat gateway integration — emits `notifications:new` on message send
  - Full Socket.IO auth via JWT (same session keys as chat)

- **Architecture:**
  - Event-driven notification creation (no queue delays for persistence)
  - BullMQ queue reserved for future integrations (email, SMS, push notifications)
  - Redis persistence via standard Notification table (no separate cache)
  - Unread tracking via `readAt` null state
  - Pagination via standard `PaginationQueryDto` (20 items/page default)

### Schema (unchanged)
- `notifications` table with `userId`, `type`, `title`, `body`, `data` (JSON), `readAt`, `createdAt`
- Indexes on `(userId, readAt)`, `(userId, createdAt DESC)`, `type`
- Soft operations only; no hard delete needed

### Notification types
| Type | Trigger | Recipient | Use case |
|------|---------|-----------|----------|
| `listing_approved` | Listing status → `active` | Seller | Moderation approval |
| `listing_rejected` | Listing status → `rejected` | Seller | Moderation rejection |
| `new_message` | Message created in chat | Recipient | Chat activity |
| `new_offer` | User favorites a listing | Seller | Engagement signal |
| `verification_update` | Verification approved | User | Status confirmation |
| `system` | Admin broadcast | All/segment | Announcements |

### Modules added
- **services/api:**
  - `modules/notifications/` — service, repository, controller, DTOs, listener, processor
  - `modules/events/` — domain event classes, event constants
  - Updated `notifications.module.ts` to import `ListingsModule` (needed for lookups)

- **services/realtime:**
  - `notifications/` — gateway, module
  - Updated `events.constants.ts` with `NOTIFICATIONS_SERVER_EVENTS` + `userRoom()` helper
  - Updated `app.module.ts` to import `NotificationsModule`

### API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/notifications` | JWT | Paginated notifications (filter by `type`, `unreadOnly`) |
| PATCH | `/api/v1/notifications/:id/read` | JWT | Mark single notification read |
| PATCH | `/api/v1/notifications/read-all` | JWT | Mark all as read, return count |

### Socket events
| Direction | Event | Payload | Trigger |
|-----------|-------|---------|---------|
| Server → | `notifications:new` | `{ type, title, body, data, timestamp }` | New notification created |
| Server → | `notifications:unread_count` | `{ unreadCount }` | Broadcast unread count |
| Server → | `notifications:read` | `{ notificationId }` | Single read receipt |

### Event listeners (services/api)
- **`NotificationEventListener`:**
  - `LISTING_UPDATED` → check if status is `active` (approve) or `rejected` → create notification
  - `LISTING_FAVORITED` → fetch listing details, notify seller if active
  - Chat message event → create `new_message` notification (via `setupChatEventListeners()`)

### BullMQ integration
- **Queue:** `notifications` (inherited from Phase 3)
- **Processor:** `NotificationQueueProcessor` (logging-only; real-time persistence via direct DB ops)
- **Future:** Email/SMS/push workers, analytics, retry logic

### Architecture decisions
- **No queue-based persistence** — notifications created immediately in service layer (Prisma)
- **Queue reserved** for future async handlers (email, SMS, push, analytics)
- **Event emission** happens AFTER DB persistence (strong consistency)
- **Socket.IO rooms:** `user:{userId}` for direct notification delivery (leverages existing auth + Redis adapter)
- **Unread count** computed via simple query; no denormalization
- **ListingEventListener** fetches listing on `LISTING_FAVORITED` / `LISTING_UPDATED` (efficient: ~2ms per notification)
- **No LISTING_CREATED notifications** (rare case; notifications sent on approval instead)
- **System announcements** via `NotificationsService.createSystemAnnouncement()` (broadcasts to `all`/`sellers`/`buyers`/`admins`)

### Database access patterns
- **Listing lookup:** By ID via `ListingsRepository.findByIdRaw()` (used 2x per favorite + update flow)
- **Notification creation:** `NotificationsRepository.create()` with `user: { connect: { id: ... } }`
- **Pagination:** Standard `findByUserId()` with skip/take + `countUnread()`
- **Read receipts:** Single-query `markAsRead()` and `markAllAsRead()` bulk updates

### Security/validation
- **DTO validation** on controller inputs (query params: `type`, `unreadOnly`, `page`, `limit`)
- **Ownership check** implicit — notifications scoped to `CurrentUser().id` via `@Roles()`
- **Rate limits:** None (read-only operations; writes via service methods only)
- **Suspended/banned users:** Can still read notifications (non-destructive); blocked on message send (via chat gateway)

### Realtime considerations
- **No fallback to polling** — notifications rely on active Socket.IO connection
- **Offline users** miss real-time delivery (notifications persisted in DB; next login fetches via HTTP GET)
- **Multi-device:** Each socket in `user:{userId}` room receives copy (eventual consistency)
- **Redis durability:** BullMQ queue is durable; Socket.IO delivery is ephemeral

### Monitoring hooks
- `NotificationEventListener` logs errors per event type (ERROR level)
- `NotificationQueueProcessor` logs job processing per type (DEBUG level)
- `NotificationsGateway` logs socket connections + delivery failures (WARN level on send failure)

### Future extensions (Phase 9+)
- **Email/SMS/push workers** — consume BullMQ queue, integrate SendGrid/Twilio/FCM
- **Notification preferences** — user opt-in/opt-out per type via settings table
- **Notification templates** — i18n + template rendering before persistence
- **Scheduling** — delay notification delivery (e.g., digest mode, quiet hours)
- **Analytics** — track notification read rates, delivery latency, user engagement

