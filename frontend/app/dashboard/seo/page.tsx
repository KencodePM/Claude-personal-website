'use client'

import { useEffect, useState, FormEvent } from 'react'
import { getUserToken } from '@/lib/userAuth'

export default function SeoPage() {
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [ogImageUrl, setOgImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const token = getUserToken()
    if (!token) return
    fetch('/api/user/portfolio', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then((j) => {
        setSeoTitle(j.data?.seoTitle || '')
        setSeoDescription(j.data?.seoDescription || '')
        setOgImageUrl(j.data?.ogImageUrl || '')
      })
      .catch(() => setMessage({ type: 'error', text: '無法載入 SEO 設定，請重新整理' }))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const token = getUserToken()
      const res = await fetch('/api/user/portfolio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          ogImageUrl: ogImageUrl || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: json.error || 'Failed to save' })
      } else {
        setMessage({ type: 'success', text: 'SEO settings saved' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">SEO Settings</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <form onSubmit={onSubmit} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Title
            </label>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={70}
              placeholder="Jane Doe — Product Manager"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">{seoTitle.length}/70 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Experienced product manager specializing in…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{seoDescription.length}/160 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OG Image URL
            </label>
            <input
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://example.com/og-image.png"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Recommended size: 1200×630px
            </p>
            {ogImageUrl && (
              <img
                src={ogImageUrl}
                alt="OG preview"
                className="mt-3 rounded-lg border border-gray-200 max-h-40 object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
          </div>

          {message && (
            <div
              className={`text-sm rounded-lg px-4 py-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save SEO Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
