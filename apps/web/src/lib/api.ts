import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export async function apiGet<T = any>(path: string, params?: Record<string, any>) {
  const res = await axios.get<T>(`${API_BASE}${path}`, { params, withCredentials: true })
  return res.data
}

export async function apiPost<T = any>(path: string, data?: any) {
  const res = await axios.post<T>(`${API_BASE}${path}`, data, { withCredentials: true })
  return res.data
}

export default { apiGet, apiPost }
