import axios from 'axios'

const API_BASE = 'http://localhost:3001/api/v1'

/**
 * The NestJS `TransformResponseInterceptor` wraps every success response in
 * `{ success: true, data: <value> }`.  This helper extracts the inner `data`
 * so callers receive the payload directly.
 */
function unwrap<T>(body: { data: T }): T {
  return body.data
}

export async function apiGet<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const res = await axios.get<{ data: T }>(`${API_BASE}${path}`, { params, withCredentials: true })
  return unwrap(res.data)
}

export async function apiPost<T = unknown>(path: string, data?: Record<string, unknown>) {
  const res = await axios.post<{ data: T }>(`${API_BASE}${path}`, data, { withCredentials: true })
  return unwrap(res.data)
}

export async function apiDelete<T = unknown>(path: string) {
  const res = await axios.delete<{ data: T }>(`${API_BASE}${path}`, { withCredentials: true })
  return unwrap(res.data)
}

export async function apiPatch<T = unknown>(path: string, data?: Record<string, unknown>) {
  const res = await axios.patch<{ data: T }>(`${API_BASE}${path}`, data, { withCredentials: true })
  return unwrap(res.data)
}

export default { apiGet, apiPost, apiDelete, apiPatch }
