import Link from 'next/link'

import Container from '../../components/Container'
import { serverGet } from '../../lib/serverApi'

interface CategoryData {
  id: string
  name: string
  nameAm?: string | null
  slug: string
  slugAm?: string | null
  description?: string | null
  descriptionAm?: string | null
  iconUrl?: string | null
  type: string
  children?: {
    id: string
    name: string
    nameAm?: string | null
    slug: string
  }[]
}

interface RegionalHubData {
  id: string
  name: string
  nameAm?: string | null
  description?: string | null
  descriptionAm?: string | null
  type: string
  city?: string | null
  cityAm?: string | null
  coordinates?: string | null
  isPopular: boolean
}

export async function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return {
    title: 'Categories — Ethiopian Fashion Marketplace',
    description: 'Browse our collection of traditional Ethiopian fashion categories including Habesha Kemis, Zuria, and more.',
    openGraph: {
      title: 'Categories — Ethiopian Fashion Marketplace',
      description: 'Browse our collection of traditional Ethiopian fashion categories.',
      url: `${siteUrl}/categories`,
      type: 'website',
    },
  }
}

export default async function CategoriesPage() {
  let categories: CategoryData[] = []
  let regionalHubs: RegionalHubData[] = []

  try {
    const [categoriesRes, hubsRes] = await Promise.allSettled([
      serverGet<CategoryData[]>('/categories', { revalidate: 300 }),
      serverGet<RegionalHubData[]>('/categories/regional-hubs/all', { revalidate: 300 }),
    ])

    if (categoriesRes.status === 'fulfilled') {
      categories = categoriesRes.value
    }
    if (hubsRes.status === 'fulfilled') {
      regionalHubs = hubsRes.value
    }
  } catch {
    // Graceful fallback
  }

  const popularHubs = regionalHubs.filter(h => h.isPopular).slice(0, 6)
  const allHubs = regionalHubs.slice(0, 12)

  return (
    <Container>
      <section className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse Categories</h1>
          <p className="text-lg text-muted-foreground">
            Explore our collection of traditional Ethiopian fashion and accessories
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Fashion Categories</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group block rounded-lg border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50"
                >
                  {category.iconUrl && (
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-3xl">{category.iconUrl}</span>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.nameAm && (
                    <p className="text-lg text-muted-foreground mt-1" dir="rtl">{category.nameAm}</p>
                  )}
                  {category.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                  )}
                  {category.children && category.children.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.children.slice(0, 3).map((child) => (
                        <span
                          key={child.id}
                          className="inline-flex items-center rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground"
                        >
                          {child.name}
                        </span>
                      ))}
                      {category.children.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground">
                          +{category.children.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center mb-12">
            <p className="text-muted-foreground">No categories available at the moment.</p>
          </div>
        )}

        {/* Regional Hubs */}
        {popularHubs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Popular Pickup Locations</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularHubs.map((hub) => (
                <div
                  key={hub.id}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {hub.name}
                        {hub.nameAm && <span className="ml-2 text-muted-foreground" dir="rtl">{hub.nameAm}</span>}
                      </h3>
                      {hub.city && (
                        <p className="text-sm text-muted-foreground">
                          {hub.city}
                          {hub.cityAm && <span className="ml-1" dir="rtl">{hub.cityAm}</span>}
                        </p>
                      )}
                      {hub.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{hub.description}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      Popular
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Regional Hubs */}
        {allHubs.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">All Pickup Locations</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {allHubs.map((hub) => (
                <div
                  key={hub.id}
                  className="rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-semibold text-foreground">
                    {hub.name}
                    {hub.nameAm && <span className="ml-1 text-muted-foreground text-sm" dir="rtl">{hub.nameAm}</span>}
                  </h3>
                  {hub.city && (
                    <p className="text-sm text-muted-foreground">
                      {hub.city}
                      {hub.cityAm && <span className="ml-1" dir="rtl">{hub.cityAm}</span>}
                    </p>
                  )}
                  <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-accent text-accent-foreground capitalize">
                    {hub.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </Container>
  )
}
