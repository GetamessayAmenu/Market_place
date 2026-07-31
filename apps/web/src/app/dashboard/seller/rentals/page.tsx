import { redirect } from 'next/navigation';

export default function OldSellerRentalsRedirect() {
  redirect('/seller/orders');
}