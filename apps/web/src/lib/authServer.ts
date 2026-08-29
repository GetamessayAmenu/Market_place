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
export async function requireUser(): Promise<AuthUser> {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    const res = await serverGet<MeResponse>('/auth/me', { cookieHeader })
    if (!res || !res.user) {
      redirect('/login')
    }
    return res.user
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err
    }
    redirect('/login')
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
    return res?.user || null
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err
    }
    return null
  }
}

export default { requireUser, optionalUser }
