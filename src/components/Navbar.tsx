'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { normalizeDiscordAvatar } from '@/lib/avatar';
import NavbarSearch from '@/components/NavbarSearch';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    setMobileMenuOpen(false);
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const rawAvatar = profile?.profile_img_url || user?.user_metadata?.avatar_url || null;
  const userAvatar = normalizeDiscordAvatar(rawAvatar);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#0A0A0F]/90 backdrop-blur-md border-b border-b-zinc-200/80 dark:border-b-zinc-800/60 shadow-sm transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Logo & Desktop Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md px-1 py-0.5"
          >
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-display">
              PRO<span className="text-accent transition-colors duration-300">SETTINGS</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent group-hover:shadow-[0_0_10px_#F59E0B] transition-all duration-300"></span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
            <Link
              href="/players"
              className={`text-xs font-semibold tracking-wide uppercase transition-colors font-sans py-1 ${
                pathname === '/players'
                  ? 'text-zinc-950 dark:text-white border-b-2 border-accent pb-0.5 font-bold'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Players
            </Link>

            <Link
              href="/sens-converter"
              className={`text-xs font-semibold tracking-wide uppercase transition-colors font-sans py-1 ${
                pathname === '/sens-converter'
                  ? 'text-zinc-950 dark:text-white border-b-2 border-accent pb-0.5 font-bold'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Sens Converter
            </Link>
            <Link
              href="/teams"
              className={`text-xs font-semibold tracking-wide uppercase transition-colors font-sans py-1 ${
                pathname === '/teams'
                  ? 'text-zinc-950 dark:text-white border-b-2 border-accent pb-0.5 font-bold'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Teams
            </Link>
          </nav>
        </div>

        {/* Center: Search Bar (Desktop & Tablet) */}
        <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-2 lg:mx-4">
          <NavbarSearch className="w-full" />
        </div>

        {/* Right: Actions, Theme Toggle, Auth & Mobile Triggers */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Theme Toggle Button (Desktop & Mobile) */}
          <ThemeToggle />

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white border border-zinc-200 dark:border-zinc-700/50 transition-colors"
            title="Search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              {isAdmin && (
                <Link
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-accent hover:text-accent/90 transition-colors font-sans uppercase tracking-wider bg-accent/10 border border-accent/25 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-accent/15 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                  Manage
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all group"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={profile?.username || 'Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 group-hover:border-accent transition-colors shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.includes('cdn.discordapp.com/avatars/') && !target.src.includes('.webp')) {
                        target.src = normalizeDiscordAvatar(target.src);
                      }
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 group-hover:border-accent shrink-0">
                    {profile?.username ? profile.username.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-bold text-zinc-800 dark:text-white group-hover:text-accent transition-colors font-sans uppercase tracking-wider">
                  Profile
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="hidden sm:flex h-9 px-3 items-center justify-center rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:hover:text-white text-xs font-bold transition-all uppercase tracking-wider font-sans cursor-pointer border border-zinc-200 dark:border-zinc-700/40"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/login"
                className="text-xs font-bold text-zinc-700 hover:text-zinc-950 dark:text-white dark:hover:text-accent transition-colors font-sans uppercase tracking-wider px-2 py-1"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="h-9 px-3.5 sm:px-4 flex items-center justify-center rounded-xl bg-accent text-accent-fg hover:bg-accent/90 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] uppercase tracking-wider font-sans"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white border border-zinc-200 dark:border-zinc-700/50 transition-colors"
            title="Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Dropdown (when toggled on mobile) */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0A0A0F] animate-in slide-in-from-top-2 duration-150">
          <NavbarSearch onNavigate={() => setMobileSearchOpen(false)} />
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 py-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-white/95 dark:bg-[#0A0A0F] space-y-4 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/players"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-sans transition-colors ${
                pathname === '/players'
                  ? 'bg-accent/15 text-accent font-bold'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'
              }`}
            >
              Players
            </Link>

            <Link
              href="/sens-converter"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-sans transition-colors ${
                pathname === '/sens-converter'
                  ? 'bg-accent/15 text-accent font-bold'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'
              }`}
            >
              Sens Converter
            </Link>
            <Link
              href="/teams"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-sans transition-colors ${
                pathname === '/teams'
                  ? 'bg-accent/15 text-accent font-bold'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'
              }`}
            >
              Teams
            </Link>
          </nav>

          {/* Theme row in mobile drawer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200/80 dark:border-zinc-800/60 pt-3">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-sans uppercase tracking-wider">
              Theme Mode
            </span>
            <ThemeToggle />
          </div>

          {user && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white hover:text-accent font-sans uppercase tracking-wider"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={profile?.username || 'Avatar'}
                    className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                    {profile?.username ? profile.username.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                )}
                <span>My Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-400 font-bold uppercase font-sans cursor-pointer"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
