"use client"
import React from 'react'

export default function AdminHeader() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="text-lg font-semibold">Marketplace Admin</div>
        <div>
          <button className="px-3 py-1 bg-gray-700 rounded">Sign out</button>
        </div>
      </div>
    </header>
  )
}
