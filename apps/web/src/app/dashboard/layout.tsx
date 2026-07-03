import React from 'react'

import DashboardLayoutComponent from '../../components/layouts/DashboardLayout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayoutComponent hideHeader>
      {children}
    </DashboardLayoutComponent>
  )
}
