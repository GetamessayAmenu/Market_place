import { redirect } from 'next/navigation'

import { serverGet } from './serverApi'

export interface AuthUser {
  id: string
  name?: string
  email?: string
}

interface AuthResponse {
  success: boolean
  data: AuthUser
}

export async function requireUser(): Promise<AuthUser | undefined> {
  try {
    const res = await serverGet<AuthResponse>('/auth/me')
    return res.data
  } catch {
    redirect('/login')
    return undefined
  }
}

export default { requireUser }
