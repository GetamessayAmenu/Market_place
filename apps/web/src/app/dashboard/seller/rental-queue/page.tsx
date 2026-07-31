import { redirect } from 'next/navigation';

export default function OldSellerRentalQueueRedirect() {
  redirect('/seller/orders');
}