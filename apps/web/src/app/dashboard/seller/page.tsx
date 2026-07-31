import { redirect } from 'next/navigation';

export default function OldSellerDashboardRedirect() {
  redirect('/seller/dashboard');
}