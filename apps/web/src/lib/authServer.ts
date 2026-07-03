import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { AuthUser } from '../hooks/useAuth'

import { serverGet } from './serverApi'

interface MeResponse {
  user: AuthUser
}

export type { AuthUser }

/**
 * Server-side auth guard. Redirects to /login if not authenticated.
 */
export async function requireUser(): Promise<AuthUser | undefined> {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    const res = await serverGet<MeResponse>('/auth/me', { cookieHeader })
    return res.user
  } catch {
    redirect('/login')
    return undefined
  }
}

/**
 * Server-side auth check that returns null instead of redirecting.
 * Useful for pages that work for both authenticated and unauthenticated users.
 */
export async function optionalUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    const res = await serverGet<MeResponse>('/auth/me', { cookieHeader })
    return res.user
  } catch {
    return null
  }
}

export default { requireUser, optionalUser }
