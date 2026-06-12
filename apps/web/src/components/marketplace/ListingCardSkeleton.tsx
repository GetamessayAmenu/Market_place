import { Skeleton } from '@marketplace/ui'

export default function ListingCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm" aria-hidden="true">
      <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
