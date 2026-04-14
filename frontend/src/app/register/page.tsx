'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setUserToken } from '@/lib/userAuth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
      const res = await fetch(`${API}/api/auth/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          inviteCode: form.inviteCode.toUpperCase(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Registration failed')
        return
      }
      setUserToken(json.data.token)
      setSuccess({ username: json.data.user.username })
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome aboard!</h2>
          <p className="text-sm text-gray-500 mb-4">Your portfolio URL:</p>
          <p className="font-mono text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded">
            {typeof window !== 'undefined' ? window.location.origin : ''}/u/{success.username}
          </p>
          <p className="text-xs text-gray-400 mt-4">Redirecting to dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create your portfolio</h1>
        <p className="text-sm text-gray-500 mb-6">Invite code required</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Code
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={onChange}
              required
              placeholder="Jane Doe"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
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
                placeholder="jane-doe"
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Lowercase letters, numbers, and hyphens only
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
              placeholder="jane@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
