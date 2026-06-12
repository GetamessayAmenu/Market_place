import { NextResponse } from 'next/server'
import { serverGet } from '../../lib/serverApi'

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await serverGet('/listings?limit=200')
    const items = res.data || []
    const urls = items.map((it: any) => `${siteUrl}/listings/${it.id}`)
    const staticUrls = [
      `${siteUrl}/`,
      `${siteUrl}/search`,
    ]
    const all = [...staticUrls, ...urls]
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url><loc>${u}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`
  )
  .join('\n')}
</urlset>`

    return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } })
  } catch (err) {
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}
