import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirecting...',
};

interface OldSellerCreatePageProps {
  searchParams: {
    category?: string;
  };
}

export default function OldSellerCreateRedirect({ searchParams }: OldSellerCreatePageProps) {
  const { category } = searchParams;
  const targetUrl = category ? `/seller/catalog?category=${category}` : '/seller/catalog';
  redirect(targetUrl);
}