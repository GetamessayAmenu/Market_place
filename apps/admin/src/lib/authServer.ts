import { serverGet } from './serverApi'
import { redirect } from 'next/navigation'

export type AdminUser = { id: string; name?: string; email?: string; roles?: string[] }

const DEFAULT_ALLOWED = ['admin', 'super_admin', 'moderator', 'customer_support']

export async function requireAdmin(allowedRoles: string[] = DEFAULT_ALLOWED): Promise<AdminUser | undefined> {
  try {
    const res = await serverGet('/auth/me')
    const user = res.data as AdminUser
    const userRoles: string[] = user?.roles || []
    const allowed = allowedRoles.some(r => userRoles.includes(r))
    if (!allowed) {
      redirect('/')
      return undefined
    }
    return user
  } catch (err) {
    redirect('/login')
    return undefined
  }
}

export default { requireAdmin }
