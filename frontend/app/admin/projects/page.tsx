'use client';

import { useEffect, useState } from 'react';
import { getToken, api } from '@/lib/api';
import type { Project } from '@/lib/types';
import { Plus, Pencil, Trash2, X, Save, Upload } from 'lucide-react';

const emptyForm = { title: '', category: '', briefDesc: '', tags: '', imageUrl: '', impact: '', year: new Date().getFullYear(), status: 'DRAFT' as 'PUBLISHED' | 'DRAFT' };

export default function ProjectsAdmin() {
  const [items, setItems] = useState<Project[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => api.getProjects().then(d => { setItems(d.projects ?? []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (p: Project) => {
    setForm({ title: p.title, category: p.category, briefDesc: p.briefDesc, tags: p.tags.join(', '), imageUrl: p.imageUrl ?? '', impact: p.impact ?? '', year: p.year, status: p.status });
    setEditId(p.id);
    setModal('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getToken()!;
    const { tags, year, ...rest } = form;
    const payload = { ...rest, tags: tags.split(',').map(t => t.trim()).filter(Boolean), year: Number(year) };
    try {
      if (modal === 'create') {
        await api.adminFetch('/api/projects', token, { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await api.adminFetch(`/api/projects/${editId}`, token, { method: 'PUT', body: JSON.stringify(payload) });
      }
      await load();
      setModal(null);
    } catch { alert('儲存失敗'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此作品？')) return;
    await api.adminFetch(`/api/projects/${id}`, getToken()!, { method: 'DELETE' });
    setItems(p => p.filter(i => i.id !== id));
  };

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getToken();
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(p => ({ ...p, imageUrl: data.url }));
    } catch { alert('上傳失敗'); }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">作品集</h1>
          <p className="text-gray-400 text-sm mt-1">{items.length} 個作品</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          <Plus size={14} /> 新增作品
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
              <div className="h-32 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  : <span className="text-4xl text-gray-200 font-light">{item.title[0]}</span>}
              </div>
              <div className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1">{item.title}</h3>
                  {item.status === 'PUBLISHED' && <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded-full border border-green-100">已發布</span>}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">{item.briefDesc}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map(t => (
                    <span key={t} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-400 text-xs rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 flex-1">{item.year}</span>
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? '新增作品' : '編輯作品'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="標題 *" value={form.title} onChange={set('title')} required />
              <Field label="分類 *" value={form.category} onChange={set('category')} required placeholder="Web App, Mobile..." />
              <Field label="年份" value={String(form.year)} onChange={set('year')} placeholder="2024" />
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">狀態</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'PUBLISHED' | 'DRAFT' }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors">
                  <option value="DRAFT">草稿</option>
                  <option value="PUBLISHED">已發布</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">簡短描述 *</label>
              <textarea required rows={3} value={form.briefDesc} onChange={set('briefDesc')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
            </div>
            <Field label="技術標籤 (逗號分隔)" value={form.tags} onChange={set('tags')} placeholder="React, Node.js, PostgreSQL" />
            <Field label="成果/影響" value={form.impact} onChange={set('impact')} placeholder="提升效能 30%" />
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">專案圖片</label>
              <div className="flex gap-2">
                <input type="text" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                <label className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-100 cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap">
                  <Upload size={12} /> 上傳
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" className="mt-2 h-20 rounded-lg object-cover border border-gray-200" />
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
                <Save size={14} /> {saving ? '儲存中...' : '儲存'}
              </button>
              <button type="button" onClick={() => setModal(null)}
                className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                取消
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: {
  label: string; value: string; onChange: (e: any) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors" />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
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
