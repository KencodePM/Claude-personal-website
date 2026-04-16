'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken, api } from '@/lib/api';
import { FolderOpen, Briefcase, Star, MessageSquare, User, ArrowRight, Inbox } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ projects: 0, experience: 0, testimonials: 0, messages: 0, unread: 0 });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([
      api.getProjects().catch(() => null),
      api.getExperience().catch(() => []),
      api.getTestimonials().catch(() => []),
      api.adminFetch<any>('/api/messages', token).catch(() => null),
      api.getProfile().catch(() => null),
    ]).then(([projects, experience, testimonials, messages, profile]) => {
      setStats({
        projects: projects?.projects?.length ?? 0,
        experience: experience?.length ?? 0,
        testimonials: testimonials?.length ?? 0,
        messages: messages?.messages?.length ?? 0,
        unread: (messages?.messages ?? []).filter((m: any) => m.status === 'UNREAD').length,
      });
      setRecentMessages((messages?.messages ?? []).slice(0, 3));
      setProfile(profile);
    });
  }, []);

  const cards = [
    { label: '作品', value: stats.projects, icon: FolderOpen, href: '/admin/projects', color: 'bg-gray-100 text-gray-600' },
    { label: '工作經歷', value: stats.experience, icon: Briefcase, href: '/admin/experience', color: 'bg-gray-100 text-gray-600' },
    { label: '推薦人', value: stats.testimonials, icon: Star, href: '/admin/testimonials', color: 'bg-gray-100 text-gray-600' },
    { label: '待讀訊息', value: stats.unread, icon: MessageSquare, href: '/admin/messages', color: stats.unread > 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600' },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {profile?.nameCn ? `你好，${profile.nameCn} 👋` : '控制台'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">管理您的個人作品集內容</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={16} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">快速操作</h2>
          <div className="space-y-2">
            {[
              { href: '/admin/profile', label: '編輯個人資料', icon: User },
              { href: '/admin/projects', label: '管理作品集', icon: FolderOpen },
              { href: '/admin/experience', label: '更新工作經歷', icon: Briefcase },
              { href: '/admin/testimonials', label: '管理推薦人', icon: Star },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <Icon size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex-1">{label}</span>
                <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">最新訊息</h2>
            <Link href="/admin/messages" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">查看全部</Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-300">
              <Inbox size={32} className="mb-2" />
              <p className="text-sm">暫無訊息</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map(msg => (
                <div key={msg.id} className={`p-3 rounded-xl border transition-colors ${msg.status !== 'UNREAD' ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    {msg.status === 'UNREAD' && <div className="w-1.5 h-1.5 bg-gray-700 rounded-full shrink-0" />}
                    <span className="text-sm font-medium text-gray-800 truncate">{msg.senderName}</span>
                    <span className="text-xs text-gray-400 ml-auto shrink-0">{new Date(msg.createdAt).toLocaleDateString('zh-TW')}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{msg.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
