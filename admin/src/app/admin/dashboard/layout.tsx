'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Trophy, 
  Calendar, 
  Tv2, 
  Server, 
  Coins, 
  Bell, 
  LayoutDashboard, 
  LogOut,
  Signal,
  Settings
} from 'lucide-react';
import { isMockEnabled } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Route Guard checking login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('wc_admin_logged_in') === 'true';
      if (!isLoggedIn) {
        // Redirect to admin login if not logged in
        router.push('/admin');
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wc_admin_logged_in');
    }
    router.push('/admin');
  };

  // Paths updated to /admin/dashboard
  const navItems = [
    { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Match Manager', href: '/admin/dashboard/matches', icon: Calendar },
    { name: 'Stream Manager', href: '/admin/dashboard/streams', icon: Tv2 },
    { name: 'Live TV Manager', href: '/admin/dashboard/livetv', icon: Tv2 },
    { name: 'Score Providers', href: '/admin/dashboard/providers', icon: Server },
    { name: 'Earnings & Ads', href: '/admin/dashboard/ads', icon: Coins },
    { name: 'Broadcast Push', href: '/admin/dashboard/notifications', icon: Bell },
    { name: 'Site Settings', href: '/admin/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-900">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-lg">
              <Trophy className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold tracking-wider text-sm text-white">WORLD CUP 2026</span>
          </div>

          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-900 bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              {navItems.find(n => n.href === pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {isMockEnabled && (
              <button 
                onClick={() => {
                  if (confirm('Reset mock database to initial World Cup 2026 data? This will clear any changes.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="text-xs px-3.5 py-1.5 border border-rose-950/30 hover:border-rose-900 bg-rose-950/20 text-rose-400 font-bold rounded-xl transition-all"
              >
                Reset DB
              </button>
            )}
            <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full border bg-slate-900 border-slate-800">
              <Signal className={`w-3.5 h-3.5 ${isMockEnabled ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
              <span className="text-slate-300">
                {isMockEnabled ? 'Sandbox Database' : 'Supabase Cloud Live'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-950 to-black">
          {children}
        </main>
      </div>

    </div>
  );
}
