# Admin Authentication Proxy Bugfix Design

## Overview

The admin panel's authentication flow is broken because API requests to `/api/v1/*` endpoints fail with 404 errors. While Next.js rewrites are configured in `next.config.js`, they use a hardcoded backend URL (`http://localhost:3001`) that doesn't work across environments. The fix requires implementing Next.js API route handlers that proxy requests to the backend service using environment-based configuration.

**Strategy**: Replace the static rewrites with dynamic API route handlers that read the backend URL from environment variables and properly forward requests, cookies, and headers between the client and backend service.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when API requests to `/api/v1/*` are made, they should be proxied to the backend but fail due to hardcoded rewrite configuration
- **Property (P)**: The desired behavior - API requests to `/api/v1/*` should be proxied to the backend service using environment-configured URLs with proper header and cookie forwarding
- **Preservation**: Existing middleware authentication checks, login form behavior, and route protection that must remain unchanged
- **clientApi.ts**: The API client in `apps/admin/src/lib/clientApi.ts` that makes requests to `/api/v1/*` endpoints
- **authClient.ts**: The authentication client in `apps/admin/src/lib/authClient.ts` that uses clientApi for login, me, and logout operations
- **middleware.ts**: The Next.js middleware that checks for `access_token` cookie and redirects unauthenticated users
- **Backend API Service**: The backend service running at the URL specified by `BACKEND_API_URL` environment variable (default: `http://localhost:3001`)

## Bug Details

### Bug Condition

The bug manifests when any code in the admin app makes API requests to `/api/v1/*` endpoints. While Next.js rewrites are configured, they use hardcoded URLs that don't adapt to different environments. The authentication flow completely fails because login requests cannot reach the backend service, and the hardcoded configuration breaks in production/staging environments.

**Formal Specification:**
```
FUNCTION isBugCondition(request)
  INPUT: request of type HTTP Request
  OUTPUT: boolean
  
  RETURN request.path STARTS_WITH '/api/v1/'
         AND (BACKEND_API_URL is undefined OR rewrites use hardcoded URLs)
         AND request originates from admin app client-side code
END FUNCTION
```

### Examples

- **Login Request**: User submits credentials → POST to `/api/v1/auth/login` → Rewrite tries to use hardcoded `http://localhost:3001` → Fails in production/staging environments
- **Me Request**: Client checks authentication → GET to `/api/v1/auth/me` → Rewrite uses hardcoded URL → Fails in non-local environments
- **Logout Request**: User logs out → POST to `/api/v1/auth/logout` → Rewrite uses hardcoded URL → Fails in non-local environments
- **Any Admin API Call**: Feature requests data → GET to `/api/v1/listings` → Rewrite uses hardcoded URL → Fails in non-local environments

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Middleware authentication checking for `access_token` cookie must continue to work
- Public paths (/login, /admin, /admin/unauthorized, /admin/forbidden) must remain accessible without authentication
- Protected routes must continue redirecting unauthenticated users to /login
- Login form validation and rendering must remain unchanged
- Static asset and Next.js internal route serving must remain unchanged

**Scope:**
All functionality that does NOT involve making API requests to `/api/v1/*` should be completely unaffected by this fix. This includes:
- Middleware route protection logic
- Login form UI and client-side validation
- Next.js routing and navigation
- Static asset serving
- Server-side rendering of pages

## Hypothesized Root Cause

Based on the bug description and code analysis, the issue is:

1. **Hardcoded Rewrite Configuration**: The `next.config.js` file contains rewrites with hardcoded `http://localhost:3001` URLs that don't adapt to different environments (production, staging, etc.)

2. **Missing Environment Variable Usage**: The rewrites don't read from `BACKEND_API_URL` or similar environment variables to determine the backend service location

3. **Static vs Dynamic Configuration**: Next.js rewrites are evaluated at build time with static values, but the backend URL needs to be dynamic based on deployment environment

4. **Lack of API Route Handlers**: There are no Next.js API route handlers in `apps/admin/src/app/api/v1/` to dynamically proxy requests to the backend using environment-configured URLs

## Correctness Properties

Property 1: Bug Condition - API Proxy Request Forwarding

_For any_ HTTP request where the path starts with `/api/v1/` and originates from the admin app, the fixed proxy SHALL forward the request to `{BACKEND_API_URL}/api/v1/*`, preserve all request headers and cookies, make the backend request, and return the backend's response with appropriate headers and cookies to the client.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.6**

Property 2: Preservation - Non-API Request Behavior

_For any_ request that does NOT target `/api/v1/*` paths (middleware checks, page rendering, static assets, login form behavior), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing authentication, routing, and UI functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

The fix requires replacing static rewrites with dynamic API route handlers that use environment variables.

**File**: `apps/admin/next.config.js`

**Changes**:
1. **Remove Static Rewrites**: Remove the hardcoded rewrites configuration that points to `http://localhost:3001`

**File**: `apps/admin/.env.example`

**Changes**:
1. **Add Backend API URL**: Add `BACKEND_API_URL=http://localhost:3001` to the environment template

**File**: `apps/admin/src/app/api/v1/[...path]/route.ts` (NEW)

**Changes**:
1. **Create Catch-All API Route**: Create a dynamic route handler that catches all `/api/v1/*` requests
2. **Read Backend URL from Environment**: Use `process.env.BACKEND_API_URL` to determine the backend service location
3. **Forward Request Headers**: Extract and forward relevant headers (Content-Type, Authorization, etc.)
4. **Forward Request Cookies**: Extract cookies from incoming request and include in backend request
5. **Proxy Request to Backend**: Make the HTTP request to `{BACKEND_API_URL}{requestPath}` with the same method, headers, and body
6. **Extract Response Cookies**: Parse `Set-Cookie` headers from backend response
7. **Set Response Cookies**: Apply cookies to the Next.js response as HttpOnly cookies
8. **Forward Response**: Return the backend's response body and status code to the client
9. **Error Handling**: Catch network errors and return appropriate error responses

**Specific Implementation Details**:
- Use Next.js 14 App Router route handler syntax: `export async function GET/POST/PATCH/etc.`
- Handle all HTTP methods: GET, POST, PATCH, PUT, DELETE
- Use dynamic route parameter: `[...path]` to catch all sub-paths under `/api/v1/`
- Reconstruct the full backend URL: `${BACKEND_API_URL}/api/v1/${params.path.join('/')}`
- Include query parameters from the original request
- Set cookies with `httpOnly: true` flag for security
- Forward status codes from backend (200, 400, 401, 403, 404, 500, etc.)
- Handle JSON response bodies from backend
- Include error handling for when `BACKEND_API_URL` is not configured

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (rewrites with hardcoded URLs), then verify the fix works correctly across different environments and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the hardcoded rewrite configuration fails in non-local environments.

**Test Plan**: Write tests that simulate API requests in different environment configurations. Run these tests with the current rewrite-based approach to observe failures when `BACKEND_API_URL` differs from `http://localhost:3001`.

**Test Cases**:
1. **Login Request Test**: Simulate POST to `/api/v1/auth/login` with different `BACKEND_API_URL` values (will fail on unfixed code for non-localhost URLs)
2. **Environment Variable Test**: Set `BACKEND_API_URL=http://api.production.com` and verify rewrites still use `http://localhost:3001` (will fail on unfixed code)
3. **Me Request Test**: Simulate GET to `/api/v1/auth/me` in staging environment (will fail on unfixed code)
4. **Cookie Forwarding Test**: Verify cookies are not properly forwarded through rewrites (may fail on unfixed code)

**Expected Counterexamples**:
- Rewrites use hardcoded `http://localhost:3001` regardless of `BACKEND_API_URL` value
- API requests fail in production/staging environments where backend is not at localhost:3001
- Possible additional issues: cookie forwarding, header preservation

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (API requests to `/api/v1/*`), the fixed proxy properly forwards requests to the environment-configured backend URL.

**Pseudocode:**
```
FOR ALL request WHERE isBugCondition(request) DO
  response := proxyHandler(request, BACKEND_API_URL)
  ASSERT response.backendUrl = BACKEND_API_URL + request.path
  ASSERT response.headers include backend response headers
  ASSERT response.cookies include backend response cookies
  ASSERT response.statusCode = backend response status
END FOR
```

### Preservation Checking

**Goal**: Verify that for all requests where the bug condition does NOT hold (non-API requests), the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) DO
  ASSERT newBehavior(request) = originalBehavior(request)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different request types
- It catches edge cases in middleware, routing, and authentication that manual tests might miss
- It provides strong guarantees that non-API behavior is unchanged

**Test Plan**: Observe behavior on UNFIXED code first for middleware checks, login form, protected routes, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Middleware Authentication Preservation**: Observe that middleware redirects unauthenticated users on unfixed code, verify this continues after fix
2. **Login Form Preservation**: Observe that login form renders and validates on unfixed code, verify this continues after fix
3. **Public Routes Preservation**: Observe that public routes are accessible on unfixed code, verify this continues after fix
4. **Protected Routes Preservation**: Observe that protected routes check for `access_token` on unfixed code, verify this continues after fix

### Unit Tests

- Test API route handler with different HTTP methods (GET, POST, PATCH, PUT, DELETE)
- Test request header forwarding (Content-Type, Authorization, custom headers)
- Test request cookie forwarding from client to backend
- Test response cookie extraction and setting (HttpOnly cookies)
- Test query parameter preservation in proxied URLs
- Test error handling when BACKEND_API_URL is not configured
- Test error handling for network failures to backend
- Test status code forwarding from backend to client
- Test request body forwarding for POST/PATCH requests

### Property-Based Tests

- Generate random API paths under `/api/v1/` and verify they are correctly proxied to backend
- Generate random environment configurations (BACKEND_API_URL values) and verify proxy adapts
- Generate random request headers and verify they are forwarded to backend
- Generate random cookie values and verify they are forwarded and returned correctly
- Test that all non-API requests continue to work across many random scenarios

### Integration Tests

- Test full authentication flow: login → cookie set → me request → logout
- Test login with valid credentials and verify access_token cookie is set
- Test protected route access after successful authentication
- Test middleware behavior with and without access_token cookie
- Test that login form continues to work with validation
- Test that public routes remain accessible without authentication
