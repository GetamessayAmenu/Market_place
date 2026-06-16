import { Skeleton } from '@marketplace/ui'

export default function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-hidden="true">
      {/* Image - 3:4 aspect ratio matching new ListingCard */}
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="space-y-3 p-3">
        {/* Designer row: avatar + name */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" circle />
          <Skeleton className="h-3 w-20" />
        </div>
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        {/* Price + type tag */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}
