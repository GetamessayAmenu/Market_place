import React from 'react'

import DashboardLayoutComponent from '../../components/layouts/DashboardLayout'
import { requireUser } from '../../lib/authServer'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <DashboardLayoutComponent {...(user != null && { user })}>
      {children}
    </DashboardLayoutComponent>
  )
}
