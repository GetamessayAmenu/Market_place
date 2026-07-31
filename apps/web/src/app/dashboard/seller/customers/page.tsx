import { redirect } from 'next/navigation';

export default function OldSellerCustomersRedirect() {
  redirect('/seller/insights');
}