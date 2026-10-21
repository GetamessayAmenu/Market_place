import { redirect } from 'next/navigation';

export default function StoreRedirectPage() {
  redirect('/seller/settings?tab=store');
}
