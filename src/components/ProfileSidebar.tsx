'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

import { ReactNode } from 'react';

const SECTIONS: { id: string; label: string; icon: ReactNode }[] = [
  {
    id: 'mouse-settings',
    label: 'Mouse Settings',
    icon: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="5" y="2" width="14" height="20" rx="7" />
        <path d="M12 2v10M5 12h14" />
      </svg>
    )
  },
  {
    id: 'keyboard-settings',
    label: 'Keyboard Settings',
    icon: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
      </svg>
    )
  },
  {
    id: 'crosshair',
    label: 'Crosshair',
    icon: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 12h.01" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'controls-keybinds',
    label: 'Controls / Keybinds',
    icon: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'video-settings',
    label: 'Video Settings',
    icon: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    )
  },
  {
    id: 'gears',
    label: 'Gears',
    icon: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9M3 14h3v5H3v-5Zm15 0h3v5h-3v-5Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'pc-spec',
    label: 'PC Spec',
    icon: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4M9 9h6v6H9z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'comments',
    label: 'Comments',
    icon: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
];

export default function ProfileSidebar() {
  const [activeSection, setActiveSection] = useState<string>('mouse-settings');
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (isScrollingRef.current) return;
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        {
          rootMargin: '-20% 0px -60% 0px',
          threshold: 0,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setActiveSection(id);
      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      const offset = 80;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  }, []);

  return (
    <aside className="hidden xl:block w-52 shrink-0">
      <div className="sticky top-24">
        <nav className="space-y-0.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 font-mono mb-3 pl-3">
            On this page
          </p>
          {SECTIONS.map(({ id, label, icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`
                  w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono
                  transition-all duration-200 cursor-pointer group
                  ${isActive
                    ? 'bg-accent/10 text-accent border-l-2 border-accent font-bold'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border-l-2 border-transparent'
                  }
                `}
              >
                <span className={`text-[11px] transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {icon}
                </span>
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
