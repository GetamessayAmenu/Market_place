import '../styles/globals.css'
import React from 'react'
import Providers from '../providers/Providers'
import AdminHeader from '../components/AdminHeader'
import AdminSidebar from '../components/AdminSidebar'

export const metadata = {
  title: 'Marketplace Admin',
  description: 'Administration panel for Marketplace',
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <AdminHeader />
            <div className="flex flex-1">
              <AdminSidebar />
              <main className="flex-1 p-4">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
