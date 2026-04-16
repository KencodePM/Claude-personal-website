'use client'

import { useEffect, useState } from 'react'
import { getToken } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface InviteCode {
  id: string
  code: string
  createdAt: string
  usedAt: string | null
  portfolioUser: { email: string; username: string } | null
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  async function fetchCodes() {
    const token = getToken()
    const res = await fetch(`${API}/api/admin/invite-codes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    setCodes(json.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCodes()
  }, [])

  async function generate() {
    setGenerating(true)
    try {
      const token = getToken()
      await fetch(`${API}/api/admin/invite-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ count: 1 }),
      })
      await fetchCodes()
    } finally {
      setGenerating(false)
    }
  }

  async function deleteCode(id: string) {
    const token = getToken()
    await fetch(`${API}/api/admin/invite-codes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setCodes((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Invite Codes</h1>
        <button
          onClick={generate}
          disabled={generating}
          className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Generating…' : '+ Generate Code'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-sm text-gray-500">No invite codes yet. Generate one to get started.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Used By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{code.code}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(code.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {code.portfolioUser ? (
                      <span>
                        {code.portfolioUser.email}{' '}
                        <span className="text-gray-400">(@{code.portfolioUser.username})</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {code.usedAt ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Used</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Available</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!code.usedAt && (
                      <button
                        onClick={() => deleteCode(code.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
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
