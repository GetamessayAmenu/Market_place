import { redirect } from 'next/navigation';

export default function OldSellerListingDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/seller/catalog?listing=${params.id}`);
}