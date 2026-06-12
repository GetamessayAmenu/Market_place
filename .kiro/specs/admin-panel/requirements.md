# Requirements Document

## Introduction

The Admin Panel is a comprehensive administrative application (`apps/admin`) for managing the multi-vendor marketplace platform. It provides privileged users (admin, super_admin, moderator, customer_support) with tools to oversee users, moderate listings, handle reports, verify sellers, manage chat moderation, send notifications, and review audit logs. The application integrates with the existing NestJS backend API, RBAC system, notification system, and realtime service.

## Glossary

- **Admin_Panel**: The Next.js application running at `apps/admin` providing administrative interfaces
- **Backend_API**: The NestJS service at `services/api` (port 3001) providing REST endpoints
- **RBAC_System**: Role-Based Access Control system from Phase 4 managing permissions
- **Privileged_User**: A user with one of these roles: `admin`, `super_admin`, `moderator`, `customer_support`
- **Protected_Route**: A page requiring authentication and appropriate admin roles
- **Dashboard_Module**: The overview statistics and recent activity interface
- **User_Management_Module**: Interface for listing, searching, filtering, and moderating users
- **Listing_Moderation_Module**: Interface for reviewing and moderating marketplace listings
- **Report_Management_Module**: Interface for viewing and resolving scam/abuse reports
- **Seller_Verification_Module**: Interface for reviewing seller verification requests
- **Chat_Moderation_Module**: Interface for viewing reported chats and taking moderation actions
- **Notification_Module**: Interface for sending admin announcements and system alerts
- **Audit_Log_Module**: Interface for viewing admin activity history
- **Session**: An authenticated admin user session validated via JWT access token
- **Audit_Event**: A logged administrative action stored in the `admin_logs` table

## Requirements

### Requirement 1: Admin Panel Authentication

**User Story:** As a privileged user, I want to authenticate into the Admin Panel using my existing credentials, so that I can access administrative features.

#### Acceptance Criteria

1. THE Admin_Panel SHALL integrate with the existing JWT authentication system from Phase 4
2. WHEN a user navigates to any protected route without valid authentication, THE Admin_Panel SHALL redirect them to the login page
3. THE Admin_Panel SHALL validate the user's JWT access token using the Backend_API `/auth/me` endpoint
4. WHEN a user logs in successfully, THE Admin_Panel SHALL store the session state in a Zustand store
5. THE Admin_Panel SHALL use HttpOnly cookies for token storage consistent with `apps/web` patterns
6. WHEN a user's access token expires, THE Admin_Panel SHALL attempt to refresh using the refresh token cookie
7. IF token refresh fails, THEN THE Admin_Panel SHALL clear the session and redirect to login

### Requirement 2: Role-Based Route Protection

**User Story:** As a system administrator, I want routes to be protected by role requirements, so that users only access features they are authorized for.

#### Acceptance Criteria

1. THE Admin_Panel SHALL implement a `requireAdmin()` server-side helper that validates user roles
2. THE `requireAdmin()` helper SHALL accept an optional array of allowed roles (default: `['admin', 'super_admin', 'moderator', 'customer_support']`)
3. WHEN a user without appropriate roles accesses a protected route, THE Admin_Panel SHALL return a 403 Forbidden error
4. THE Admin_Panel SHALL check RBAC permissions on client-side actions using the Backend_API permission validation
5. THE Admin_Panel SHALL hide UI elements for actions the current user lacks permission to perform
6. WHEN a moderator accesses the Admin Panel, THE Admin_Panel SHALL restrict access to moderation-specific routes only
7. WHEN a customer_support user accesses the Admin Panel, THE Admin_Panel SHALL restrict access to user support routes only

### Requirement 3: Dashboard Overview

**User Story:** As an admin, I want to see platform statistics at a glance, so that I can monitor system health and activity.

#### Acceptance Criteria

1. THE Dashboard_Module SHALL display total user count fetched from the Backend_API
2. THE Dashboard_Module SHALL display total seller count (users with `seller` role)
3. THE Dashboard_Module SHALL display total active listing count
4. THE Dashboard_Module SHALL display pending report count (unresolved reports)
5. THE Dashboard_Module SHALL display a recent activity feed showing the last 20 admin actions from `admin_logs`
6. THE Dashboard_Module SHALL refresh statistics automatically every 60 seconds
7. THE Dashboard_Module SHALL use TanStack Query for data fetching with automatic error handling

### Requirement 4: User Management Listing

**User Story:** As an admin, I want to view all users in a paginated list, so that I can browse and manage the user base.

#### Acceptance Criteria

1. THE User_Management_Module SHALL fetch users from the Backend_API with pagination (20 users per page)
2. THE User_Management_Module SHALL display user ID, name, email, role, status, and created date in a table
3. THE User_Management_Module SHALL support sorting by name, email, created date, and role
4. THE User_Management_Module SHALL use URL query parameters for pagination state (`?page=2`)
5. WHEN a user clicks on a table row, THE User_Management_Module SHALL navigate to the detailed user profile page
6. THE User_Management_Module SHALL indicate suspended or banned users with visual styling (red badge)
7. THE User_Management_Module SHALL show skeleton loaders during data fetching

### Requirement 5: User Search and Filtering

**User Story:** As an admin, I want to search and filter users, so that I can quickly find specific users.

#### Acceptance Criteria

1. THE User_Management_Module SHALL provide a search input for filtering by email or name
2. THE User_Management_Module SHALL send search queries to the Backend_API with debouncing (300ms delay)
3. THE User_Management_Module SHALL provide role filter dropdown (all roles, buyer, seller, moderator, admin)
4. THE User_Management_Module SHALL provide status filter dropdown (all, active, suspended, banned, pending_verification)
5. WHEN filters are applied, THE User_Management_Module SHALL update the URL query parameters
6. THE User_Management_Module SHALL persist filter state across navigation using URL params
7. THE User_Management_Module SHALL display "No results found" when filters return empty results

### Requirement 6: User Suspension and Banning

**User Story:** As an admin, I want to suspend or ban users, so that I can moderate problematic accounts.

#### Acceptance Criteria

1. WHERE the current user has `user:suspend` permission, THE User_Management_Module SHALL display a "Suspend" button on user detail pages
2. WHERE the current user has `user:ban` permission, THE User_Management_Module SHALL display a "Ban" button on user detail pages
3. WHEN an admin clicks "Suspend", THE Admin_Panel SHALL show a confirmation modal with reason input (required)
4. WHEN an admin confirms suspension, THE Admin_Panel SHALL send a PATCH request to `/users/:id/suspend` with the reason
5. WHEN suspension succeeds, THE Admin_Panel SHALL log the action to `admin_logs` and display a success toast
6. WHEN an admin clicks "Ban", THE Admin_Panel SHALL show a confirmation modal with reason input (required)
7. WHEN an admin confirms ban, THE Admin_Panel SHALL send a PATCH request to `/users/:id/ban` with the reason
8. IF the suspension or ban request fails, THEN THE Admin_Panel SHALL display an error message from the API response

### Requirement 7: Listing Moderation Interface

**User Story:** As a moderator, I want to view all listings with status filters, so that I can review pending submissions.

#### Acceptance Criteria

1. THE Listing_Moderation_Module SHALL fetch listings from `/listings` with admin authentication
2. THE Listing_Moderation_Module SHALL provide status filter tabs: All, Pending, Active, Rejected, Expired
3. WHEN a moderator selects a status tab, THE Listing_Moderation_Module SHALL filter listings by that status
4. THE Listing_Moderation_Module SHALL display listing title, seller name, category, price, status, and created date
5. THE Listing_Moderation_Module SHALL support pagination (20 listings per page)
6. WHEN a moderator clicks on a listing, THE Admin_Panel SHALL navigate to the listing detail page
7. THE Listing_Moderation_Module SHALL show thumbnail images for each listing

### Requirement 8: Listing Approval and Rejection

**User Story:** As a moderator, I want to approve or reject listings, so that I can enforce content policies.

#### Acceptance Criteria

1. WHERE the current user has `listing:approve` permission, THE Listing_Moderation_Module SHALL display an "Approve" button on pending listings
2. WHERE the current user has `listing:reject` permission, THE Listing_Moderation_Module SHALL display a "Reject" button on pending listings
3. WHEN a moderator clicks "Approve", THE Admin_Panel SHALL send a POST request to `/listings/:id/publish`
4. WHEN approval succeeds, THE Admin_Panel SHALL update the listing status to `active` and display a success toast
5. WHEN a moderator clicks "Reject", THE Admin_Panel SHALL show a modal requiring rejection reason input
6. WHEN rejection is confirmed, THE Admin_Panel SHALL send a PATCH request to `/listings/:id` with `status: rejected` and reason
7. THE Admin_Panel SHALL log approval and rejection actions to `admin_logs` with listing ID and reason

### Requirement 9: Spam Removal and Featured Listings

**User Story:** As a moderator, I want to remove spam listings and mark quality listings as featured, so that I can maintain platform quality.

#### Acceptance Criteria

1. WHERE the current user has `listing:delete` permission, THE Listing_Moderation_Module SHALL display a "Remove as Spam" button
2. WHEN a moderator clicks "Remove as Spam", THE Admin_Panel SHALL show a confirmation modal
3. WHEN spam removal is confirmed, THE Admin_Panel SHALL send a DELETE request to `/listings/:id` with hard delete flag
4. WHERE the current user has `listing:feature` permission, THE Listing_Moderation_Module SHALL display a "Feature" toggle
5. WHEN a moderator toggles "Feature", THE Admin_Panel SHALL send a PATCH request to `/listings/:id` setting `is_featured` to true or false
6. THE Admin_Panel SHALL display featured listings with a star icon badge
7. THE Admin_Panel SHALL log spam removal and featuring actions to `admin_logs`

### Requirement 10: Report Management Dashboard

**User Story:** As a moderator, I want to view all reports with filtering, so that I can prioritize and resolve user complaints.

#### Acceptance Criteria

1. THE Report_Management_Module SHALL fetch reports from `/reports` endpoint with pagination
2. THE Report_Management_Module SHALL display report type, reporter name, reported entity (user or listing), reason, status, and created date
3. THE Report_Management_Module SHALL provide type filter: All, Scam, Abuse, Spam, Other
4. THE Report_Management_Module SHALL provide status filter: All, Pending, Under Review, Resolved, Dismissed
5. WHEN a moderator clicks on a report, THE Admin_Panel SHALL navigate to the report detail page
6. THE Report_Management_Module SHALL sort reports by created date descending by default
7. THE Report_Management_Module SHALL indicate unresolved reports with visual emphasis (bold or badge)

### Requirement 11: Report Resolution Workflow

**User Story:** As a moderator, I want to update report status and add resolution notes, so that I can track investigation outcomes.

#### Acceptance Criteria

1. THE Report_Management_Module SHALL display a report detail page with full report information
2. THE Report_Management_Module SHALL show the reported entity details (user profile or listing preview)
3. WHERE the current user has `report:resolve` permission, THE Admin_Panel SHALL display status update dropdown (Under Review, Resolved, Dismissed)
4. WHERE the current user has `report:resolve` permission, THE Admin_Panel SHALL display a resolution notes textarea
5. WHEN a moderator updates report status, THE Admin_Panel SHALL send a PATCH request to `/reports/:id` with new status and notes
6. WHEN resolution succeeds, THE Admin_Panel SHALL display a success toast and refresh the report data
7. THE Admin_Panel SHALL log report resolution actions to `admin_logs` with report ID and resolution type

### Requirement 12: Seller Verification Review

**User Story:** As an admin, I want to review seller verification requests, so that I can approve legitimate sellers.

#### Acceptance Criteria

1. THE Seller_Verification_Module SHALL fetch verification requests from `/verification-requests` endpoint with pagination
2. THE Seller_Verification_Module SHALL display requester name, document type, submission date, and status
3. THE Seller_Verification_Module SHALL provide status filter: All, Pending, Approved, Rejected
4. WHEN an admin clicks on a request, THE Admin_Panel SHALL navigate to the verification detail page
5. THE Seller_Verification_Module SHALL display uploaded documents (images or PDFs) in a preview modal
6. WHERE the current user has `seller:verify` permission, THE Admin_Panel SHALL display "Approve" and "Reject" buttons
7. WHEN an admin approves verification, THE Admin_Panel SHALL send a POST request to `/verification-requests/:id/approve`

### Requirement 13: Seller Verification Actions

**User Story:** As an admin, I want to approve or reject seller verification requests with notes, so that I can maintain seller quality standards.

#### Acceptance Criteria

1. WHEN an admin clicks "Approve" on a verification request, THE Admin_Panel SHALL send a POST request to `/verification-requests/:id/approve`
2. WHEN approval succeeds, THE Admin_Panel SHALL update the user's `emailVerifiedAt` or `phoneVerifiedAt` timestamp
3. WHEN an admin clicks "Reject", THE Admin_Panel SHALL show a modal requiring rejection reason input
4. WHEN rejection is confirmed, THE Admin_Panel SHALL send a POST request to `/verification-requests/:id/reject` with reason
5. THE Admin_Panel SHALL display a success toast after approval or rejection
6. THE Admin_Panel SHALL log verification actions to `admin_logs` with user ID and action reason
7. THE Admin_Panel SHALL refresh the verification requests list after action completion

### Requirement 14: Chat Moderation Interface

**User Story:** As a moderator, I want to view reported chats and messages, so that I can enforce communication policies.

#### Acceptance Criteria

1. THE Chat_Moderation_Module SHALL fetch reported conversations from `/conversations?reported=true` endpoint
2. THE Chat_Moderation_Module SHALL display conversation ID, participants, report count, last message date, and status
3. THE Chat_Moderation_Module SHALL provide status filter: All, Under Review, Resolved, Dismissed
4. WHEN a moderator clicks on a conversation, THE Admin_Panel SHALL display the full message history
5. THE Chat_Moderation_Module SHALL highlight reported messages with visual styling (yellow background)
6. THE Chat_Moderation_Module SHALL display report reason for each flagged message
7. THE Chat_Moderation_Module SHALL support pagination (20 conversations per page)

### Requirement 15: Chat Moderation Actions

**User Story:** As a moderator, I want to take actions on reported messages, so that I can remove policy violations.

#### Acceptance Criteria

1. WHERE the current user has `chat:moderate` permission, THE Chat_Moderation_Module SHALL display a "Delete Message" button for each message
2. WHERE the current user has `chat:moderate` permission, THE Chat_Moderation_Module SHALL display a "Warn User" button
3. WHEN a moderator clicks "Delete Message", THE Admin_Panel SHALL show a confirmation modal with reason input
4. WHEN message deletion is confirmed, THE Admin_Panel SHALL send a DELETE request to `/messages/:id` with reason
5. WHEN a moderator clicks "Warn User", THE Admin_Panel SHALL send a POST request to `/users/:id/warn` with warning text
6. THE Admin_Panel SHALL log chat moderation actions to `admin_logs` with message ID and action type
7. THE Chat_Moderation_Module SHALL refresh the conversation view after action completion

### Requirement 16: Admin Announcements

**User Story:** As an admin, I want to send system announcements to users, so that I can communicate important platform updates.

#### Acceptance Criteria

1. WHERE the current user has `notification:send` permission, THE Notification_Module SHALL display an "Create Announcement" form
2. THE Notification_Module SHALL provide input fields for title (required), body (required), and target audience (dropdown)
3. THE Notification_Module SHALL provide target audience options: All Users, Buyers Only, Sellers Only, Admins Only
4. WHEN an admin submits an announcement, THE Admin_Panel SHALL validate title (max 100 chars) and body (max 500 chars)
5. WHEN validation passes, THE Admin_Panel SHALL send a POST request to `/notifications/announce` with title, body, and audience
6. WHEN announcement succeeds, THE Admin_Panel SHALL display a success toast showing recipient count
7. THE Admin_Panel SHALL log announcement actions to `admin_logs` with title and recipient count

### Requirement 17: Audit Log Viewer

**User Story:** As a super admin, I want to view audit logs of admin actions, so that I can track system changes and accountability.

#### Acceptance Criteria

1. WHERE the current user has role `super_admin`, THE Audit_Log_Module SHALL fetch logs from `/admin-logs` endpoint
2. THE Audit_Log_Module SHALL display admin name, action type, target entity, timestamp, and IP address
3. THE Audit_Log_Module SHALL provide action type filter dropdown (all types, user actions, listing actions, report actions, etc.)
4. THE Audit_Log_Module SHALL provide date range filter (start date and end date pickers)
5. THE Audit_Log_Module SHALL support pagination (50 logs per page)
6. THE Audit_Log_Module SHALL sort logs by timestamp descending by default
7. WHEN a super admin clicks on a log entry, THE Admin_Panel SHALL display full details including request payload

### Requirement 18: Responsive Design

**User Story:** As an admin, I want the Admin Panel to work on different screen sizes, so that I can manage the platform from various devices.

#### Acceptance Criteria

1. THE Admin_Panel SHALL use TailwindCSS responsive utilities for all layouts
2. THE Admin_Panel SHALL collapse the sidebar navigation into a hamburger menu on screens smaller than 768px
3. THE Admin_Panel SHALL display data tables with horizontal scroll on mobile devices
4. THE Admin_Panel SHALL stack form inputs vertically on screens smaller than 640px
5. THE Admin_Panel SHALL use responsive typography scales (text-sm on mobile, text-base on desktop)
6. THE Admin_Panel SHALL test layouts on viewport widths: 320px, 768px, 1024px, 1920px
7. THE Admin_Panel SHALL maintain touch-friendly button sizes (minimum 44x44px) on mobile

### Requirement 19: TypeScript Type Safety

**User Story:** As a developer, I want strict TypeScript types across the Admin Panel, so that I can catch errors at compile time.

#### Acceptance Criteria

1. THE Admin_Panel SHALL enable TypeScript strict mode in `tsconfig.json`
2. THE Admin_Panel SHALL define explicit types for all API response shapes in a shared types file
3. THE Admin_Panel SHALL use Zod schemas for form validation with automatic type inference
4. THE Admin_Panel SHALL type all React component props with TypeScript interfaces
5. THE Admin_Panel SHALL type all TanStack Query hooks with explicit generic parameters
6. THE Admin_Panel SHALL compile without TypeScript errors when running `npm run typecheck`
7. THE Admin_Panel SHALL prohibit use of `any` type except for explicit external library integrations

### Requirement 20: Error Handling and User Feedback

**User Story:** As an admin, I want clear error messages and loading states, so that I understand system status at all times.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display toast notifications for successful actions (green background, 3 second duration)
2. THE Admin_Panel SHALL display toast notifications for errors (red background, 5 second duration)
3. WHEN an API request fails, THE Admin_Panel SHALL parse the error response and display the `error.message` field
4. THE Admin_Panel SHALL show loading spinners during data fetching operations
5. THE Admin_Panel SHALL disable action buttons during pending API requests to prevent double submission
6. WHEN network errors occur, THE Admin_Panel SHALL display "Network error. Please check your connection." message
7. THE Admin_Panel SHALL implement React Error Boundaries to catch rendering errors and display fallback UI

### Requirement 21: State Management Architecture

**User Story:** As a developer, I want consistent state management patterns, so that the codebase remains maintainable.

#### Acceptance Criteria

1. THE Admin_Panel SHALL use Zustand for global auth state (current user, roles, permissions)
2. THE Admin_Panel SHALL use TanStack Query for all server state (data fetching, caching, refetching)
3. THE Admin_Panel SHALL use React Hook Form for local form state
4. THE Admin_Panel SHALL use URL query parameters for pagination and filter state
5. THE Admin_Panel SHALL define a custom hook `useAuth()` that returns current user, login, logout, and role checking functions
6. THE Admin_Panel SHALL invalidate TanStack Query cache after mutation operations (create, update, delete)
7. THE Admin_Panel SHALL set TanStack Query default stale time to 30 seconds for admin data

### Requirement 22: API Client Integration

**User Story:** As a developer, I want a centralized API client, so that all backend requests follow consistent patterns.

#### Acceptance Criteria

1. THE Admin_Panel SHALL create `src/lib/adminApi.ts` with typed request helpers (apiGet, apiPost, apiPatch, apiDelete)
2. THE `adminApi` SHALL use Axios with `withCredentials: true` for cookie-based authentication
3. THE `adminApi` SHALL set base URL to `process.env.NEXT_PUBLIC_API_URL` (default: `http://localhost:3001/api/v1`)
4. THE `adminApi` SHALL include an Axios response interceptor for global error handling (401 → logout, 403 → permission error)
5. THE Admin_Panel SHALL create `src/lib/adminApiServer.ts` for server-side API calls with cookie forwarding
6. THE `adminApiServer` SHALL use `cookies()` from `next/headers` to forward auth cookies to the Backend_API
7. THE Admin_Panel SHALL define TypeScript interfaces for all API request and response shapes in `src/types/api.ts`

### Requirement 23: Protected Route Middleware

**User Story:** As a developer, I want reusable authentication helpers, so that route protection is consistent.

#### Acceptance Criteria

1. THE Admin_Panel SHALL create `src/lib/authAdmin.ts` with `requireAdmin(allowedRoles?: string[])` helper
2. THE `requireAdmin()` helper SHALL call `/auth/me` endpoint using server-side API client
3. WHEN `/auth/me` returns a user, THE `requireAdmin()` helper SHALL check if user role is in `allowedRoles`
4. IF user role is not allowed, THEN THE `requireAdmin()` helper SHALL throw an error with status 403
5. IF `/auth/me` fails with 401, THEN THE `requireAdmin()` helper SHALL call `redirect('/login')`
6. THE Admin_Panel SHALL use `requireAdmin()` in all server component page files before rendering
7. THE Admin_Panel SHALL catch errors from `requireAdmin()` and display 403 error pages for unauthorized access

### Requirement 24: Feature-Based Architecture

**User Story:** As a developer, I want code organized by feature domain, so that related logic is colocated.

#### Acceptance Criteria

1. THE Admin_Panel SHALL organize code under `src/features/` directory with subfolders per domain
2. THE Admin_Panel SHALL create feature folders: `dashboard`, `users`, `listings`, `reports`, `verifications`, `chat`, `notifications`, `audit-logs`
3. WHEN a feature has multiple related components, THE Admin_Panel SHALL colocate them in the same feature folder
4. THE Admin_Panel SHALL place shared components in `src/components/` (layout, ui primitives, tables)
5. THE Admin_Panel SHALL place TanStack Query hooks in `src/hooks/` with naming pattern `use{Entity}.ts`
6. THE Admin_Panel SHALL place Zod validation schemas in `src/schemas/` with naming pattern `{entity}.schema.ts`
7. THE Admin_Panel SHALL avoid circular dependencies between feature folders

### Requirement 25: Reusable Component Library

**User Story:** As a developer, I want reusable UI components, so that I can build pages quickly with consistent styling.

#### Acceptance Criteria

1. THE Admin_Panel SHALL create a `DataTable` component supporting sorting, pagination, and row actions
2. THE Admin_Panel SHALL create a `StatusBadge` component with predefined color variants (active, pending, rejected, banned)
3. THE Admin_Panel SHALL create a `ConfirmModal` component for destructive action confirmations
4. THE Admin_Panel SHALL create a `PageHeader` component with title, breadcrumbs, and action buttons
5. THE Admin_Panel SHALL create a `StatCard` component for dashboard metrics (title, value, icon, trend)
6. THE Admin_Panel SHALL create a `FilterBar` component for search, sort, and filter controls
7. THE Admin_Panel SHALL use TailwindCSS utility classes for styling (no custom CSS files)
