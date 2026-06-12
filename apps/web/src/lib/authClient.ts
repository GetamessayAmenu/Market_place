import { apiPost, apiGet } from './api'

export type AuthUser = { id: string; name?: string; email?: string }

export async function login(email: string, password: string) {
  const res = await apiPost('/auth/login', { email, password })
  return res
}

export async function logout() {
  const res = await apiPost('/auth/logout')
  return res
}

export async function me() {
  const res = await apiGet('/auth/me')
  return res
}

export default { login, logout, me }
