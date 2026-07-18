import Link from 'next/link'

export default function AdminForbidden() {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-muted p-6">
      <div className="max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-md">
        <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Forbidden</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Insufficient privileges</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your current account does not have permission to view this page.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted">
            Return home
          </Link>
        </div>
      </div>
    </div>
  )
}
