import { serverGet } from './serverApi'
import { redirect } from 'next/navigation'

export type AuthUser = { id: string; name?: string; email?: string }

export async function requireUser(): Promise<any> {
  try {
    const res = await serverGet('/auth/me')
    return res.data as AuthUser
  } catch (err) {
    redirect('/login')
    return undefined
  }
}

export default { requireUser }
