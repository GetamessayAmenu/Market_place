import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { serverGet } from './serverApi'
import { ADMIN_ROLES, type AdminRole } from './adminRoles'

export interface AdminUser {
  id: string
  email: string
  displayName?: string
  role?: AdminRole
  roles?: AdminRole[]
}

const DEFAULT_ALLOWED: AdminRole[] = ['admin', 'super_admin', 'moderator', 'support']

export async function requireAdmin(allowedRoles: AdminRole[] = DEFAULT_ALLOWED): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    const res = await serverGet<{ success: boolean; data: { user: AdminUser } }>('/auth/me', { cookieHeader })
    const user = res.data.user
    const userRoles: AdminRole[] = user.roles ?? (user.role ? [user.role] : [])
    const allowed = allowedRoles.some((role) => userRoles.includes(role))

    if (!allowed) {
      redirect('/admin/forbidden')
      return null
    }

    return user
  } catch {
    redirect('/admin')
    return null
  }
}

export function isAdminRole(role: string | undefined): boolean {
  return ADMIN_ROLES.includes(role as AdminRole)
}

export default { requireAdmin, isAdminRole }
