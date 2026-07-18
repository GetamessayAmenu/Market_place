# Admin Authentication Proxy Bugfix Requirements

## Introduction

The admin panel at `/home/messay/Desktop/marketplace/apps/admin` has a critical authentication bug that prevents users from signing in and accessing the dashboard. The login functionality fails because API requests to `/api/v1/*` endpoints return 404 errors - the admin Next.js app has no API proxy routes configured to forward these requests to the backend service.

**Impact**: Complete authentication failure - no admin users can access the system.

**Root Cause**: The admin app's `clientApi.ts` makes requests to relative paths (`/api/v1/auth/login`), expecting the Next.js app to proxy them to the backend service at `http://localhost:3001`. However, no such proxy routes exist in the admin app, unlike typical Next.js API route patterns.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user submits login credentials on `/login` THEN the system makes a POST request to `/api/v1/auth/login` which returns 404 (Not Found)

1.2 WHEN a client-side component calls any auth function (login, me, logout) THEN the system makes a request to a non-existent `/api/v1/*` route which fails with 404

1.3 WHEN the middleware checks for authentication on protected routes THEN users are redirected to `/login` but cannot successfully authenticate due to failed API calls

1.4 WHEN any admin feature attempts to fetch data from the backend THEN requests to `/api/v1/*` endpoints fail with 404 errors

### Expected Behavior (Correct)

2.1 WHEN a user submits login credentials on `/login` THEN the system SHALL proxy the POST request to `{BACKEND_API_URL}/api/v1/auth/login` and return the backend's response with cookies set

2.2 WHEN a client-side component calls any auth function THEN the system SHALL proxy the request to the backend API service and forward the response including authentication cookies

2.3 WHEN authentication succeeds THEN the system SHALL set the `access_token` HttpOnly cookie from the backend response and redirect to the dashboard

2.4 WHEN any API request is made to `/api/v1/*` THEN the system SHALL forward the request to the backend service, preserve request headers and cookies, and return the backend's response

2.5 WHEN the backend returns authentication cookies THEN the system SHALL forward those cookies to the client as HttpOnly cookies

2.6 WHEN API proxy requests fail THEN the system SHALL return appropriate error responses with status codes matching the backend or network error conditions

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the middleware checks for `access_token` cookie on protected routes THEN the system SHALL CONTINUE TO redirect unauthenticated users to `/login`

3.2 WHEN users access public paths (/login, /admin, /admin/unauthorized, /admin/forbidden) THEN the system SHALL CONTINUE TO allow access without authentication

3.3 WHEN users access static assets and Next.js internal routes THEN the system SHALL CONTINUE TO serve them without authentication checks

3.4 WHEN authenticated users navigate to protected routes THEN the system SHALL CONTINUE TO allow access based on the `access_token` cookie

3.5 WHEN the login page renders THEN the system SHALL CONTINUE TO display the form with email/password fields and proper validation

3.6 WHEN form validation fails on the login page THEN the system SHALL CONTINUE TO display validation errors without making API calls
