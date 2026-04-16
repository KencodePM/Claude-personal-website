'use client'

import { useEffect, useState } from 'react'
import { getToken } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface PortfolioUserRow {
  id: string
  email: string
  username: string
  displayName: string
  createdAt: string
  portfolio: { isPublished: boolean } | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<PortfolioUserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    fetch(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => {
        setUsers(j.data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Portfolio Users</h1>
        <span className="text-sm text-gray-500">{users.length} total</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-500">No users yet. Share an invite code to get started.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.displayName}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/u/${user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-500 hover:underline"
                    >
                      @{user.username}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {user.portfolio?.isPublished ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
