'use client';

import { useEffect, useState } from 'react';
import { getToken, api } from '@/lib/api';
import type { Message } from '@/lib/types';
import { Inbox, CheckCheck, Trash2, Mail, MailOpen } from 'lucide-react';

export default function MessagesAdmin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);

  const load = () => {
    const token = getToken();
    if (!token) return;
    api.adminFetch<Message[]>('/api/messages', token)
      .then(d => { setMessages(d); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    const token = getToken()!;
    await api.adminFetch(`/api/messages/${id}/read`, token, { method: 'PUT' });
    setMessages(p => p.map(m => m.id === id ? { ...m, read: true } : m));
    if (selected?.id === id) setSelected(p => p ? { ...p, read: true } : null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此訊息？')) return;
    await api.adminFetch(`/api/messages/${id}`, getToken()!, { method: 'DELETE' });
    setMessages(p => p.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const openMessage = (msg: Message) => {
    setSelected(msg);
    if (!msg.read) markRead(msg.id);
  };

  const unread = messages.filter(m => !m.read).length;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">聯繫訊息</h1>
        <p className="text-gray-400 text-sm mt-1">
          共 {messages.length} 封{unread > 0 && <span className="text-gray-900 font-medium">，{unread} 封未讀</span>}
        </p>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid md:grid-cols-2 gap-4 h-[600px]">
          {/* List */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">收件匣</span>
            </div>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                <Inbox size={36} className="mb-2" />
                <p className="text-sm">暫無訊息</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {messages.map(msg => (
                  <button key={msg.id} onClick={() => openMessage(msg)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selected?.id === msg.id ? 'bg-gray-50' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.read && <div className="w-1.5 h-1.5 bg-gray-700 rounded-full shrink-0" />}
                      <span className={`text-sm flex-1 truncate ${!msg.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate pl-3.5">{msg.subject || msg.content}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-0.5">{selected.name}</h3>
                      <a href={`mailto:${selected.email}`} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                        {selected.email}
                      </a>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {!selected.read && (
                        <button onClick={() => markRead(selected.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors" title="標記已讀">
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(selected.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {selected.subject && <p className="text-sm text-gray-600 mt-2 font-medium">{selected.subject}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(selected.createdAt).toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex-1 p-5 overflow-y-auto">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selected.content}</p>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent(`Re: ${selected.subject || '您的訊息'}`);
                      const body = encodeURIComponent(
                        `親愛的 ${selected.name}，\n\n感謝您的來信！\n\n` +
                        `---\n原始訊息：\n${selected.content}`
                      );
                      window.open(`mailto:${selected.email}?subject=${subject}&body=${body}`, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors"
                  >
                    <Mail size={14} /> 開啟郵件回覆
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                <MailOpen size={36} className="mb-2" />
                <p className="text-sm">選擇一封訊息</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" /></div>;
}
