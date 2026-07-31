import { redirect } from 'next/navigation';

export default function OldSellerListingsRedirect() {
  redirect('/seller/catalog');
}