'use client';

import { useEffect, useState } from 'react';
import { getToken, api } from '@/lib/api';
import { Save, Upload } from 'lucide-react';

const API_URL = '';

export default function ProfileAdmin() {
  const [form, setForm] = useState({
    name: '', title: '', bio: '', email: '', phone: '', location: '',
    avatar: '', resumeUrl: '', githubUrl: '', linkedinUrl: '', twitterUrl: '', websiteUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getProfile().then(p => { setForm(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getToken();
    try {
      await api.adminFetch('/api/profile', token!, { method: 'PUT', body: JSON.stringify(form) });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch { setStatus('error'); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'resumeUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const token = getToken();
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      setForm(p => ({ ...p, [field]: data.url }));
    } catch { alert('上傳失敗'); }
    finally { setUploading(false); }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">個人資料</h1>
        <p className="text-gray-400 text-sm mt-1">管理您的公開個人介紹資訊</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">頭像與履歷</h2>
          <div className="flex items-center gap-5 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-3xl text-gray-200 font-light shrink-0">
              {form.avatar ? <img src={form.avatar} alt="" className="w-full h-full object-cover" /> : (form.name[0] || '?')}
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5">頭像 URL 或上傳</label>
              <div className="flex gap-2">
                <input type="text" value={form.avatar} onChange={set('avatar')}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="https://..." />
                <label className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-100 cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload size={12} />
                  上傳
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'avatar')} />
                </label>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">履歷 URL 或上傳 PDF</label>
            <div className="flex gap-2">
              <input type="text" value={form.resumeUrl} onChange={set('resumeUrl')}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="https://..." />
              <label className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-100 cursor-pointer flex items-center gap-1.5 transition-colors">
                <Upload size={12} />
                上傳
                <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileUpload(e, 'resumeUrl')} />
              </label>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">基本資訊</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="姓名 *" value={form.name} onChange={set('name')} required />
            <Field label="職稱 *" value={form.title} onChange={set('title')} required />
            <Field label="電子郵件 *" value={form.email} onChange={set('email')} required type="email" />
            <Field label="電話" value={form.phone} onChange={set('phone')} />
            <Field label="所在地" value={form.location} onChange={set('location')} />
          </div>
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1.5">個人簡介 *</label>
            <textarea required rows={4} value={form.bio} onChange={set('bio')}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
          </div>
        </div>

        {/* Social links */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">社群連結</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="GitHub URL" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/..." />
            <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/..." />
            <Field label="Twitter URL" value={form.twitterUrl} onChange={set('twitterUrl')} placeholder="https://twitter.com/..." />
            <Field label="個人網站 URL" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://..." />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <Save size={14} />
            {saving ? '儲存中...' : '儲存變更'}
          </button>
          {status === 'saved' && <span className="text-sm text-green-600">✓ 已儲存</span>}
          {status === 'error' && <span className="text-sm text-red-500">儲存失敗</span>}
          {uploading && <span className="text-sm text-gray-400">上傳中...</span>}
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required, type = 'text', placeholder }: {
  label: string; value: string; onChange: (e: any) => void;
  required?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors" />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );
}
