'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, removeToken, api } from '@/lib/api';
import {
  LayoutDashboard, User, Briefcase, FolderOpen, MessageSquare,
  Star, LogOut, Menu, X, Zap, Sparkles
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: '總覽', icon: LayoutDashboard },
  { href: '/admin/profile', label: '個人資料', icon: User },
  { href: '/admin/skills', label: '技術能力', icon: Sparkles },
  { href: '/admin/experience', label: '工作經歷', icon: Briefcase },
  { href: '/admin/projects', label: '作品集', icon: FolderOpen },
  { href: '/admin/testimonials', label: '推薦人', icon: Star },
  { href: '/admin/messages', label: '聯繫訊息', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      if (pathname !== '/admin/login') router.replace('/admin/login');
      else setLoading(false);
      return;
    }
    api.adminFetch<{ email: string }>('/api/auth/me', token)
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => {
        removeToken();
        router.replace('/admin/login');
      });
  }, [pathname, router]);

  const handleLogout = () => {
    removeToken();
    router.replace('/admin/login');
  };

  if (pathname === '/admin/login') return <>{children}</>;
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-200 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Portfolio Admin</span>
          </div>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                  ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 truncate flex-1">{user?.email}</span>
          </div>
          <div className="flex gap-2">
            <Link href="/" target="_blank"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              查看網站
            </Link>
            <button onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 lg:px-8">
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
