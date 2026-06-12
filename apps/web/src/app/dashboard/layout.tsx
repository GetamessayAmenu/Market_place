import React from 'react'
import { requireUser } from '../../lib/authServer'
import { DashboardLayout as DashboardLayoutComponent } from '../../components/layouts/DashboardLayout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
}
