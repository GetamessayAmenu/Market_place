import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

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
  const res = await axios.get<{ data: T }>(`${API_BASE}${path}`, { params, withCredentials: true })
  return unwrap<T>(res.data)
}

export async function apiPost<T = unknown>(path: string, data?: Record<string, unknown>): Promise<T> {
  const res = await axios.post<{ data: T }>(`${API_BASE}${path}`, data, { withCredentials: true })
  return unwrap<T>(res.data)
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const res = await axios.delete<{ data: T }>(`${API_BASE}${path}`, { withCredentials: true })
  return unwrap<T>(res.data)
}

export async function apiPatch<T = unknown>(path: string, data?: Record<string, unknown>): Promise<T> {
  const res = await axios.patch<{ data: T }>(`${API_BASE}${path}`, data, { withCredentials: true })
  return unwrap<T>(res.data)
}

export default { apiGet, apiPost, apiDelete, apiPatch }
