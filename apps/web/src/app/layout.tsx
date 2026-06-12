import '../styles/globals.css'
import React from 'react'
import Providers from '../providers/Providers'
import { PublicLayout } from '../components/layouts/PublicLayout'

export const metadata = {
  title: 'Marketplace',
  description: 'Local marketplace for buyers and sellers',
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
