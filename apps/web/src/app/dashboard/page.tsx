import { redirect } from 'next/navigation';
import { requireUser } from '../../lib/authServer';

const ADMIN_APP_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3003';

export default async function DashboardPage() {
  const user = await requireUser();

  // Admin users should be redirected to admin app
  const userRoles = user.roles ?? (user.role ? [user.role] : []);
  const adminRoles = ['admin', 'super_admin', 'moderator', 'support'];
  const isAdmin = userRoles.some((role: string) => adminRoles.includes(role));

  if (isAdmin) {
    redirect(ADMIN_APP_URL);
  }

  if (user.role === 'seller') {
    redirect('/dashboard/seller');
  }

  if (user.role === 'buyer') {
    redirect('/dashboard/custom-orders');
  }

  // Default fallback
  redirect('/dashboard/seller');
}
