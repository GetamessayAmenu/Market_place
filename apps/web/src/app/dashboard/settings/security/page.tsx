import { redirect } from 'next/navigation';

export default function SecuritySettingsPage() {
  redirect('/dashboard/settings?tab=security');
}
