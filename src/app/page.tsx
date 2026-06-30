'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Player = {
  settings_id: number;
  player_id: number;
  username: string;
  real_name: string | null;
  team: string | null;
  nationality: string | null;
  country_code: string | null;
  profile_img_url: string | null;
  game: string;
  game_slug: string;
  game_role: string | null;
  mouse_settings: {
    dpi: number | null;
    hz: number | null;
    sens: number | null;
    edpi: number | null;
  };
  video_settings: {
    resolution: string | null;
    aspect_ratio: string | null;
    refresh_rate: number | null;
  };
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type GameStats = {
  total: number;
  players: Player[];
};

export default function Home() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // States for Game selection cards
  const [valorantStats, setValorantStats] = useState<GameStats>({ total: 0, players: [] });
  const [cs2Stats, setCs2Stats] = useState<GameStats>({ total: 0, players: [] });

  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState<Player[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalFocused, setGlobalFocused] = useState(false);
  const [searchFilterGame, setSearchFilterGame] = useState('all');
  const [searchFilterStatus, setSearchFilterStatus] = useState('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    setGlobalFocused(false);
    setSelectedGame('search-results');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Fetch Game Stats on load for cards
  useEffect(() => {
    const fetchGameStats = async () => {
      try {
        const valRes = await fetch('/api/players?game=valorant&limit=6');
        if (valRes.ok) {
          const valData = await valRes.json();
          setValorantStats({
            total: valData.pagination.total,
            players: valData.players.slice(0, 6)
          });
        }

        const csRes = await fetch('/api/players?game=cs2&limit=6');
        if (csRes.ok) {
          const csData = await csRes.json();
          setCs2Stats({
            total: csData.pagination.total,
            players: csData.players.slice(0, 6)
          });
        }
      } catch (e) {
        console.error('Error fetching game stats:', e);
      }
    };

    fetchGameStats();
  }, []);

  // Smart Search fetch logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (globalSearch.trim().length >= 2) {
        setGlobalLoading(true);
        try {
          const res = await fetch(`/api/players?search=${encodeURIComponent(globalSearch.trim())}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            setGlobalResults(data.players || []);
          }
        } catch (err) {
          console.error('Error in smart search:', err);
        } finally {
          setGlobalLoading(false);
        }
      } else {
        setGlobalResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearch]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setGlobalFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search input for player listing grid
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Fetch players on parameter change (for player list view and search results)
  useEffect(() => {
    if (selectedGame === 'all') return;

    const fetchPlayers = async () => {
      try {
        setLoading(true);
        let url = `/api/players?page=${pagination.page}&limit=${pagination.limit}`;

        if (selectedGame === 'search-results') {
          if (globalSearch) {
            url += `&search=${encodeURIComponent(globalSearch.trim())}`;
          }
          if (searchFilterGame !== 'all') {
            url += `&game=${searchFilterGame}`;
          }
        } else {
          if (debouncedSearch) {
            url += `&search=${encodeURIComponent(debouncedSearch)}`;
          }
          if (selectedGame !== 'all') {
            url += `&game=${selectedGame}`;
          }
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          let fetchedPlayers = data.players || [];

          // Apply client-side status filter if set
          if (selectedGame === 'search-results' && searchFilterStatus !== 'all') {
            if (searchFilterStatus === 'active') {
              fetchedPlayers = fetchedPlayers.filter((p: Player) =>
                p.team &&
                p.team !== '-' &&
                !p.team.toLowerCase().includes('retired') &&
                !p.team.toLowerCase().includes('inactive') &&
                !p.team.toLowerCase().includes('free agent')
              );
            } else if (searchFilterStatus === 'retired') {
              fetchedPlayers = fetchedPlayers.filter((p: Player) =>
                !p.team ||
                p.team === '-' ||
                p.team.toLowerCase().includes('retired') ||
                p.team.toLowerCase().includes('inactive') ||
                p.team.toLowerCase().includes('free agent')
              );
            }
          }

          setPlayers(fetchedPlayers);
          setPagination(data.pagination);
        } else {
          console.error('Failed to fetch players');
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [pagination.page, debouncedSearch, selectedGame, searchFilterGame, searchFilterStatus]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getGameBadgeClass = (slug: string) => {
    if (slug === 'valorant') {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-16 flex flex-col justify-between">

      {/* 1. VIEW MODE: GAME SELECTION */}
      {selectedGame === 'all' && (
        <div className="space-y-16 animate-in fade-in duration-300">

          {/* Hero Banner Section (Clean & Detailed) */}
          <div className="text-center max-w-3xl mx-auto space-y-5 pt-8">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight font-display">
              Optimize Your Setup. <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.25)]">Elevate Your Game.</span>
            </h1>
            <div className="flex justify-center">
              <p className="text-sm sm:text-base text-zinc-400 font-normal">
                Explore mouse sensitivity, gear setups, and hardware configurations used by elite professional players.
              </p>
            </div>
          </div>

          {/* Smart Search Box (Form with Filters and Search Button) */}
          <div ref={dropdownRef} className="w-full max-w-4xl mx-auto z-40">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="relative flex-1">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                    <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    onFocus={() => setGlobalFocused(true)}
                    placeholder="Search for Player Profiles, Teams, Real Names, and More..."
                    className="w-full h-14 bg-background-alt border border-border-custom rounded-xl py-4 pl-12 pr-4 text-sm text-[#FAFAFA] placeholder-zinc-500 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/25 focus:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all duration-300"
                  />
                  {globalLoading && (
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-zinc-500 font-mono tracking-wider">
                      SEARCHING...
                    </span>
                  )}
                </div>

                {/* Smart Search Dropdown List (Aligned with input) */}
                {globalFocused && globalSearch.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#12121A] border border-border-custom shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {globalResults.length === 0 ? (
                      <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                        {globalLoading ? 'Searching...' : 'No players found'}
                      </div>
                    ) : (
                      <ul className="divide-y divide-white/5">
                        {globalResults.map((player) => (
                          <li key={player.settings_id}>
                            <button
                              type="button"
                              onClick={() => {
                                setGlobalFocused(false);
                                router.push(`/players/${player.username}`);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors duration-150 text-left"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-[#FAFAFA] text-xs font-display">{player.username}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                                  {player.real_name && <span>{player.real_name}</span>}
                                  {player.real_name && player.team && <span>•</span>}
                                  {player.team && <span className="text-accent/80 font-bold">{player.team}</span>}
                                </div>
                              </div>
                              <span className={`text-[8px] font-bold uppercase tracking-wider py-0.5 px-2 rounded font-mono ${getGameBadgeClass(player.game_slug)}`}>
                                {player.game}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Search Button (Styled) */}
              <div className="shrink-0">
                <button
                  type="submit"
                  className="h-14 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 hover:scale-[1.02] active:scale-[0.98] text-[#0A0A0F] text-xs font-bold transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.55)] border border-amber-400/20 flex items-center justify-center gap-2 cursor-pointer font-mono uppercase tracking-wider"
                >
                  <svg className="h-4 w-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Header Banner */}
          <div id="games" className="text-center max-w-3xl mx-auto space-y-4 pt-8 border-t border-white/5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
              Select Your <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">Favorite Game!</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-semibold tracking-wide font-mono uppercase">
              From our selection of Popular games
            </p>
          </div>

          {/* Game Selection Cards Grid (6 Slots: 2 active games + 4 empty placeholders) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* CARD 1: CS2 */}
            <div className="bg-card backdrop-blur-[8px] border border-border-custom p-6 rounded-2xl flex flex-col justify-between hover:border-accent/30 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.05)] transition-all duration-300 group">
              <div className="space-y-6">
                <div className="relative h-44 rounded-2xl bg-gradient-to-tr from-amber-950 via-zinc-900 to-amber-600 bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] flex items-center justify-center border border-white/5 overflow-hidden">
                  <span className="text-2xl font-black tracking-widest text-[#FAFAFA] uppercase font-display group-hover:scale-110 transition-transform duration-300">CS2</span>
                  <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white font-mono backdrop-blur-md">1</div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white font-display group-hover:text-accent transition-colors duration-300">CS2</h3>
                  <div className="flex flex-col gap-2 pt-2 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span className="text-accent font-bold">{cs2Stats.total || '892'}+</span> Players
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456" />
                      </svg>
                      <span className="text-accent font-bold">{cs2Stats.total || '892'}+</span> Gamers Setup
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {cs2Stats.players.slice(0, 5).map((p, idx) => (
                    <div
                      key={p.player_id || idx}
                      className="inline-block h-6 w-6 rounded-full bg-zinc-800 border border-border-custom flex items-center justify-center text-[8px] font-bold text-accent overflow-hidden font-display"
                      title={p.username}
                    >
                      {p.profile_img_url ? (
                        <img src={p.profile_img_url} alt={p.username} className="h-full w-full object-cover" />
                      ) : (
                        p.username[0].toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedGame('cs2')}
                  className="text-white hover:text-accent font-bold text-xs font-mono tracking-wider flex items-center gap-1 transition-colors duration-200"
                >
                  VIEW ALL &gt;
                </button>
              </div>
            </div>

            {/* CARD 2: Valorant */}
            <div className="bg-card backdrop-blur-[8px] border border-border-custom p-6 rounded-2xl flex flex-col justify-between hover:border-accent/30 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.05)] transition-all duration-300 group">
              <div className="space-y-6">
                <div className="relative h-44 rounded-2xl bg-gradient-to-tr from-rose-950 via-zinc-900 to-red-600 bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] flex items-center justify-center border border-white/5 overflow-hidden">
                  <span className="text-2xl font-black tracking-widest text-[#FAFAFA] uppercase font-display group-hover:scale-110 transition-transform duration-300">VALORANT</span>
                  <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white font-mono backdrop-blur-md">2</div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white font-display group-hover:text-accent transition-colors duration-300">Valorant</h3>
                  <div className="flex flex-col gap-2 pt-2 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span className="text-accent font-bold">{valorantStats.total || '643'}+</span> Players
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456" />
                      </svg>
                      <span className="text-accent font-bold">{valorantStats.total || '643'}+</span> Gamers Setup
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom overlap avatars and action */}
              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {valorantStats.players.slice(0, 5).map((p, idx) => (
                    <div
                      key={p.player_id || idx}
                      className="inline-block h-6 w-6 rounded-full bg-zinc-800 border border-border-custom flex items-center justify-center text-[8px] font-bold text-accent overflow-hidden font-display"
                      title={p.username}
                    >
                      {p.profile_img_url ? (
                        <img src={p.profile_img_url} alt={p.username} className="h-full w-full object-cover" />
                      ) : (
                        p.username[0].toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedGame('valorant')}
                  className="text-white hover:text-accent font-bold text-xs font-mono tracking-wider flex items-center gap-1 transition-colors duration-200"
                >
                  VIEW ALL&gt;
                </button>
              </div>
            </div>

            {/* CARD 3: Empty Placeholder */}
            <div className="border border-dashed border-border-custom/50 bg-card/5 p-6 rounded-2xl flex flex-col justify-between h-full min-h-[360px] opacity-40 hover:opacity-60 transition-all duration-300 relative group">
              <div className="relative h-44 rounded-2xl bg-black/20 border border-white/5 border-dashed flex items-center justify-center overflow-hidden">
                <span className="text-sm font-semibold tracking-wider text-zinc-600 uppercase font-mono">TBD</span>
                <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-600 font-mono">3</div>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-bold text-zinc-600 font-display">Coming Soon</h3>
                <p className="text-xs text-zinc-600 font-mono">Game details will be updated later</p>
              </div>
              <div className="mt-8 pt-4 border-t border-dashed border-border-custom flex items-center justify-end">
                <span className="text-zinc-600 text-xs font-mono font-semibold">LOCKED</span>
              </div>
            </div>

            {/* CARD 4: Empty Placeholder */}
            <div className="border border-dashed border-border-custom/50 bg-card/5 p-6 rounded-2xl flex flex-col justify-between h-full min-h-[360px] opacity-40 hover:opacity-60 transition-all duration-300 relative group">
              <div className="relative h-44 rounded-2xl bg-black/20 border border-white/5 border-dashed flex items-center justify-center overflow-hidden">
                <span className="text-sm font-semibold tracking-wider text-zinc-600 uppercase font-mono">TBD</span>
                <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-600 font-mono">4</div>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-bold text-zinc-600 font-display">Coming Soon</h3>
                <p className="text-xs text-zinc-600 font-mono">Game details will be updated later</p>
              </div>
              <div className="mt-8 pt-4 border-t border-dashed border-border-custom flex items-center justify-end">
                <span className="text-zinc-600 text-xs font-mono font-semibold">LOCKED</span>
              </div>
            </div>

            {/* CARD 5: Empty Placeholder */}
            <div className="border border-dashed border-border-custom/50 bg-card/5 p-6 rounded-2xl flex flex-col justify-between h-full min-h-[360px] opacity-40 hover:opacity-60 transition-all duration-300 relative group">
              <div className="relative h-44 rounded-2xl bg-black/20 border border-white/5 border-dashed flex items-center justify-center overflow-hidden">
                <span className="text-sm font-semibold tracking-wider text-zinc-600 uppercase font-mono">TBD</span>
                <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-600 font-mono">5</div>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-bold text-zinc-600 font-display">Coming Soon</h3>
                <p className="text-xs text-zinc-600 font-mono">Game details will be updated later</p>
              </div>
              <div className="mt-8 pt-4 border-t border-dashed border-border-custom flex items-center justify-end">
                <span className="text-zinc-600 text-xs font-mono font-semibold">LOCKED</span>
              </div>
            </div>

            {/* CARD 6: Empty Placeholder */}
            <div className="border border-dashed border-border-custom/50 bg-card/5 p-6 rounded-2xl flex flex-col justify-between h-full min-h-[360px] opacity-40 hover:opacity-60 transition-all duration-300 relative group">
              <div className="relative h-44 rounded-2xl bg-black/20 border border-white/5 border-dashed flex items-center justify-center overflow-hidden">
                <span className="text-sm font-semibold tracking-wider text-zinc-600 uppercase font-mono">TBD</span>
                <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-600 font-mono">6</div>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-bold text-zinc-600 font-display">Coming Soon</h3>
                <p className="text-xs text-zinc-600 font-mono">Game details will be updated later</p>
              </div>
              <div className="mt-8 pt-4 border-t border-dashed border-border-custom flex items-center justify-end">
                <span className="text-zinc-600 text-xs font-mono font-semibold">LOCKED</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. VIEW MODE: PLAYERS LIST (Shows when selectedGame !== 'all' and !== 'search-results') */}
      {selectedGame !== 'all' && selectedGame !== 'search-results' && (
        <div className="space-y-8 animate-in fade-in duration-300">

          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-6">
            <div>
              <button
                onClick={() => {
                  setSelectedGame('all');
                  setSearch('');
                  setDebouncedSearch('');
                }}
                className="text-xs font-bold text-zinc-500 hover:text-white transition-colors duration-200 font-mono tracking-wider flex items-center gap-1"
              >
                &lt; BACK TO GAMES
              </button>
              <h2 className="text-2xl font-extrabold text-white mt-2 font-display uppercase tracking-tight">
                {selectedGame === 'valorant' ? 'VALORANT Pro Players' : 'CS2 Pro Players'}
              </h2>
            </div>

            {/* Quick Game Selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setGameDropdownOpen(!gameDropdownOpen)}
                className="h-11 w-full sm:w-56 flex items-center justify-between gap-2 px-4 rounded-xl bg-black/40 border border-border-custom text-xs font-bold text-[#FAFAFA] hover:border-border-hover transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  {selectedGame === 'valorant' && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Game: VALORANT
                    </span>
                  )}
                  {selectedGame === 'cs2' && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Game: CS2
                    </span>
                  )}
                </span>
                <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {gameDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setGameDropdownOpen(false)}></div>
                  <ul className="absolute right-0 mt-2 w-full sm:w-56 rounded-xl bg-[#12121A] border border-border-custom shadow-xl z-30 py-1.5">
                    <li>
                      <button
                        onClick={() => {
                          setSelectedGame('all');
                          setGameDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        All Games (Home)
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedGame('valorant');
                          setPagination(prev => ({ ...prev, page: 1 }));
                          setGameDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 hover:bg-white/5 transition-colors ${selectedGame === 'valorant' ? 'text-accent' : 'text-zinc-400'
                          }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> VALORANT
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedGame('cs2');
                          setPagination(prev => ({ ...prev, page: 1 }));
                          setGameDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 hover:bg-white/5 transition-colors ${selectedGame === 'cs2' ? 'text-accent' : 'text-zinc-400'
                          }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> CS2
                      </button>
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Search Controls */}
          <div className="bg-background-alt border border-border-custom p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 overflow-visible relative z-20">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pro players, real names, or teams..."
                className="w-full h-11 bg-black/40 border border-border-custom rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] focus:bg-black/60 transition-all duration-300"
              />
            </div>
          </div>

          {/* Players Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(8)].map((_, idx) => (
                  <div key={idx} className="bg-card border border-border-custom h-48 rounded-2xl"></div>
                ))}
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border-custom rounded-2xl">
                <h3 className="text-sm font-bold text-white mt-4 font-display">No pro players found</h3>
                <p className="text-zinc-500 text-xs mt-1 font-mono">Try another search term or change the game filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {players.map((player) => (
                  <Link
                    key={player.settings_id}
                    href={`/players/${player.username}`}
                    className="bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-2xl flex flex-col justify-between hover:border-border-hover hover:bg-[#1A1A24]/40 hover:scale-[1.02] transition-all duration-300 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded ${getGameBadgeClass(player.game_slug)} font-mono`}>
                          {player.game}
                        </span>
                        {player.country_code && (
                          <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-wide" title={player.nationality || ''}>
                            {player.country_code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-[#1A1A24] border border-border-custom flex items-center justify-center font-bold text-accent text-sm overflow-hidden group-hover:border-accent/30 transition-all duration-300">
                          {player.profile_img_url ? (
                            <img src={player.profile_img_url} alt={player.username} className="h-full w-full object-cover" />
                          ) : (
                            player.username[0].toUpperCase()
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-[#FAFAFA] text-base leading-tight group-hover:text-accent transition-colors duration-300 font-display">
                            {player.username}
                          </h3>
                          {player.team ? (
                            <p className="text-[10px] font-bold text-accent/80 font-mono tracking-wide line-clamp-1">
                              {player.team}
                            </p>
                          ) : (
                            <p className="text-[10px] font-medium text-zinc-600 font-mono italic">
                              No Team
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-2 font-mono">
                      <div className="flex justify-between items-center text-[11px] text-zinc-500">
                        <span>Sensitivity</span>
                        <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors duration-300">
                          {player.mouse_settings.sens !== null ? player.mouse_settings.sens.toFixed(3) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-zinc-500">
                        <span>DPI (eDPI)</span>
                        <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors duration-300">
                          {player.mouse_settings.dpi || '—'} ({player.mouse_settings.edpi || '—'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-zinc-500">
                        <span>Resolution</span>
                        <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors duration-300">
                          {player.video_settings.resolution || '—'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="px-4 py-2 bg-black/40 hover:bg-[#1A1A24]/40 disabled:opacity-30 text-[#FAFAFA] text-xs font-bold rounded border border-border-custom hover:border-border-hover transition-all duration-300 disabled:cursor-not-allowed font-mono"
              >
                ← PREV
              </button>

              <span className="text-zinc-500 text-xs font-semibold font-mono">
                PAGE {pagination.page} OF {pagination.pages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || loading}
                className="px-4 py-2 bg-black/40 hover:bg-[#1A1A24]/40 disabled:opacity-30 text-[#FAFAFA] text-xs font-bold rounded border border-border-custom hover:border-border-hover transition-all duration-300 disabled:cursor-not-allowed font-mono"
              >
                NEXT →
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. VIEW MODE: SEARCH RESULTS (Shows when selectedGame === 'search-results') */}
      {selectedGame === 'search-results' && (
        <div className="space-y-8 animate-in fade-in duration-300">

          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-6">
            <div>
              <button
                onClick={() => {
                  setSelectedGame('all');
                  setGlobalSearch('');
                  setSearchFilterGame('all');
                  setSearchFilterStatus('all');
                }}
                className="text-xs font-bold text-zinc-500 hover:text-white transition-colors duration-200 font-mono tracking-wider flex items-center gap-1"
              >
                &lt; BACK TO GAMES
              </button>
              <h2 className="text-2xl font-extrabold text-white mt-2 font-display uppercase tracking-tight">
                Search Results for &ldquo;{globalSearch}&rdquo;
              </h2>
            </div>
          </div>

          {/* Players Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(8)].map((_, idx) => (
                  <div key={idx} className="bg-card border border-border-custom h-48 rounded-2xl"></div>
                ))}
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border-custom rounded-2xl">
                <h3 className="text-sm font-bold text-white mt-4 font-display">No pro players found</h3>
                <p className="text-zinc-500 text-xs mt-1 font-mono">Try another search term or change the filter settings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {players.map((player) => (
                  <Link
                    key={player.settings_id}
                    href={`/players/${player.username}`}
                    className="bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-2xl flex flex-col justify-between hover:border-border-hover hover:bg-[#1A1A24]/40 hover:scale-[1.02] transition-all duration-300 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded ${getGameBadgeClass(player.game_slug)} font-mono`}>
                          {player.game}
                        </span>
                        {player.country_code && (
                          <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-wide" title={player.nationality || ''}>
                            {player.country_code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-[#1A1A24] border border-border-custom flex items-center justify-center font-bold text-accent text-sm overflow-hidden group-hover:border-accent/30 transition-all duration-300">
                          {player.profile_img_url ? (
                            <img src={player.profile_img_url} alt={player.username} className="h-full w-full object-cover" />
                          ) : (
                            player.username[0].toUpperCase()
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-[#FAFAFA] text-base leading-tight group-hover:text-accent transition-colors duration-300 font-display">
                            {player.username}
                          </h3>
                          {player.team ? (
                            <p className="text-[10px] font-bold text-accent/80 font-mono tracking-wide line-clamp-1">
                              {player.team}
                            </p>
                          ) : (
                            <p className="text-[10px] font-medium text-zinc-600 font-mono italic">
                              No Team
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-2 font-mono">
                      <div className="flex justify-between items-center text-[11px] text-zinc-500">
                        <span>Sensitivity</span>
                        <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors duration-300">
                          {player.mouse_settings.sens !== null ? player.mouse_settings.sens.toFixed(3) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-zinc-500">
                        <span>DPI (eDPI)</span>
                        <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors duration-300">
                          {player.mouse_settings.dpi || '—'} ({player.mouse_settings.edpi || '—'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-zinc-500">
                        <span>Resolution</span>
                        <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors duration-300">
                          {player.video_settings.resolution || '—'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pagination inside search results */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="px-4 py-2 bg-black/40 hover:bg-[#1A1A24]/40 disabled:opacity-30 text-[#FAFAFA] text-xs font-bold rounded border border-border-custom hover:border-border-hover transition-all duration-300 disabled:cursor-not-allowed font-mono"
              >
                ← PREV
              </button>

              <span className="text-zinc-500 text-xs font-semibold font-mono">
                PAGE {pagination.page} OF {pagination.pages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || loading}
                className="px-4 py-2 bg-black/40 hover:bg-[#1A1A24]/40 disabled:opacity-30 text-[#FAFAFA] text-xs font-bold rounded border border-border-custom hover:border-border-hover transition-all duration-300 disabled:cursor-not-allowed font-mono"
              >
                NEXT →
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
