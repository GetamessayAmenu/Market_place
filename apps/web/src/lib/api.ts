import axios from 'axios'

function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
  const trimmed = envUrl.replace(/\/+$/, '')
  if (trimmed.endsWith('/api/v1')) return trimmed
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`
  return `${trimmed}/api/v1`
}

const API_BASE = getApiBase()

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// Automatically attach Bearer token from localStorage in browser environment
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

/**
 * Extracts a clear, user-friendly error message from API responses.
 * Avoids exposing raw Axios errors like "Request failed with status code 403".
 */
export function getApiErrorMessage(err: unknown, fallback = 'Failed to submit. Please try again.'): string {
  if (!err) return fallback
  if (typeof err === 'string') {
    const trimmed = err.trim()
    if (trimmed.length > 0 && !trimmed.includes('status code')) {
      return trimmed
    }
  }
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any
    if (data) {
      // 1. NestJS AllExceptionsFilter: { error: { message: '...', code: '...' } }
      if (data.error && typeof data.error === 'object') {
        if (typeof data.error.message === 'string' && data.error.message.trim().length > 0) {
          return data.error.message.trim()
        }
        if (Array.isArray(data.error.message) && data.error.message.length > 0) {
          return data.error.message.join('. ')
        }
      }
      // 2. Direct message string or array: { message: '...' }
      if (typeof data.message === 'string' && data.message.trim().length > 0) {
        return data.message.trim()
      }
      if (Array.isArray(data.message) && data.message.length > 0) {
        return data.message.join('. ')
      }
      // 3. Simple error string: { error: '...' }
      if (typeof data.error === 'string' && data.error.trim().length > 0) {
        return data.error.trim()
      }
      // 4. Form validation errors dictionary: { errors: { field: ['...'] } }
      if (data.errors && typeof data.errors === 'object') {
        const msgs = Object.values(data.errors).flat().filter(Boolean)
        if (msgs.length > 0) return msgs.join('. ')
      }
    }
    if (err.response?.status === 403) {
      return "You don't have permission to create listings. Please make sure your seller account is verified."
    }
    if (err.response?.status === 401) {
      return 'Your session has expired. Please sign in again.'
    }
    if (err.response?.status === 404) {
      return 'The requested resource was not found.'
    }
    if (err.response?.status && err.response.status >= 500) {
      return 'Server error occurred. Please try again shortly.'
    }
    if (err.message && !err.message.includes('status code')) {
      return err.message
    }
  }
  if (err instanceof Error && !err.message.includes('status code')) {
    return err.message
  }
  return fallback
}

/**
 * The NestJS `TransformResponseInterceptor` wraps every success response in
 * `{ success: true, data: <value> }`. This helper extracts the inner payload.
 * For paginated search responses containing `{ data: [...], meta: {...} }`,
 * it preserves the root paginated object so callers can access `meta` and `data`.
 */
function unwrap<T>(body: any): T {
  const result = body?.data !== undefined ? body.data : body

  // If payload is a paginated response object containing both `data` array and `meta` object,
  // return the full response object
  if (result && typeof result === 'object' && Array.isArray(result.data) && result.meta !== undefined) {
    return result as T
  }

  // If double-wrapped `{ success: true, data: ... }` without meta
  if (result && typeof result === 'object' && result.data !== undefined && result.success !== undefined) {
    return result.data as T
  }

  return result as T
}

export async function apiGet<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const res = await apiClient.get<{ data: T }>(path, { params })
  return unwrap<T>(res.data)
}

export async function apiPost<T = unknown>(path: string, data?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.post<{ data: T }>(path, data)
  return unwrap<T>(res.data)
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const res = await apiClient.delete<{ data: T }>(path)
  return unwrap<T>(res.data)
}

export async function apiPatch<T = unknown>(path: string, data?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.patch<{ data: T }>(path, data)
  return unwrap<T>(res.data)
}

export default { apiGet, apiPost, apiDelete, apiPatch, getApiErrorMessage }
