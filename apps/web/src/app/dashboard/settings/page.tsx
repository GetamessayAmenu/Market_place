"use client"
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import useAuth from '../../../hooks/useAuth'
import { apiPost } from '../../../lib/api'

type FormData = { name?: string; email?: string }

export default function SettingsPage() {
  const user = useAuth((s: any) => s.user)
  const { register, handleSubmit, reset } = useForm<FormData>()

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email })
  }, [user, reset])

  async function onSubmit(data: FormData) {
    try {
      await apiPost(`/users/${user?.id}`, data)
      alert('Profile updated')
    } catch (e: any) {
      alert('Failed to update')
    }
  }

  if (!user) return <div className="py-8">Please log in.</div>

  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold">Profile Settings</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-md space-y-4">
        <div>
          <label className="block text-sm">Name</label>
          <input {...register('name')} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input {...register('email')} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  )
}
