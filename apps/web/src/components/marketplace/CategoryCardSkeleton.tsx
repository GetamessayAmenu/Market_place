import { Skeleton } from '@marketplace/ui'

export default function CategoryCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm" aria-hidden="true">
      <Skeleton className="aspect-[3/2] w-full rounded-t-lg" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}
