import { redirect } from 'next/navigation';

export default function OldSellerListingEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/seller/catalog?listing=${params.id}`);
}