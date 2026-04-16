'use client'

import { useEffect, useState } from 'react'
import { getToken, api } from '@/lib/api'
import { ExternalLink } from 'lucide-react'

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
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) return
    api.adminFetch<PortfolioUserRow[]>('/api/admin/users', token)
      .then((data) => {
        setUsers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setError('無法載入用戶列表，請重新整理')
        setLoading(false)
      })
  }, [])

  const published = users.filter(u => u.portfolio?.isPublished).length

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用戶列表</h1>
          <p className="text-gray-400 text-sm mt-1">
            {users.length} 位用戶 · {published} 個已發布作品集
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">還沒有用戶，先生成邀請碼並分享給申請人</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">顯示名稱</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">用戶名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">申請時間</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">作品集狀態</th>
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
                      className="font-mono text-blue-500 hover:underline flex items-center gap-1"
                    >
                      @{user.username}
                      <ExternalLink size={11} />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-4 py-3">
                    {user.portfolio?.isPublished ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        已發布
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        草稿
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
