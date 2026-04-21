'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch, isUserAuthenticated, logoutUser } from '@/lib/userAuth'

export default function SettingsPage() {
  const router = useRouter()
  const [isPublished, setIsPublished] = useState(false)
  const [username, setUsername] = useState('')
  const [publishLoading, setPublishLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!isUserAuthenticated()) return
    Promise.all([
      authFetch('/api/user/portfolio').then((r) => r.ok ? r.json() : Promise.reject(new Error('portfolio'))),
      authFetch('/api/auth/user/me').then((r) => r.ok ? r.json() : Promise.reject(new Error('me'))),
    ])
      .then(([portfolio, me]) => {
        setIsPublished(portfolio.data?.isPublished ?? false)
        setUsername(me.data?.username ?? '')
      })
      .catch(() => setLoadError('無法載入設定資料，請重新整理頁面'))
  }, [])

  async function togglePublish() {
    if (!isPublished) {
      setShowConfirm(true)
      return
    }
    await updatePublish(false)
  }

  async function confirmPublish() {
    setShowConfirm(false)
    await updatePublish(true)
  }

  async function updatePublish(value: boolean) {
    setPublishLoading(true)
    try {
      const res = await authFetch('/api/user/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: value }),
      })
      if (res.ok) setIsPublished(value)
    } finally {
      setPublishLoading(false)
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setPwMessage(null)
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setPwSaving(true)
    try {
      const res = await authFetch('/api/user/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPwMessage({ type: 'error', text: json.error || 'Failed to change password' })
      } else {
        setPwMessage({ type: 'success', text: 'Password changed successfully' })
        setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      }
    } catch {
      setPwMessage({ type: 'error', text: 'Network error' })
    } finally {
      setPwSaving(false)
    }
  }

  async function logout() {
    await logoutUser()
    router.push('/login')
  }

  const portfolioUrl = typeof window !== 'undefined' ? `${window.location.origin}/u/${username}` : `/u/${username}`

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {loadError && (
        <div className="text-sm rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-red-700">
          {loadError}
        </div>
      )}

      {/* Publish toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-medium text-gray-900 mb-1">Portfolio Visibility</h2>
        <p className="text-sm text-gray-500 mb-4">
          {isPublished
            ? 'Your portfolio is publicly visible.'
            : 'Your portfolio is private. Publish it to share with others.'}
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={togglePublish}
            disabled={publishLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPublished ? 'bg-green-500' : 'bg-gray-300'
            } disabled:opacity-50`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublished ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {isPublished ? 'Published' : 'Unpublished'}
          </span>
        </div>
        {isPublished && (
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline mt-3 inline-block"
          >
            {portfolioUrl} →
          </a>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Publish portfolio?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your portfolio will be publicly visible at:
              <br />
              <span className="font-mono text-blue-600 text-xs break-all">{portfolioUrl}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmPublish}
                className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium"
              >
                Publish
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-medium text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4 max-w-md">
          {(['currentPassword', 'newPassword', 'confirm'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={pwForm[field]}
                onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
                required
                minLength={field !== 'currentPassword' ? 8 : 1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          {pwMessage && (
            <div
              className={`text-sm rounded-lg px-4 py-3 ${
                pwMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {pwMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {pwSaving ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-medium text-gray-900 mb-1">Sign Out</h2>
        <p className="text-sm text-gray-500 mb-4">Sign out of your portfolio dashboard.</p>
        <button
          onClick={logout}
          className="text-sm px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
