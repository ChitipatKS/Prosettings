'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const checkAdminStatus = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', userId)
          .maybeSingle();
        setIsAdmin(!!profile?.is_admin);
      } catch (err) {
        console.error('Error fetching admin status:', err);
        setIsAdmin(false);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        checkAdminStatus(currentUser.id);
      } else {
        setIsAdmin(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .maybeSingle();
        setIsAdmin(!!profile?.is_admin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A0A0F]/80 backdrop-blur-md border-b border-b-zinc-800/50">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Left: Logo & Navigation Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md px-1 py-0.5">
            <span className="text-xl font-bold tracking-tight text-white font-display">
              PRO<span className="text-accent transition-colors duration-300">SETTINGS</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent group-hover:shadow-[0_0_10px_#F59E0B] transition-all duration-300"></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/players"
              className="text-xs font-semibold tracking-wide uppercase text-zinc-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-sans"
            >
              Players
            </Link>
            <Link
              href="/#games"
              className="text-xs font-semibold tracking-wide uppercase text-zinc-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-sans"
            >
              Games
            </Link>
            <Link
              href="/sens-converter"
              className="text-xs font-semibold tracking-wide uppercase text-zinc-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-sans"
            >
              Sens Converter
            </Link>
            <Link
              href="/teams"
              className="text-xs font-semibold tracking-wide uppercase text-zinc-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-sans"
            >
              Teams
            </Link>
          </nav>
        </div>

        {/* Right: User Auth Actions */}
        <div className="flex items-center gap-5">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-accent hover:text-accent/90 transition-colors duration-200 font-sans uppercase tracking-wider bg-accent/10 border border-accent/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-accent/15"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                  Manage
                </Link>
              )}
              <Link
                href="/profile"
                className="text-xs font-bold text-white hover:text-accent transition-colors duration-200 font-sans uppercase tracking-wider"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="h-9 px-4 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all duration-200 uppercase tracking-wider font-sans cursor-pointer"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-bold text-white hover:text-accent transition-colors duration-200 font-sans uppercase tracking-wider"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="h-9 px-4 flex items-center justify-center rounded-lg bg-accent text-accent-fg hover:bg-accent/90 text-xs font-bold transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] uppercase tracking-wider font-sans"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
