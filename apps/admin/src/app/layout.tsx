import { Inter, Playfair_Display } from 'next/font/google'
import React from 'react'

import '../styles/globals.css'

import AdminHeader from '../components/AdminHeader'
import AdminSidebar from '../components/AdminSidebar'
import Providers from '../providers/Providers'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})

export const metadata = {
  title: 'Habesha Market Admin',
  description: 'Administration panel for Ethiopian Fashion Marketplace',
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <AdminSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <AdminHeader />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
