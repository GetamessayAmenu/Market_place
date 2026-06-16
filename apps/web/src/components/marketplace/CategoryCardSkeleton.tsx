import { Skeleton } from '@marketplace/ui'

export default function CategoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl shadow-sm" aria-hidden="true">
      <div className="relative aspect-[3/2] w-full bg-muted">
        <Skeleton className="h-full w-full rounded-none" />
        {/* Overlay content */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <Skeleton className="h-5 w-2/3 bg-white/20" />
          <Skeleton className="mt-1.5 h-3 w-1/3 bg-white/20" />
        </div>
      </div>
    </div>
  )
}
