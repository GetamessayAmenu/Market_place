import ListingCardSkeleton from './ListingCardSkeleton'

interface ProductGridSkeletonProps {
  count?: number
}

export default function ProductGridSkeleton({ count = 10 }: ProductGridSkeletonProps) {
  return (
    <div
      className="grid grid-cols-2 gap-4 fashion-sm:grid-cols-3 fashion-md:grid-cols-4 fashion-xl:grid-cols-5"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}
