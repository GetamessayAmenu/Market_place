import localFont from 'next/font/local'
import React from 'react'

import '../styles/globals.css'

import AppLayoutWrapper from '../components/AppLayoutWrapper'
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

export const metadata = {
  title: 'Habesha Market Admin',
  description: 'Administration panel for Ethiopian Fashion Marketplace',
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </Providers>
      </body>
    </html>
  )
}
