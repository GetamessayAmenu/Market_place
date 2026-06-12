import React from 'react'
import Container from '../../../components/Container'
import { serverGet } from '../../../lib/serverApi'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  try {
    const res = await serverGet(`/categories/${params.slug}`, { revalidate: 120 })
    const cat = res.data
    return { title: `${cat.name} — Category`, description: cat.description?.slice(0, 160) }
  } catch (e) {
    return { title: `Category: ${params.slug}` }
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = params
  const res = await serverGet(`/categories/${slug}`, { revalidate: 120 })
  const category = res.data

  return (
    <Container>
      <section className="py-8">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <div className="mt-6">{category.description}</div>
        <div className="mt-6">Category listings placeholder</div>
      </section>
    </Container>
  )
}
