import { redirect } from 'next/navigation';

export default function OldSellerMessagesRedirect() {
  redirect('/seller/messages');
}