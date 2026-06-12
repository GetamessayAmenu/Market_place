import '../styles/globals.css'
import React from 'react'

import PublicLayout from '../components/layouts/PublicLayout'
import Providers from '../providers/Providers'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Marketplace — Buy and Sell Locally',
    template: '%s',
  },
  description: 'Find great local deals. Buy and sell with confidence on our marketplace.',
  openGraph: {
    siteName: 'Marketplace',
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PublicLayout>{children}</PublicLayout>
        </Providers>
      </body>
    </html>
  )
}
