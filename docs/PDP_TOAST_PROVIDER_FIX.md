# Toast Provider Fix

## Issue
```
Error: useToast must be used within a ToastProvider
```

## Root Cause
The new components (`RequestCallbackButton`, `ReportAbuseButton`, `MarkUnavailableButton`) use the `useToast` hook, but `ToastProvider` was not set up in the app layout.

## Solution Applied

### Updated File
`apps/web/src/providers/Providers.tsx`

### Changes Made

**Before:**
```typescript
"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  // ... auth logic
  
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

**After:**
```typescript
"use client"
import { ToastProvider } from '@marketplace/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  // ... auth logic
  
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  )
}
```

## What This Enables

Now all components can use `useToast()` hook for notifications:

### Usage Example
```typescript
import { useToast } from '@marketplace/ui'

function MyComponent() {
  const { toast } = useToast()
  
  const handleSuccess = () => {
    toast({
      title: 'Success!',
      description: 'Your action was completed.',
      variant: 'success',
    })
  }
  
  const handleError = () => {
    toast({
      title: 'Error',
      description: 'Something went wrong.',
      variant: 'destructive',
    })
  }
  
  return <button onClick={handleSuccess}>Click me</button>
}
```

## Components Now Working

✅ `RequestCallbackButton` - Shows success/error toasts
✅ `ReportAbuseButton` - Shows success/error toasts  
✅ `MarkUnavailableButton` - Shows success/error toasts

## Verification

Run the app and test:
1. Navigate to any listing page
2. Click "Request Callback" button
3. Submit the form
4. Toast notification should appear ✅

## Status
✅ **Fixed** - ToastProvider now wraps all app content
