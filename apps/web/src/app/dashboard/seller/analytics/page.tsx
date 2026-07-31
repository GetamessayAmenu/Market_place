import { redirect } from 'next/navigation';

export default function OldSellerAnalyticsRedirect() {
  redirect('/seller/insights');
}