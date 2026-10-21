import type { AuthUser } from '../hooks/useAuth'

import { apiGet, apiPatch, apiPost, apiDelete } from './api'

interface AuthResponse {
  user: AuthUser
  tokens: { accessToken: string; expiresIn: number }
  verification?: { emailToken?: string }
}

interface MeResponse {
  user: AuthUser
}

interface SuccessResponse {
  success: boolean
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/login', { email, password })
  if (typeof window !== 'undefined' && res?.tokens?.accessToken) {
    localStorage.setItem('accessToken', res.tokens.accessToken)
  }
  return res
}

export async function register(data: {
  email: string
  password: string
  displayName: string
  phone?: string
  userType?: 'buyer' | 'seller'
}): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/register', data)
  if (typeof window !== 'undefined' && res?.tokens?.accessToken) {
    localStorage.setItem('accessToken', res.tokens.accessToken)
  }
  return res
}

export async function logout(): Promise<SuccessResponse> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('token')
  }
  return apiPost<SuccessResponse>('/auth/logout')
}

export async function me(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me')
}

export async function forgotPassword(email: string): Promise<SuccessResponse> {
  return apiPost<SuccessResponse>('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, newPassword: string): Promise<SuccessResponse> {
  return apiPost<SuccessResponse>('/auth/reset-password', { token, newPassword })
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<SuccessResponse> {
  return apiPost<SuccessResponse>('/auth/change-password', { currentPassword, newPassword })
}

export async function updateProfile(data: {
  displayName?: string
  avatarUrl?: string
  phone?: string
  bio?: string
  location?: string
  sellerType?: string
  socialLinks?: Record<string, any>
}): Promise<AuthUser> {
  return apiPatch<AuthUser>('/users/me', data)
}

export async function resendVerificationEmail(email?: string): Promise<SuccessResponse> {
  return apiPost<SuccessResponse>('/auth/verify/resend', email != null ? { email } : {})
}

export async function deleteAccount(): Promise<{ deleted: true }> {
  const res = await apiDelete<{ deleted: true }>('/users/me')
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('token')
  }
  return res
}

export default { login, register, logout, me, forgotPassword, resetPassword, changePassword, updateProfile, resendVerificationEmail, deleteAccount }
