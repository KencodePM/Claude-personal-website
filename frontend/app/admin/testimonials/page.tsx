'use client';

import { useEffect, useState } from 'react';
import { getToken, api } from '@/lib/api';
import type { Testimonial } from '@/lib/types';
import { Plus, Pencil, Trash2, X, Save, Star } from 'lucide-react';

const empty = { name: '', role: '', company: '', content: '', avatar: '', rating: 5, featured: true };

export default function TestimonialsAdmin() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState(empty as any);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => api.getTestimonials().then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setModal('create'); };
  const openEdit = (item: Testimonial) => { setForm(item); setEditId(item.id); setModal('edit'); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getToken()!;
    try {
      if (modal === 'create') {
        await api.adminFetch('/api/testimonials', token, { method: 'POST', body: JSON.stringify(form) });
      } else {
        await api.adminFetch(`/api/testimonials/${editId}`, token, { method: 'PUT', body: JSON.stringify(form) });
      }
      await load();
      setModal(null);
    } catch { alert('儲存失敗'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return;
    await api.adminFetch(`/api/testimonials/${id}`, getToken()!, { method: 'DELETE' });
    setItems(p => p.filter(i => i.id !== id));
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">推薦人</h1>
          <p className="text-gray-400 text-sm mt-1">{items.length} 筆紀錄</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          <Plus size={14} /> 新增推薦人
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-gray-400 text-gray-400" />
                ))}
              </div>
              <blockquote className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                &ldquo;{item.content}&rdquo;
              </blockquote>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium overflow-hidden">
                    {item.avatar ? <img src={item.avatar} alt="" className="w-full h-full object-cover" /> : item.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.role} · {item.company}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.featured && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">精選</span>}
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
        <Modal title={modal === 'create' ? '新增推薦人' : '編輯推薦人'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="姓名 *" value={form.name} onChange={set('name')} required />
              <Field label="職稱 *" value={form.role} onChange={set('role')} required />
              <Field label="公司 *" value={form.company} onChange={set('company')} required />
              <Field label="頭像 URL" value={form.avatar} onChange={set('avatar')} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">評語 *</label>
              <textarea required rows={4} value={form.content} onChange={set('content')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">評分 (1-5)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm((p: any) => ({ ...p, rating: n }))}
                    className="p-1.5 transition-colors">
                    <Star size={18} className={n <= form.rating ? 'fill-gray-600 text-gray-600' : 'text-gray-200'} />
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={e => setForm((p: any) => ({ ...p, featured: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
              <span className="text-sm text-gray-600">顯示於首頁</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
                <Save size={14} /> {saving ? '儲存中...' : '儲存'}
              </button>
              <button type="button" onClick={() => setModal(null)}
                className="px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm hover:bg-gray-100 transition-colors">取消</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors" />
    </div>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" /></div>;
}
