import { Skeleton } from '@marketplace/ui'

export default function SellerCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm" aria-hidden="true">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Skeleton className="h-14 w-14 flex-shrink-0" circle />
        <div className="flex-1 space-y-2">
          {/* Name */}
          <Skeleton className="h-5 w-2/3" />
          {/* Type badge */}
          <Skeleton className="h-5 w-16 rounded-full" />
          {/* Rating */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-10" />
          </div>
          {/* Location */}
          <Skeleton className="h-3 w-1/2" />
          {/* Specialty tags */}
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
