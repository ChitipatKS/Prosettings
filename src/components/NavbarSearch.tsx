'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeDiscordAvatar } from '@/lib/avatar';

type SearchPlayer = {
  id: number;
  username: string;
  real_name: string | null;
  team: string | null;
  team_logo_url: string | null;
  avatar_url: string | null;
  href: string;
  type: 'pro_player';
};

type SearchTeam = {
  id: number;
  name: string;
  logo_url: string | null;
  href: string;
  type: 'team';
};

type SearchGear = {
  id: number;
  name: string;
  category: string;
  product_type: string;
  image_url: string | null;
  href: string;
  type: 'gear';
};

type SearchCommunity = {
  id: string;
  username: string;
  real_name: string | null;
  avatar_url: string | null;
  href: string;
  type: 'community_member';
};

type SearchResults = {
  players: SearchPlayer[];
  teams: SearchTeam[];
  gears: SearchGear[];
  community: SearchCommunity[];
  total_count: number;
};

interface NavbarSearchProps {
  className?: string;
  onNavigate?: () => void;
}

export default function NavbarSearch({ className = '', onNavigate }: NavbarSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  // Flattened list of results for keyboard navigation
  const flatResults = React.useMemo(() => {
    if (!results) return [];
    return [
      ...results.players,
      ...results.teams,
      ...results.gears,
      ...results.community,
    ];
  }, [results]);

  // Debounced search fetcher
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      setSelectedIndex(-1);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setResults(data);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Navbar search error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Global shortcut handler (Ctrl+K or ⌘K, or '/' when not typing in an input)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        return;
      }

      // '/' shortcut if not in an input, textarea or contentEditable
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation within dropdown (ArrowDown, ArrowUp, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || flatResults.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        setIsOpen(false);
        router.push(`/players?search=${encodeURIComponent(query.trim())}`);
        onNavigate?.();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
        const item = flatResults[selectedIndex];
        setIsOpen(false);
        router.push(item.href);
        onNavigate?.();
      } else if (query.trim()) {
        setIsOpen(false);
        router.push(`/players?search=${encodeURIComponent(query.trim())}`);
        onNavigate?.();
      }
    }
  };

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-3.5 pointer-events-none text-zinc-500 flex items-center justify-center">
          {loading ? (
            <svg
              className="animate-spin w-4 h-4 text-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search players, teams, gears..."
          className="w-full h-10 pl-10 pr-10 bg-zinc-100 hover:bg-zinc-200/60 focus:bg-white text-zinc-900 placeholder-zinc-400 text-xs font-sans rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 dark:bg-[#12121A]/80 dark:hover:bg-[#12121A] dark:focus:bg-[#151522] dark:text-zinc-100 dark:placeholder-zinc-500 dark:border-zinc-800/80 dark:hover:border-zinc-700/80 dark:focus:border-accent/60 transition-all duration-200 shadow-sm"
        />

        {/* Right Clear button */}
        {query && (
          <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults(null);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Clear search"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Floating Instant Search Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-[420px] md:w-[480px] bg-white/95 dark:bg-[#0E0E17]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-100 dark:divide-white/5 p-2 space-y-2">
            {/* 1. Pro Players Results */}
            {results && results.players.length > 0 && (
              <div className="pt-1">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1 font-mono flex items-center justify-between">
                  <span>Pro Players</span>
                  <span className="text-[9px] text-zinc-600 font-mono">({results.players.length})</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {results.players.map((player) => {
                    const itemIndex = flatResults.findIndex(
                      (item) => item.type === 'pro_player' && item.id === player.id
                    );
                    const isSelected = itemIndex === selectedIndex;
                    const avatar = normalizeDiscordAvatar(player.avatar_url);

                    return (
                      <button
                        key={`player-${player.id}`}
                        type="button"
                        onClick={() => handleSelect(player.href)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent/15 border border-accent/30 text-zinc-950 dark:text-white'
                            : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-transparent'
                        }`}
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={player.username}
                            className="w-8 h-8 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700/80 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-accent shrink-0">
                            {player.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-900 dark:text-white font-sans truncate">
                              {player.username}
                            </span>
                            {player.team && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/50 truncate">
                                {player.team}
                              </span>
                            )}
                          </div>
                          {player.real_name && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-sans truncate mt-0.5">
                              {player.real_name}
                            </div>
                          )}
                        </div>

                        <svg className="w-4 h-4 text-zinc-600 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Teams Results */}
            {results && results.teams.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1 font-mono flex items-center justify-between">
                  <span>Esports Teams</span>
                  <span className="text-[9px] text-zinc-600 font-mono">({results.teams.length})</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {results.teams.map((team) => {
                    const itemIndex = flatResults.findIndex(
                      (item) => item.type === 'team' && item.id === team.id
                    );
                    const isSelected = itemIndex === selectedIndex;

                    return (
                      <button
                        key={`team-${team.id}`}
                        type="button"
                        onClick={() => handleSelect(team.href)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent/15 border border-accent/30 text-zinc-950 dark:text-white'
                            : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-transparent'
                        }`}
                      >
                        {team.logo_url ? (
                          <img
                            src={team.logo_url}
                            alt={team.name}
                            className="w-7 h-7 object-contain shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                            🛡️
                          </div>
                        )}
                        <span className="font-bold text-sm text-zinc-900 dark:text-white font-sans truncate flex-1">
                          {team.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">Team</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Gears & Products Results */}
            {results && results.gears.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1 font-mono flex items-center justify-between">
                  <span>Gears & Hardware</span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono">({results.gears.length})</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {results.gears.map((gear) => {
                    const itemIndex = flatResults.findIndex(
                      (item) => item.type === 'gear' && item.id === gear.id
                    );
                    const isSelected = itemIndex === selectedIndex;

                    return (
                      <button
                        key={`gear-${gear.id}`}
                        type="button"
                        onClick={() => handleSelect(gear.href)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent/15 border border-accent/30 text-zinc-950 dark:text-white'
                            : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-transparent'
                        }`}
                      >
                        {gear.image_url ? (
                          <img
                            src={gear.image_url}
                            alt={gear.name}
                            className="w-7 h-7 object-contain shrink-0 bg-black/5 dark:bg-white/5 rounded p-0.5"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                            🖱️
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs text-zinc-900 dark:text-white font-sans truncate">
                            {gear.name}
                          </div>
                          <span className="text-[10px] font-mono text-accent uppercase tracking-wider">
                            {gear.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Community Members */}
            {results && results.community.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1 font-mono flex items-center justify-between">
                  <span>Community Members</span>
                  <span className="text-[9px] text-zinc-600 font-mono">({results.community.length})</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {results.community.map((member) => {
                    const itemIndex = flatResults.findIndex(
                      (item) => item.type === 'community_member' && item.id === member.id
                    );
                    const isSelected = itemIndex === selectedIndex;
                    const avatar = normalizeDiscordAvatar(member.avatar_url);

                    return (
                      <button
                        key={`community-${member.id}`}
                        type="button"
                        onClick={() => handleSelect(member.href)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent/15 border border-accent/30 text-zinc-950 dark:text-white'
                            : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-transparent'
                        }`}
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={member.username}
                            className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700/80 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                            {member.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-zinc-900 dark:text-white font-sans truncate block">
                            @{member.username}
                          </span>
                          {member.real_name && member.real_name !== member.username && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans truncate block">
                              {member.real_name}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-sans px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/50">
                          <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                          Member
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state if nothing matched */}
            {results && results.total_count === 0 && !loading && (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono space-y-1">
                <div>No results found for &quot;<span className="text-zinc-800 dark:text-zinc-300 font-semibold">{query}</span>&quot;</div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-600">Try searching player aliases, teams, or mice models.</div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2.5 bg-zinc-50 dark:bg-black/50 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/players?search=${encodeURIComponent(query.trim())}`}
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-1.5 text-accent hover:underline font-semibold"
            >
              <span>View all player results for &quot;{query}&quot;</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
              <span>↑↓ to navigate</span>
              <span>•</span>
              <span>↵ to select</span>
              <span>•</span>
              <span>esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
