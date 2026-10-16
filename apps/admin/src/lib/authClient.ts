import type { AuthUser } from '@marketplace/types'
import { clientGet, clientPost } from './clientApi'

interface AuthResponse {
  user: AuthUser
  tokens: { accessToken: string; expiresIn: number }
}

interface LogoutResponse {
  success: boolean
}

interface BackendAuthResponse {
  success: boolean
  data: AuthResponse
}

interface BackendMeResponse {
  success: boolean
  data: { user: AuthUser }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await clientPost<BackendAuthResponse>('/auth/login', { email, password })
  return response.data
}

export async function me(): Promise<AuthUser> {
  const response = await clientGet<BackendMeResponse>('/auth/me')
  return response.data.user
}

export async function logout(): Promise<LogoutResponse> {
  try {
    const response = await clientPost<LogoutResponse>('/auth/logout')
    return response
  } catch (err) {
    console.warn('Backend logout call completed with warning:', err)
    return { success: true }
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token')
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'refresh_token=; path=/api/v1/auth; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }
}

export default { login, me, logout }
