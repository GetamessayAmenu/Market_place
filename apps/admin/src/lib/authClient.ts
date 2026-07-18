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
  return clientPost<LogoutResponse>('/auth/logout')
}

export default { login, me, logout }
