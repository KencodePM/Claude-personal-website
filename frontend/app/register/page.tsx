'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setUserToken } from '@/lib/userAuth'

function inviteCodeErrorMessage(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('invalid') || lower.includes('already used') || lower.includes('invite')) {
    return '邀請碼無效或已被使用，請聯繫管理員取得新邀請碼'
  }
  if (lower.includes('email already')) return '此 Email 已被使用'
  if (lower.includes('username already')) return '此用戶名已被使用'
  if (lower.includes('validation')) return '請檢查填寫的資料是否正確'
  return raw
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
    inviteCode: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ username: string } | null>(null)

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((f) => ({
      ...f,
      [name]: name === 'username' ? value.toLowerCase() : value,
    }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          inviteCode: form.inviteCode.toUpperCase(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(inviteCodeErrorMessage(json.error || 'Registration failed'))
        return
      }
      setUserToken(json.data.token)
      setSuccess({ username: json.data.user.username })
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setError('無法連線到伺服器，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">帳號建立成功！</h2>
          <p className="text-sm text-gray-500 mb-4">您的作品集網址：</p>
          <p className="font-mono text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded">
            {typeof window !== 'undefined' ? window.location.origin : ''}/u/{success.username}
          </p>
          <p className="text-xs text-gray-400 mt-4">正在跳轉到 Dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">建立作品集帳號</h1>
        <p className="text-sm text-gray-500 mb-6">需要邀請碼才能申請</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邀請碼
            </label>
            <input
              name="inviteCode"
              value={form.inviteCode}
              onChange={onChange}
              required
              maxLength={8}
              placeholder="ABCD1234"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">請向管理員索取邀請碼</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">顯示名稱</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={onChange}
              required
              placeholder="王小明"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用戶名</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">
                /u/
              </span>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                required
                minLength={3}
                maxLength={30}
                pattern="^[a-z0-9-]+$"
                placeholder="wang-xiaoming"
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              只能使用小寫英文、數字、連字號
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              placeholder="wang@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              minLength={8}
              placeholder="至少 8 個字元"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? '建立中…' : '建立帳號'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          已有帳號？{' '}
          <Link href="/login" className="text-blue-500 hover:underline">
            登入
          </Link>
        </p>
      </div>
    </div>
  )
}
