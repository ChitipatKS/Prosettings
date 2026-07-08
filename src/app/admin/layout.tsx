'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Overview',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      name: 'Manage Players',
      path: '/admin/players',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: 'Manage Gears',
      path: '/admin/gears',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    }
  ];

  return (
    <AdminGuard>
      <div className="flex-1 w-full min-h-screen bg-[#0A0A0F] text-zinc-300 flex flex-col md:flex-row">
        
        {/* Admin Sidebar */}
        <aside className="w-full md:w-64 md:sticky md:top-0 md:h-screen bg-[#0D0D13] border-b md:border-b-0 md:border-r border-zinc-800/60 flex flex-col justify-between shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="p-6 space-y-8">
            {/* Header / Brand */}
            <div>
              <Link href="/" className="flex items-center gap-1.5 group">
                <span className="text-lg font-bold tracking-tight text-white font-display">
                  PRO<span className="text-accent">SETTINGS</span> <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 px-1.5 py-0.5 rounded ml-1 bg-black/20">ADMIN</span>
                </span>
              </Link>
            </div>
 
            {/* Nav Menu */}
            <nav className="flex flex-col gap-1.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.path || (item.path !== '/admin' && pathname?.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-all duration-200 border ${
                      isActive
                        ? 'bg-accent/5 text-accent border-accent/25 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                        : 'text-zinc-400 hover:text-white border-transparent hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>

      </div>
    </AdminGuard>
  );
}
