'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUserToken } from '@/lib/userAuth'

interface UserData {
  id: string
  email: string
  username: string
  displayName: string
  portfolio: { isPublished: boolean } | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
    const token = getUserToken()
    if (!token) return
    fetch('/api/auth/user/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load profile')))
      .then((j) => setUser(j.data))
      .catch(() => {})
  }, [])

  function copyUrl() {
    if (!user) return
    navigator.clipboard.writeText(`${origin}/u/${user.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user) {
    return <div className="text-sm text-gray-400">Loading…</div>
  }

  const portfolioUrl = `${origin}/u/${user.username}`
  const isPublished = user.portfolio?.isPublished ?? false

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user.displayName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      {/* Portfolio URL */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Your Portfolio URL</p>
        <div className="flex items-center gap-3">
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 font-mono text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg truncate hover:underline"
          >
            {portfolioUrl}
          </a>
          <button
            onClick={copyUrl}
            className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {!isPublished && (
          <p className="text-xs text-amber-600 mt-2">
            Your portfolio is not published yet.{' '}
            <Link href="/dashboard/settings" className="underline">
              Go to Settings
            </Link>{' '}
            to publish it.
          </p>
        )}
        {isPublished && (
          <p className="text-xs text-green-600 mt-2">Published · visible to everyone</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { href: '/dashboard/portfolio', label: 'Edit Portfolio', desc: 'Update your sections and content' },
          { href: '/dashboard/seo', label: 'SEO Settings', desc: 'Customize title, description, OG image' },
          { href: '/dashboard/profile', label: 'Profile', desc: 'Change your display name' },
          { href: '/dashboard/settings', label: 'Settings', desc: 'Publish toggle and password' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
          >
            <p className="font-medium text-gray-900 text-sm">{item.label}</p>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
