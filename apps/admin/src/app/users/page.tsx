import React from 'react'
import { requireAdmin } from '../../lib/authServer'
import { serverGet } from '../../lib/serverApi'
import Container from '../../components/Container'

export default async function UsersPage() {
  await requireAdmin()
  let users: any[] = []
  try {
    const res = await serverGet('/users?page=1&limit=20')
    users = res.data || []
  } catch (e) {
    users = []
  }

  return (
    <Container>
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      <div className="bg-white rounded shadow p-4">
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  )
}
