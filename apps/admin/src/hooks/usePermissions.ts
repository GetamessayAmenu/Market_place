'use client';

import { useQuery } from '@tanstack/react-query';
import { me } from '../lib/authClient';
import { can as canUtil, hasRole as hasRoleUtil, isSuperAdmin as isSuperAdminUtil } from '../lib/permissions';

export function usePermissions() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['current-admin-user'],
    queryFn: me,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const can = (permission: string) => canUtil(permission, user);
  const hasRole = (role: string) => hasRoleUtil(role, user);
  const isSuperAdmin = isSuperAdminUtil(user);

  return {
    user,
    isLoading,
    error,
    can,
    hasRole,
    isSuperAdmin,
  };
}
