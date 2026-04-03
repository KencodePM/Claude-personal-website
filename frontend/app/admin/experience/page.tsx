'use client';

import { useEffect, useState } from 'react';
import { getToken, api } from '@/lib/api';
import type { Experience } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';

const empty = { company: '', role: '', startDate: '', endDate: '', current: false, description: '' };

export default function ExperienceAdmin() {
  const [items, setItems] = useState<Experience[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState(empty as any);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => api.getExperience().then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setModal('create'); };
  const openEdit = (item: Experience) => { setForm(item); setEditId(item.id); setModal('edit'); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getToken()!;
    try {
      if (modal === 'create') {
        await api.adminFetch('/api/experience', token, { method: 'POST', body: JSON.stringify(form) });
      } else {
        await api.adminFetch(`/api/experience/${editId}`, token, { method: 'PUT', body: JSON.stringify(form) });
      }
      await load();
      setModal(null);
    } catch { alert('儲存失敗'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return;
    await api.adminFetch(`/api/experience/${id}`, getToken()!, { method: 'DELETE' });
    setItems(p => p.filter(i => i.id !== id));
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作經歷</h1>
          <p className="text-gray-400 text-sm mt-1">{items.length} 筆紀錄</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          <Plus size={14} /> 新增經歷
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0
                    ${idx === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.role}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{item.company}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {formatDate(item.startDate)} — {item.current ? '現在' : formatDate(item.endDate || '')}
                      {item.current && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded-full">目前</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mt-3 ml-11">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? '新增工作經歷' : '編輯工作經歷'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="公司名稱 *" value={form.company} onChange={set('company')} required />
              <Field label="職稱 *" value={form.role} onChange={set('role')} required />
              <Field label="開始日期 *" value={form.startDate} onChange={set('startDate')} required placeholder="2022-01" />
              <Field label="結束日期" value={form.endDate || ''} onChange={set('endDate')} placeholder="2023-12" disabled={form.current} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.current} onChange={e => setForm((p: any) => ({ ...p, current: e.target.checked, endDate: '' }))}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
              <span className="text-sm text-gray-600">目前在職</span>
            </label>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">工作描述 *</label>
              <textarea required rows={4} value={form.description} onChange={set('description')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none" />
            </div>
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

function Field({ label, value, onChange, required, placeholder, disabled }: any) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50 transition-colors" />
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
