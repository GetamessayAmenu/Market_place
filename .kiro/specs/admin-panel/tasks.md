# Implementation Plan: Admin Panel

## Overview

This implementation plan breaks down the Admin Panel feature into discrete, executable tasks organized by feature module. The Admin Panel is a Next.js 14 application with TypeScript, TailwindCSS, Zustand state management, TanStack Query for data fetching, and integration with the existing NestJS backend API.

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript 5.7+ (strict mode)
- TailwindCSS 3.4+
- Zustand (auth state)
- TanStack Query v4 (server state)
- React Hook Form + Zod (form validation)
- Axios (HTTP client)

**Architecture:**
- Feature-based organization under `src/features/`
- Server-side authentication with `requireAdmin()` helper
- Role-based route protection
- Reusable component library
- URL-based state for filters and pagination

## Tasks

### 1. Project Setup and Core Infrastructure

- [ ] 1.1 Initialize project structure and configuration
  - Create `apps/admin` directory structure following Next.js 14 App Router conventions
  - Set up `tsconfig.json` with strict mode enabled
  - Configure TailwindCSS with custom theme colors and utilities
  - Set up `.env.example` with `NEXT_PUBLIC_API_URL` variable
  - Create base directory structure: `src/app`, `src/components`, `src/features`, `src/hooks`, `src/lib`, `src/schemas`, `src/types`, `src/providers`
  - _Requirements: 19.1, 19.2, 25.7_

- [ ] 1.2 Set up TypeScript type definitions
  - Create `src/types/api.ts` with PaginatedRequest, PaginatedResponse, and ApiError interfaces
  - Create `src/types/models.ts` with User, Listing, Report, VerificationRequest, AuditLog, and Announcement interfaces
  - Define role and status enum types
  - Export all types from `src/types/index.ts`
  - _Requirements: 19.2, 19.3, 19.4_

- [ ] 1.3 Create API client utilities
  - Implement `src/lib/adminApi.ts` with apiGet, apiPost, apiPatch, apiDelete functions using Axios
  - Configure Axios with `withCredentials: true` and base URL from environment variable
  - Add response interceptor for 401 (redirect to login) and 403 (permission error) handling
  - Implement `src/lib/adminApiServer.ts` with serverGet and serverPost for server-side API calls
  - Use `cookies()` from `next/headers` to forward auth cookies
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [ ] 1.4 Create authentication helpers
  - Implement `src/lib/authAdmin.ts` with requireAdmin() and getAdminUser() functions
  - requireAdmin() should call `/auth/me`, validate roles, and redirect to login on failure
  - Implement role checking logic with default admin roles array
  - Handle 403 errors for insufficient permissions
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_


- [ ] 1.5 Set up global providers and state
  - Create `src/providers/QueryProvider.tsx` wrapping TanStack Query QueryClientProvider
  - Configure QueryClient with default stale time of 30 seconds
  - Create `src/providers/ToastProvider.tsx` with toast notification context
  - Implement ToastProvider with showToast function and Toast component with auto-dismiss
  - Create `src/hooks/useAuth.ts` Zustand store with user, setUser, logout, hasPermission, hasRole
  - _Requirements: 21.1, 21.2, 21.6, 20.1, 20.2_

- [ ] 1.6 Create Zod validation schemas
  - Create `src/schemas/announcement.schema.ts` with title (max 100), body (max 500), and audience validation
  - Create `src/schemas/user.schema.ts` with suspend and ban reason validation
  - Create `src/schemas/report.schema.ts` with status and resolution notes validation
  - Export all schemas with inferred TypeScript types
  - _Requirements: 19.3, 6.3, 6.6, 11.5, 16.4_


### 2. Shared Components Library

- [ ] 2.1 Create primitive UI components
  - Create `src/components/ui/Button.tsx` with variant props (primary, danger, warning, ghost)
  - Create `src/components/ui/Input.tsx` with error state styling
  - Create `src/components/ui/Badge.tsx` with size and color variants
  - Create `src/components/ui/Modal.tsx` with isOpen, onClose props and overlay
  - Create `src/components/ui/Spinner.tsx` for loading indicators
  - Use TailwindCSS utility classes for all styling
  - _Requirements: 25.7, 18.1_

- [ ] 2.2 Create StatusBadge component
  - Implement `src/components/shared/StatusBadge.tsx` accepting status and optional label
  - Define color mapping: active (green), pending (yellow), rejected (red), banned (dark red), resolved (blue), dismissed (gray)
  - Support size variants (sm, md, lg)
  - _Requirements: 25.2, 4.6_

- [ ] 2.3 Create ConfirmModal component
  - Implement `src/components/shared/ConfirmModal.tsx` with title, message, confirmText, confirmVariant props
  - Add optional reason textarea when requireReason is true
  - Display loading spinner on confirm button during async operations
  - Handle form submission with React Hook Form
  - _Requirements: 25.3, 6.3, 6.6, 8.5, 9.2_

- [ ] 2.4 Create PageHeader component
  - Implement `src/components/shared/PageHeader.tsx` with title, breadcrumbs, actions, description props
  - Render breadcrumb navigation with Next.js Link components
  - Position action buttons on the right side
  - _Requirements: 25.4_

- [ ] 2.5 Create StatCard component
  - Implement `src/components/shared/StatCard.tsx` with title, value, icon, trend props
  - Display trend indicator with up/down arrow and percentage
  - Show skeleton loader when loading prop is true
  - _Requirements: 25.5, 3.6_

- [ ] 2.6 Create DataTable component
  - Implement `src/components/shared/DataTable.tsx` with columns, data, pagination, sorting, rowActions props
  - Render table headers with sortable column indicators
  - Display skeleton rows during loading state
  - Implement pagination controls with page numbers and next/prev buttons
  - Support row click navigation
  - Handle empty state with customizable message
  - _Requirements: 25.1, 4.2, 4.3, 4.7_


- [ ] 2.7 Create FilterBar component
  - Implement `src/components/shared/FilterBar.tsx` with search, filters, sortOptions props
  - Add debounced search input (300ms delay)
  - Render filter dropdowns with dynamic options
  - Render sort dropdown with current selection
  - _Requirements: 25.6, 5.2_

- [ ] 2.8 Create utility functions
  - Create `src/lib/utils.ts` with className helper (clsx or cn)
  - Add date formatting utilities (formatDate, formatRelativeTime)
  - Add pagination helpers (calculateTotalPages, getPaginationRange)
  - Add URL query parameter helpers
  - _Requirements: 4.4, 5.5_


### 3. Layout and Navigation

- [ ] 3.1 Create Sidebar component
  - Implement `src/components/layout/Sidebar.tsx` with role-based navigation items
  - Define navigation structure with labels, hrefs, icons, and required roles
  - Hide menu items based on current user's role
  - Highlight active route
  - Implement collapse into hamburger menu on mobile (<768px)
  - _Requirements: 2.5, 2.6, 2.7, 18.2_

- [ ] 3.2 Create Header component
  - Implement `src/components/layout/Header.tsx` with user menu dropdown
  - Display current user name and role
  - Add logout button calling useAuth().logout()
  - Make responsive for mobile devices
  - _Requirements: 1.4_

- [ ] 3.3 Create AdminLayout wrapper
  - Implement `src/components/layout/AdminLayout.tsx` combining Sidebar and Header
  - Use flex layout with sidebar and main content area
  - Add scroll container for main content
  - Apply responsive breakpoints for mobile layout
  - _Requirements: 18.1, 18.2, 18.3_

- [ ] 3.4 Create root layout and providers
  - Update `src/app/layout.tsx` to wrap children with QueryProvider and ToastProvider
  - Import global styles with TailwindCSS directives
  - Set up metadata and viewport configuration
  - _Requirements: 21.2_

- [ ] 3.5 Create protected dashboard layout
  - Create `src/app/(dashboard)/layout.tsx` using AdminLayout component
  - This layout wraps all protected admin routes
  - _Requirements: 2.1_


### 4. Authentication Module

- [ ] 4.1 Create login page
  - Create `src/app/(auth)/login/page.tsx` with email and password form
  - Use React Hook Form for form state management
  - Implement form submission calling Backend_API `/auth/login`
  - Store user in Zustand auth store on success
  - Redirect to dashboard after successful login
  - Display error messages from API
  - _Requirements: 1.1, 1.4_

- [ ] 4.2 Implement auth initialization
  - Create client component that fetches current user on mount
  - Call `/auth/me` using adminApi when app loads
  - Update Zustand auth store with user data
  - Handle token refresh logic
  - _Requirements: 1.3, 1.4, 1.6_

- [ ] 4.3 Create error pages
  - Create `src/app/error.tsx` for React Error Boundary
  - Create `src/app/not-found.tsx` for 404 pages
  - Create custom 403 Forbidden page for unauthorized access
  - _Requirements: 20.7, 2.3_


### 5. Dashboard Module

- [ ] 5.1 Create dashboard statistics hooks
  - Create `src/hooks/useDashboardStats.ts` fetching total users, sellers, listings, pending reports
  - Use TanStack Query with 60-second polling interval
  - Return loading and error states
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

- [ ] 5.2 Create recent activity hook
  - Create `src/hooks/useRecentActivity.ts` fetching last 20 admin logs
  - Use TanStack Query with automatic refetching
  - _Requirements: 3.5_

- [ ] 5.3 Implement dashboard page
  - Create `src/app/(dashboard)/page.tsx` as dashboard overview
  - Call requireAdmin() to protect route
  - Display grid of StatCard components for key metrics
  - Display RecentActivity timeline component
  - Add auto-refresh every 60 seconds
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 5.4 Create dashboard feature components
  - Create `src/features/dashboard/DashboardStats.tsx` rendering StatCard grid
  - Create `src/features/dashboard/RecentActivity.tsx` rendering activity timeline
  - Create `src/features/dashboard/QuickActions.tsx` with shortcut buttons
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


### 6. User Management Module

- [ ] 6.1 Create user management hooks
  - Create `src/hooks/useUsers.ts` with useUsers query hook accepting pagination and filters
  - Add useUser hook for single user detail
  - Add useSuspendUser mutation hook with cache invalidation
  - Add useBanUser mutation hook with cache invalidation
  - Configure keepPreviousData for smooth pagination
  - _Requirements: 4.1, 4.2, 6.4, 6.7, 21.2, 21.6_

- [ ] 6.2 Create custom URL state hook
  - Create `src/hooks/useQueryState.ts` managing URL query parameters
  - Support reading and updating query params
  - Sync state with Next.js router
  - _Requirements: 4.4, 5.5, 5.6, 21.4_

- [ ] 6.3 Implement user list page
  - Create `src/app/(dashboard)/users/page.tsx` protected by requireAdmin(['admin', 'super_admin'])
  - Implement pagination using URL query parameters
  - Display users in DataTable with columns: ID, name, email, role, status, created date
  - Add sorting support for name, email, created date, role
  - Highlight suspended/banned users with StatusBadge
  - Navigate to user detail on row click
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 6.4 Create user filter components
  - Create `src/features/users/UserFilters.tsx` with search input, role filter, status filter
  - Implement debounced search (300ms)
  - Update URL query parameters on filter changes
  - Reset to page 1 when filters change
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 6.5 Display empty state for user list
  - Show "No results found" message when filters return empty
  - Provide button to clear all filters
  - _Requirements: 5.7_

- [ ] 6.6 Implement user detail page
  - Create `src/app/(dashboard)/users/[id]/page.tsx` with requireAdmin
  - Fetch and display full user profile
  - Show user metadata, role, status, verification status
  - Display action buttons conditionally based on permissions
  - _Requirements: 4.5, 6.1, 6.2_


- [ ] 6.7 Implement user moderation actions
  - Create `src/features/users/UserActions.tsx` with Suspend and Ban buttons
  - Check useAuth().hasPermission('user:suspend') and 'user:ban' to conditionally render buttons
  - Implement suspend handler showing ConfirmModal with reason input
  - Implement ban handler showing ConfirmModal with reason input
  - Call useSuspendUser and useBanUser mutations
  - Display success toast on completion
  - Display error toast on failure
  - Log actions to admin logs
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 20.1, 20.2, 20.3_


### 7. Listing Moderation Module

- [ ] 7.1 Create listing hooks
  - Create `src/hooks/useListings.ts` with useListings query hook supporting pagination and status filter
  - Add useListing hook for single listing detail
  - Add useApproveListing mutation hook
  - Add useRejectListing mutation hook
  - Add useFeatureListing mutation hook
  - Add useDeleteListing mutation hook with hard delete flag
  - _Requirements: 7.1, 8.3, 8.6, 9.3, 9.5_

- [ ] 7.2 Implement listing moderation list page
  - Create `src/app/(dashboard)/listings/page.tsx` protected by requireAdmin(['admin', 'super_admin', 'moderator'])
  - Implement status filter tabs: All, Pending, Active, Rejected, Expired
  - Display listings in grid or table with title, seller, category, price, status, created date, thumbnails
  - Support pagination (20 per page)
  - Navigate to listing detail on click
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 7.3 Implement listing detail page
  - Create `src/app/(dashboard)/listings/[id]/page.tsx` with requireAdmin
  - Display full listing information including images, description, seller info
  - Show listing status and moderation history
  - Render moderation action buttons based on permissions and listing status
  - _Requirements: 7.6, 8.1, 8.2, 9.1, 9.4_

- [ ] 7.4 Create listing moderation actions
  - Create `src/features/listings/ModerationActions.tsx` component
  - Implement Approve button (check 'listing:approve' permission) calling POST `/listings/:id/publish`
  - Implement Reject button (check 'listing:reject' permission) showing modal with reason input
  - Implement Remove as Spam button (check 'listing:delete' permission) with confirmation modal
  - Implement Feature toggle (check 'listing:feature' permission) updating is_featured flag
  - Display featured badge on featured listings
  - Show success toasts and invalidate query cache after actions
  - Log all actions to admin logs
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_


### 8. Report Management Module

- [ ] 8.1 Create report hooks
  - Create `src/hooks/useReports.ts` with useReports query hook supporting pagination, type filter, status filter
  - Add useReport hook for single report detail
  - Add useUpdateReport mutation hook for status and resolution updates
  - _Requirements: 10.1, 11.5_

- [ ] 8.2 Implement report list page
  - Create `src/app/(dashboard)/reports/page.tsx` protected by requireAdmin(['admin', 'super_admin', 'moderator'])
  - Display reports in DataTable with type, reporter, reported entity, reason, status, created date
  - Implement type filter dropdown: All, Scam, Abuse, Spam, Other
  - Implement status filter dropdown: All, Pending, Under Review, Resolved, Dismissed
  - Sort by created date descending by default
  - Emphasize unresolved reports with visual styling
  - Navigate to report detail on row click
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 8.3 Implement report detail page
  - Create `src/app/(dashboard)/reports/[id]/page.tsx` with requireAdmin
  - Display full report information including reporter details, reason, evidence
  - Show reported entity preview (user profile or listing card)
  - Display report status history
  - _Requirements: 11.1, 11.2_

- [ ] 8.4 Create report resolution interface
  - Create `src/features/reports/ResolutionForm.tsx` component
  - Check 'report:resolve' permission to show status dropdown
  - Implement status update dropdown with options: Under Review, Resolved, Dismissed
  - Add resolution notes textarea
  - Submit PATCH request to `/reports/:id` with status and notes
  - Display success toast and refresh report data
  - Log resolution action to admin logs
  - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.7_


### 9. Seller Verification Module

- [ ] 9.1 Create verification hooks
  - Create `src/hooks/useVerifications.ts` with useVerifications query hook supporting pagination and status filter
  - Add useVerification hook for single verification request detail
  - Add useApproveVerification mutation hook
  - Add useRejectVerification mutation hook
  - _Requirements: 12.1, 12.7, 13.1, 13.4_

- [ ] 9.2 Implement verification list page
  - Create `src/app/(dashboard)/verifications/page.tsx` protected by requireAdmin(['admin', 'super_admin'])
  - Display verification requests in table with requester name, document type, submission date, status
  - Implement status filter: All, Pending, Approved, Rejected
  - Support pagination
  - Navigate to detail page on row click
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 9.3 Implement verification detail page
  - Create `src/app/(dashboard)/verifications/[id]/page.tsx` with requireAdmin
  - Display requester information and verification details
  - Show uploaded documents with preview modal for images and PDFs
  - Render Approve and Reject buttons based on 'seller:verify' permission
  - _Requirements: 12.4, 12.5, 12.6_

- [ ] 9.4 Create verification action handlers
  - Create `src/features/verifications/VerificationActions.tsx` component
  - Implement Approve button calling POST `/verification-requests/:id/approve`
  - Implement Reject button showing modal with rejection reason input
  - Update user's emailVerifiedAt or phoneVerifiedAt timestamp on approval
  - Display success toast after action
  - Log actions to admin logs with user ID and reason
  - Refresh verification list after completion
  - _Requirements: 12.7, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_


### 10. Chat Moderation Module

- [ ] 10.1 Create chat moderation hooks
  - Create `src/hooks/useConversations.ts` with useReportedConversations query hook
  - Add useConversation hook for full message history
  - Add useDeleteMessage mutation hook
  - Add useWarnUser mutation hook
  - _Requirements: 14.1, 15.4, 15.5_

- [ ] 10.2 Implement chat moderation list page
  - Create `src/app/(dashboard)/chat/page.tsx` protected by requireAdmin(['admin', 'super_admin', 'moderator'])
  - Fetch reported conversations from `/conversations?reported=true`
  - Display table with conversation ID, participants, report count, last message date, status
  - Implement status filter: All, Under Review, Resolved, Dismissed
  - Support pagination (20 per page)
  - Navigate to conversation detail on row click
  - _Requirements: 14.1, 14.2, 14.3, 14.7_

- [ ] 10.3 Implement conversation detail page
  - Create `src/app/(dashboard)/chat/[id]/page.tsx` with requireAdmin
  - Display full message history with sender information and timestamps
  - Highlight reported messages with yellow background
  - Show report reason for each flagged message
  - _Requirements: 14.4, 14.5, 14.6_

- [ ] 10.4 Create chat moderation actions
  - Create `src/features/chat/ModerationActions.tsx` component
  - Check 'chat:moderate' permission to show action buttons
  - Implement Delete Message button with confirmation modal and reason input
  - Implement Warn User button sending POST `/users/:id/warn` with warning text
  - Call DELETE `/messages/:id` with reason on message deletion
  - Log actions to admin logs with message ID and action type
  - Refresh conversation view after actions
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_


### 11. Notification Module

- [ ] 11.1 Create announcement hook
  - Create `src/hooks/useAnnouncements.ts` with useSendAnnouncement mutation hook
  - Return loading state and error handling
  - _Requirements: 16.5_

- [ ] 11.2 Implement notification page
  - Create `src/app/(dashboard)/notifications/page.tsx` protected by requireAdmin(['admin', 'super_admin'])
  - Check 'notification:send' permission before rendering form
  - Display "Create Announcement" form with title, body, and audience inputs
  - Use React Hook Form with Zod validation (title max 100, body max 500)
  - Provide audience dropdown: All Users, Buyers Only, Sellers Only, Admins Only
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 11.3 Create announcement form component
  - Create `src/features/notifications/AnnouncementForm.tsx` component
  - Implement form submission calling POST `/notifications/announce`
  - Display success toast showing recipient count
  - Clear form after successful submission
  - Display validation errors inline
  - Log announcement to admin logs with title and recipient count
  - _Requirements: 16.4, 16.5, 16.6, 16.7_


### 12. Audit Log Module

- [ ] 12.1 Create audit log hooks
  - Create `src/hooks/useAuditLogs.ts` with useAuditLogs query hook
  - Support pagination (50 logs per page), action type filter, date range filter
  - Add useAuditLog hook for single log detail
  - _Requirements: 17.1, 17.4, 17.5_

- [ ] 12.2 Implement audit log viewer page
  - Create `src/app/(dashboard)/audit-logs/page.tsx` protected by requireAdmin(['super_admin'])
  - Restrict access to super_admin role only
  - Display logs in DataTable with admin name, action type, target entity, timestamp, IP address
  - Sort by timestamp descending by default
  - _Requirements: 17.1, 17.2, 17.6_

- [ ] 12.3 Create audit log filters
  - Create `src/features/audit-logs/AuditLogFilters.tsx` component
  - Implement action type filter dropdown (all types, user actions, listing actions, report actions, etc.)
  - Implement date range filter with start date and end date pickers
  - Update URL query parameters on filter changes
  - _Requirements: 17.3, 17.4_

- [ ] 12.4 Implement audit log detail view
  - Create modal or detail page showing full log entry
  - Display complete request payload and metadata
  - Show all fields including admin info, action details, target entity, timestamp
  - _Requirements: 17.7_


### 13. Responsive Design and Polish

- [ ] 13.1 Implement responsive layouts
  - Test all pages on viewport widths: 320px, 768px, 1024px, 1920px
  - Ensure sidebar collapses properly on mobile
  - Verify data tables scroll horizontally on small screens
  - Stack form inputs vertically on mobile (<640px)
  - Use responsive typography (text-sm on mobile, text-base on desktop)
  - Ensure touch targets are minimum 44x44px on mobile
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

- [ ] 13.2 Add loading states
  - Ensure all data fetching operations show loading spinners
  - Display skeleton loaders for tables and cards during loading
  - Disable action buttons during pending API requests
  - _Requirements: 20.4, 20.5_

- [ ] 13.3 Enhance error handling
  - Verify all API errors display parsed error messages
  - Test network error handling with "Network error. Please check your connection." message
  - Ensure Error Boundaries catch rendering errors
  - Test 401/403 redirects and error pages
  - _Requirements: 20.2, 20.3, 20.6, 20.7_

- [ ] 13.4 Accessibility and polish
  - Add aria-labels to interactive elements
  - Ensure keyboard navigation works for all forms and modals
  - Test color contrast ratios meet WCAG standards
  - Add focus indicators for keyboard navigation
  - Test screen reader compatibility
  - _Requirements: 18.1_


### 14. Testing and Quality Assurance

- [ ]* 14.1 Write unit tests for shared components
  - Test DataTable component with various data and configurations
  - Test StatusBadge color mapping
  - Test ConfirmModal reason validation
  - Test FilterBar debounce behavior
  - Use Jest and React Testing Library
  - _Requirements: 25.1, 25.2, 25.3, 25.6_

- [ ]* 14.2 Write unit tests for hooks
  - Test useAuth store operations (setUser, logout, hasPermission, hasRole)
  - Test useQueryState URL parameter management
  - Mock TanStack Query hooks for testing
  - _Requirements: 21.1, 21.4_

- [ ]* 14.3 Write unit tests for utilities
  - Test date formatting functions
  - Test pagination helpers
  - Test className utilities
  - _Requirements: 2.8_

- [ ]* 14.4 Write integration tests for API client
  - Test apiClient interceptors (401 redirect, 403 error)
  - Test cookie forwarding in server API client
  - Mock axios responses
  - _Requirements: 22.4, 22.5, 22.6_

- [ ]* 14.5 Write integration tests for authentication flow
  - Test requireAdmin helper with various roles
  - Test login flow and session management
  - Test token refresh logic
  - Test logout and cleanup
  - _Requirements: 1.1, 1.3, 1.4, 1.6, 23.1, 23.2, 23.3, 23.4, 23.5_

- [ ]* 14.6 Write integration tests for user management
  - Test user list pagination and filtering
  - Test user search with debouncing
  - Test suspend and ban actions
  - Mock API responses
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 6.4, 6.7_

- [ ]* 14.7 Write E2E tests for critical flows
  - Test login → dashboard → user list → user detail → suspend user flow
  - Test listing moderation approval flow
  - Test report resolution flow
  - Use Playwright or Cypress
  - _Requirements: 1.1, 4.1, 6.7, 8.4, 11.5_


### 15. Final Integration and Deployment Preparation

- [ ] 15.1 Integration checkpoint
  - Ensure all feature modules are wired together correctly
  - Verify navigation between all pages works
  - Test role-based access control across all routes
  - Verify all API endpoints are correctly integrated
  - Ensure all mutations invalidate appropriate query cache
  - Test error handling across all features
  - _Requirements: 2.1, 2.2, 2.3, 21.6_

- [ ] 15.2 TypeScript compilation check
  - Run `npm run typecheck` and fix all TypeScript errors
  - Ensure no `any` types except for explicit external integrations
  - Verify all API types are correctly defined
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

- [ ] 15.3 Code organization review
  - Verify feature-based architecture is followed
  - Check for circular dependencies between feature folders
  - Ensure shared components are in `src/components/`
  - Verify hooks are in `src/hooks/` with correct naming
  - Ensure schemas are in `src/schemas/` with correct naming
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7_

- [ ] 15.4 Performance optimization
  - Verify TanStack Query cache settings (30s stale time)
  - Check that queries use `keepPreviousData` for pagination
  - Ensure dashboard auto-refresh is set to 60 seconds
  - Test debounced search (300ms delay)
  - _Requirements: 3.6, 5.2, 21.7_

- [ ] 15.5 Documentation and cleanup
  - Add README.md with setup instructions
  - Document environment variables in .env.example
  - Add JSDoc comments to complex functions
  - Remove console.logs and debug code
  - _Requirements: 22.3_

- [ ] 15.6 Final checkpoint
  - Run full build with `npm run build`
  - Test production build locally
  - Verify all pages render without errors
  - Test authentication flow end-to-end
  - Verify role-based access restrictions work
  - Test all CRUD operations
  - Ensure all tests pass (if tests are implemented)


## Notes

- **Tasks marked with `*` are optional** and can be skipped for faster MVP delivery. These are primarily test-related tasks.
- **Each task references specific requirements** for traceability back to the requirements document.
- **Checkpoint tasks** (15.1, 15.6) ensure validation at critical milestones - stop and verify all tests pass, and ask the user if questions arise.
- **Dependencies**: Tasks should generally be completed in order within each section, but different sections can be worked on in parallel after core infrastructure (Section 1-3) is complete.
- **Testing approach**: Unit tests validate specific examples and edge cases. Integration tests verify API integration and auth flows. E2E tests cover critical user journeys.
- **Property-based testing is NOT applicable** for this feature as it consists primarily of UI rendering, CRUD operations, and infrastructure integration.
- **State management**: Use Zustand for global auth state, TanStack Query for server state, React Hook Form for form state, and URL params for filter/pagination state.
- **Error handling**: All API errors should display parsed error messages in toast notifications. Loading states should be shown during all async operations.
- **Responsive design**: All pages must work on mobile (320px), tablet (768px), and desktop (1024px+) viewports.

## Implementation Strategy

1. **Phase 1 (Tasks 1-4)**: Core infrastructure - Set up project, API clients, authentication, layouts
2. **Phase 2 (Task 5)**: Dashboard module - Get first working feature with real data
3. **Phase 3 (Tasks 6-12)**: Feature modules - Build out all admin features incrementally
4. **Phase 4 (Task 13)**: Polish and responsiveness - Ensure quality UX across devices
5. **Phase 5 (Tasks 14-15)**: Testing and final integration - Validate and prepare for deployment

This structure allows for incremental progress with early validation of core patterns before building out all features.
