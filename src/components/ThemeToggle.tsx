'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a stable placeholder
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700/50 bg-zinc-100/50 dark:bg-zinc-800/40 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;
  const isDark = currentTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-950 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white border border-zinc-200 dark:border-zinc-700/50 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        // Sun icon (click to turn light)
        <svg
          className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon icon (click to turn dark)
        <svg
          className="w-4 h-4 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 -rotate-12 hover:rotate-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
