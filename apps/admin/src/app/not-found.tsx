import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="rounded-xl border bg-white p-8 shadow-sm max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">404 - Page Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">
          The admin page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/admin/moderation-reports"
          className="inline-block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
