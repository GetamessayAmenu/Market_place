import { redirect } from 'next/navigation';

export default function OldSellerOrdersRedirect() {
  redirect('/seller/orders');
}