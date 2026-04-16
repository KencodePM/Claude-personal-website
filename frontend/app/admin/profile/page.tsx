'use client';

import { useEffect, useState } from 'react';
import { getToken, api } from '@/lib/api';
import { Save } from 'lucide-react';

export default function ProfileAdmin() {
  const [form, setForm] = useState({
    nameCn: '', nameEn: '', title: '', location: '', email: '', phone: '',
    bio: '', heroSubtitle: '', linkedinUrl: '', githubUrl: '', resumeUrl: '',
    stat1Num: '', stat1Label: '', stat2Num: '', stat2Label: '', stat3Num: '', stat3Label: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    api.getProfile().then(p => {
      if (p) setForm({
        nameCn: p.nameCn || '',
        nameEn: p.nameEn || '',
        title: p.title || '',
        location: p.location || '',
        email: p.email || '',
        phone: p.phone || '',
        bio: p.bio || '',
        heroSubtitle: p.heroSubtitle || '',
        linkedinUrl: p.linkedinUrl || '',
        githubUrl: p.githubUrl || '',
        resumeUrl: p.resumeUrl || '',
        stat1Num: p.stat1Num || '',
        stat1Label: p.stat1Label || '',
        stat2Num: p.stat2Num || '',
        stat2Label: p.stat2Label || '',
        stat3Num: p.stat3Num || '',
        stat3Label: p.stat3Label || '',
      });
      setLoading(false);
    }).catch(() => setLoading(false));
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
        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">基本資訊</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="姓名(中文) *" value={form.nameCn} onChange={set('nameCn')} required />
            <Field label="Name(EN) *" value={form.nameEn} onChange={set('nameEn')} required />
            <Field label="職稱 *" value={form.title} onChange={set('title')} required />
            <Field label="電子郵件 *" value={form.email} onChange={set('email')} required type="email" />
            <Field label="電話" value={form.phone} onChange={set('phone')} />
            <Field label="所在地" value={form.location} onChange={set('location')} />
            <div className="sm:col-span-2">
              <Field label="英雄區副標" value={form.heroSubtitle} onChange={set('heroSubtitle')} />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">個人簡介</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">個人簡介 *</label>
            <textarea required rows={4} value={form.bio} onChange={set('bio')}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
          </div>
        </div>

        {/* Social links */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">社群連結</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/..." />
            <Field label="GitHub URL" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/..." />
            <div className="sm:col-span-2">
              <Field label="履歷 URL" value={form.resumeUrl} onChange={set('resumeUrl')} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">統計數字</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="統計 1 數值" value={form.stat1Num} onChange={set('stat1Num')} placeholder="e.g. 5+" />
            <Field label="統計 1 標籤" value={form.stat1Label} onChange={set('stat1Label')} placeholder="e.g. 年工作經驗" />
            <Field label="統計 2 數值" value={form.stat2Num} onChange={set('stat2Num')} placeholder="e.g. 30+" />
            <Field label="統計 2 標籤" value={form.stat2Label} onChange={set('stat2Label')} placeholder="e.g. 完成專案" />
            <Field label="統計 3 數值" value={form.stat3Num} onChange={set('stat3Num')} placeholder="e.g. 10+" />
            <Field label="統計 3 標籤" value={form.stat3Label} onChange={set('stat3Label')} placeholder="e.g. 合作客戶" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <Save size={14} />
            {saving ? '儲存中...' : '儲存變更'}
          </button>
          {status === 'saved' && <span className="text-sm text-green-600">✓ 已儲存</span>}
          {status === 'error' && <span className="text-sm text-red-500">儲存失敗</span>}
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
