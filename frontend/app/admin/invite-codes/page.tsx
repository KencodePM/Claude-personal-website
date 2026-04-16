'use client'

import { useEffect, useState } from 'react'
import { getToken, api } from '@/lib/api'
import { Copy, Check } from 'lucide-react'

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
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function fetchCodes() {
    const token = getToken()
    if (!token) return
    try {
      const data = await api.adminFetch<InviteCode[]>('/api/admin/invite-codes', token)
      setCodes(Array.isArray(data) ? data : [])
    } catch {
      setError('無法載入邀請碼列表，請重新整理')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCodes() }, [])

  async function generate() {
    const token = getToken()
    if (!token) { setError('請先登入'); return }
    setGenerating(true)
    setError('')
    try {
      await api.adminFetch('/api/admin/invite-codes', token, {
        method: 'POST',
        body: JSON.stringify({ count: 1 }),
      })
      await fetchCodes()
    } catch (e: any) {
      setError(e?.message || '生成邀請碼失敗，請重試')
    } finally {
      setGenerating(false)
    }
  }

  async function deleteCode(id: string) {
    if (!confirm('確定刪除此邀請碼？')) return
    const token = getToken()
    if (!token) { setError('請先登入'); return }
    try {
      await api.adminFetch(`/api/admin/invite-codes/${id}`, token, { method: 'DELETE' })
      setCodes((prev) => prev.filter((c) => c.id !== id))
    } catch (e: any) {
      setError(e?.message || '刪除失敗')
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const available = codes.filter(c => !c.usedAt).length
  const used = codes.filter(c => c.usedAt).length

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">邀請碼管理</h1>
          <p className="text-gray-400 text-sm mt-1">
            {available} 個可用 · {used} 個已使用
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="bg-gray-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {generating ? '生成中…' : '+ 生成邀請碼'}
        </button>
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
      ) : codes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">還沒有邀請碼，點擊右上角生成第一個</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">邀請碼</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">建立時間</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">使用者</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">狀態</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900 tracking-widest">
                        {code.code}
                      </span>
                      <button
                        onClick={() => copyCode(code.code, code.id)}
                        className="text-gray-300 hover:text-gray-600 transition-colors"
                        title="複製邀請碼"
                      >
                        {copiedId === code.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(code.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {code.portfolioUser ? (
                      <span>
                        {code.portfolioUser.email}{' '}
                        <a
                          href={`/u/${code.portfolioUser.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          @{code.portfolioUser.username}
                        </a>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {code.usedAt ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        已使用
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        可使用
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!code.usedAt && (
                      <button
                        onClick={() => deleteCode(code.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        刪除
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
