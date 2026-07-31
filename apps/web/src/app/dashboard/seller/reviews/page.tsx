import { redirect } from 'next/navigation';

export default function OldSellerReviewsRedirect() {
  redirect('/seller/insights');
}