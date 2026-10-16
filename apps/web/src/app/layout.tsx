import localFont from 'next/font/local'
import React from 'react'

import '../styles/globals.css'

import PublicLayout from '../components/layouts/PublicLayout'
import Providers from '../providers/Providers'

const inter = localFont({
  src: '../fonts/Inter-Variable.woff2',
  display: 'swap',
  variable: '--font-body',
})

const playfair = localFont({
  src: '../fonts/PlayfairDisplay-Variable.woff2',
  display: 'swap',
  variable: '--font-display',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Habesha Market — Ethiopian Fashion Marketplace',
    template: '%s | Habesha Market',
  },
  description: 'Buy, rent, and order custom Ethiopian fashion. Discover designers, tailors, and boutiques on the premier Ethiopian fashion marketplace.',
  openGraph: {
    siteName: 'Habesha Market',
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <PublicLayout>{children}</PublicLayout>
        </Providers>
      </body>
    </html>
  )
}
