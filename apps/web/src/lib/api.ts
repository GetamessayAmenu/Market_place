import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

export async function apiGet<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const res = await axios.get<T>(`${API_BASE}${path}`, { params, withCredentials: true })
  return res.data
}

export async function apiPost<T = unknown>(path: string, data?: Record<string, unknown>) {
  const res = await axios.post<T>(`${API_BASE}${path}`, data, { withCredentials: true })
  return res.data
}

export async function apiDelete<T = unknown>(path: string) {
  const res = await axios.delete<T>(`${API_BASE}${path}`, { withCredentials: true })
  return res.data
}

export async function apiPatch<T = unknown>(path: string, data?: Record<string, unknown>) {
  const res = await axios.patch<T>(`${API_BASE}${path}`, data, { withCredentials: true })
  return res.data
}

export default { apiGet, apiPost, apiDelete, apiPatch }
