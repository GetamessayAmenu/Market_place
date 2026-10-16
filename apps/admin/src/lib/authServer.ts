import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { serverGet } from './serverApi'
import { ADMIN_ROLES, type AdminRole, type AdminUser } from './adminRoles'
import { can as canUtil, isSuperAdmin as isSuperAdminUtil } from './permissions'

export type { AdminUser }

const DEFAULT_ALLOWED: AdminRole[] = [
  'super_admin',
  'platform_admin',
  'admin',
  'moderator',
  'content_manager',
  'support',
]

export interface RequireAdminOptions {
  allowedRoles?: AdminRole[]
  requiredPermission?: string
}

export async function requireAdmin(
  optionsOrRoles: AdminRole[] | RequireAdminOptions = DEFAULT_ALLOWED,
): Promise<AdminUser | null> {
  const options: RequireAdminOptions = Array.isArray(optionsOrRoles)
    ? { allowedRoles: optionsOrRoles }
    : optionsOrRoles

  const allowedRoles = options.allowedRoles ?? DEFAULT_ALLOWED
  const requiredPermission = options.requiredPermission

  try {
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()
    const res = await serverGet<{ success: boolean; data: { user: AdminUser } }>('/auth/me', { cookieHeader })
    const user = res.data.user
    const userRoles: string[] = user.roles ?? (user.role ? [user.role] : [])

    // If Super Admin, bypass all restrictions
    const isSuper = isSuperAdminUtil(user)

    if (!isSuper) {
      const roleAllowed = allowedRoles.some((role) => userRoles.includes(role))
      if (!roleAllowed) {
        redirect('/admin/forbidden')
        return null
      }

      if (requiredPermission && !canUtil(requiredPermission, user)) {
        redirect('/admin/forbidden')
        return null
      }
    }

    return user
  } catch {
    redirect('/login')
    return null
  }
}

export function isAdminRole(role: string | undefined): boolean {
  return ADMIN_ROLES.includes(role as AdminRole)
}

export default { requireAdmin, isAdminRole }
