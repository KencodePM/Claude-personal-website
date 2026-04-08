'use client';

import { useEffect, useState } from 'react';
import { getToken, api } from '@/lib/api';
import type { Skill } from '@/lib/types';
import { Plus, Pencil, Trash2, X, Save, Star } from 'lucide-react';

const CATEGORIES = ['Frontend', 'Backend', 'DevOps', 'Tools', 'Other'];
const empty = { name: '', level: 4, category: 'Frontend', order: 0 };

export default function SkillsAdmin() {
  const [items, setItems] = useState<Skill[]>([]);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.getSkills()
      .then(d => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(empty); setModal('create'); };
  const openEdit = (item: Skill) => { setForm(item); setEditId(item.id); setModal('edit'); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = getToken()!;
    const payload = { ...form, level: Number(form.level), order: Number(form.order) };
    try {
      if (modal === 'create') {
        await api.adminFetch('/api/skills', token, { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await api.adminFetch(`/api/skills/${editId}`, token, { method: 'PUT', body: JSON.stringify(payload) });
      }
      await load();
      setModal(null);
    } catch { alert('儲存失敗'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此技能？')) return;
    await api.adminFetch(`/api/skills/${id}`, getToken()!, { method: 'DELETE' });
    setItems(p => p.filter(i => i.id !== id));
  };

  // Group by category
  const byCategory = items.reduce<Record<string, Skill[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">技術能力</h1>
          <p className="text-gray-400 text-sm mt-1">{items.length} 項技能，以 1–7 顆星評分</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          <Plus size={14} /> 新增技能
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, skills]) => (
            <div key={cat}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{cat}</h2>
              <div className="space-y-2">
                {skills.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
                    <div className="flex-1">
                      <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                    </div>
                    <StarDisplay value={item.level} />
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? '新增技能' : '編輯技能'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">技能名稱 *</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">分類</label>
                <select value={form.category}
                  onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Star rating picker */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">熟練度（1–7 顆星）</label>
              <div className="flex gap-1 items-center">
                {Array.from({ length: 7 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm((p: any) => ({ ...p, level: i + 1 }))}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
                      className={i < form.level ? 'fill-gray-700 text-gray-700' : 'text-gray-200 fill-gray-200'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500 font-medium">{form.level} / 7</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">排序</label>
              <input type="number" min={0} value={form.order}
                onChange={e => setForm((p: any) => ({ ...p, order: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors" />
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

function StarDisplay({ value }: { value: number }) {
  const stars = Math.min(Math.max(Math.round(value), 0), 7);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <Star key={i} size={12} className={i < stars ? 'fill-gray-600 text-gray-600' : 'fill-gray-200 text-gray-200'} />
      ))}
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
