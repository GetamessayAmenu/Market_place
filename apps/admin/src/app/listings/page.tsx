'use client'

import React from 'react'

import ListingsTable from '../../components/admin/ListingsTable'

export default function ListingsPage() {
  const initialData = { success: true, data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listings Moderation</h1>
        <p className="text-muted-foreground">Review and moderate all marketplace listings.</p>
      </div>
      <ListingsTable initialData={initialData} />
    </div>
  )
}



