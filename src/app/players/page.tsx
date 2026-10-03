'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTeamLogo } from '@/lib/teamLogos';
import TeamLogoImg from '@/components/TeamLogoImg';

type Player = {
  settings_id: number;
  player_id: number;
  username: string;
  real_name: string | null;
  team: string | null;
  team_logo_url?: string | null;
  nationality: string | null;
  country_code: string | null;
  profile_img_url: string | null;
  games: {
    id: number;
    name: string;
    slug: string;
    role: string | null;
  }[];
  game?: string;
  game_slug?: string;
  game_role?: string | null;
  mouse_settings?: {
    dpi: number | null;
    hz: number | null;
    sens: number | null;
    edpi: number | null;
  };
  video_settings?: {
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

// Helper to convert 2-letter country code to Flag Emoji (e.g. TH -> 🇹🇭)
function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🏳️';
  }
}

// Helper to render beautiful game badge logos (Valorant, CS2, PUBG, Apex, Fortnite)
function renderGameLogo(slug: string) {
  const s = (slug || '').toLowerCase();
  if (s.includes('valorant')) {
    return (
      <div className="w-[26px] h-[26px] rounded overflow-hidden shadow-lg border border-black/20 flex items-center justify-center transition-transform duration-300 hover:scale-110" title="VALORANT">
        <img
          src="/images/valorant-logo.png"
          alt="VALORANT"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  if (s.includes('cs2') || s.includes('csgo') || s.includes('counter-strike') || s.includes('cs')) {
    return (
      <div className="w-[26px] h-[26px] rounded overflow-hidden shadow-lg border border-black/20 flex items-center justify-center transition-transform duration-300 hover:scale-110" title="CS2">
        <img
          src="/images/cs2-logo.png"
          alt="CS2"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  if (s.includes('apex')) {
    return (
      <div className="w-[26px] h-[26px] rounded bg-[#DA292A] flex items-center justify-center shadow-lg border border-black/10 transition-transform duration-300 hover:scale-110" title="Apex Legends">
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
      </div>
    );
  }
  if (s.includes('pubg')) {
    return (
      <div className="w-[26px] h-[26px] rounded bg-[#F2A900] flex items-center justify-center shadow-lg border border-black/10 transition-transform duration-300 hover:scale-110" title="PUBG">
        <span className="text-[8px] font-black text-black tracking-tighter">PUBG</span>
      </div>
    );
  }
  if (s.includes('fortnite')) {
    return (
      <div className="w-[26px] h-[26px] rounded bg-[#2E97F1] flex items-center justify-center shadow-lg border border-black/10 transition-transform duration-300 hover:scale-110" title="Fortnite">
        <span className="text-[9px] font-black text-white tracking-tighter">FN</span>
      </div>
    );
  }
  return (
    <div className="w-[26px] h-[26px] rounded bg-zinc-800 flex items-center justify-center shadow-lg border border-zinc-700/80 transition-transform duration-300 hover:scale-110" title={slug}>
      <span className="text-[8px] font-bold text-zinc-400 uppercase">{slug.slice(0, 2)}</span>
    </div>
  );
}

const DEFAULT_GAMES_LIST = [
  { slug: 'cs2', name: 'CS2', fullName: 'Counter-Strike 2' },
  { slug: 'valorant', name: 'VALORANT', fullName: 'VALORANT' },
];

function GameSearchSelect({
  options = DEFAULT_GAMES_LIST,
  selectedValue,
  onChange,
}: {
  options?: { slug: string; name: string; fullName?: string }[];
  selectedValue: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedGameObj = options.find(g => g.slug.toLowerCase() === (selectedValue || '').toLowerCase());

  const displayValue = selectedGameObj
    ? selectedGameObj.name
    : "All Games";

  const filteredOptions = searchQuery.trim().length > 0
    ? options.filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.fullName && g.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : options;

  return (
    <div className="relative w-full sm:w-[180px]" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 bg-black/40 border rounded-xl px-4 flex items-center justify-between gap-2.5 text-xs font-bold transition-all cursor-pointer ${
          selectedValue && selectedValue !== 'all'
            ? 'border-accent/50 text-white bg-accent/5'
            : 'border-border-custom hover:border-zinc-700 text-zinc-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedGameObj ? (
            selectedGameObj.slug === 'valorant' ? (
              <img src="/images/valorant-logo.png" alt="VALORANT" className="w-4 h-4 rounded object-cover shrink-0" />
            ) : selectedGameObj.slug === 'cs2' ? (
              <img src="/images/cs2-logo.png" alt="CS2" className="w-4 h-4 rounded object-cover shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-400 shrink-0">
                {selectedGameObj.slug.slice(0, 2).toUpperCase()}
              </div>
            )
          ) : (
            <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="6" width="20" height="12" rx="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h4m-2-2v4m7-2h.01m3 0h.01" />
            </svg>
          )}
          <span className="truncate">{displayValue}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedValue && selectedValue !== 'all' && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
                setSearchQuery('');
              }}
              className="text-zinc-500 hover:text-zinc-300 text-sm font-bold p-1 cursor-pointer leading-none"
              title="Clear selection"
            >
              ×
            </span>
          )}
          <svg
            className="w-3.5 h-3.5 text-zinc-500 transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-[#0F0F15] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in-50 duration-150 font-sans">
          {/* Search Input Box */}
          <div className="p-2 border-b border-zinc-900 flex items-center gap-2 relative">
            <span className="absolute left-4 text-zinc-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search game..."
              autoFocus
              className="w-full h-8.5 bg-black/60 border border-zinc-850 rounded-lg pl-8 pr-3 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-accent/40 transition-all font-sans"
            />
          </div>

          {/* Options Scroll List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* "All Games" Option */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onChange('all');
                setSearchQuery('');
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-xs cursor-pointer transition-colors flex items-center gap-2.5 ${
                selectedValue === 'all' || !selectedValue
                  ? 'bg-accent/15 text-accent font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-white'
              }`}
            >
              <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700/50 shrink-0 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="6" width="20" height="12" rx="4" />
                </svg>
              </div>
              <span>All Games</span>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 italic">
                No matching games found
              </div>
            ) : (
              filteredOptions.map((game) => {
                const isSelected = game.slug.toLowerCase() === (selectedValue || '').toLowerCase();
                return (
                  <div
                    key={game.slug}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(game.slug);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs cursor-pointer transition-colors flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-accent/15 text-accent font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800/30 hover:text-white'
                    }`}
                  >
                    {game.slug === 'valorant' ? (
                      <img src="/images/valorant-logo.png" alt="VALORANT" className="w-4 h-4 rounded object-cover shrink-0 shadow-sm" />
                    ) : game.slug === 'cs2' ? (
                      <img src="/images/cs2-logo.png" alt="CS2" className="w-4 h-4 rounded object-cover shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700/50 shrink-0 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                        {game.slug.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{game.name}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamSearchSelect({
  options,
  selectedValue,
  onChange,
  placeholder = "Search team..."
}: {
  options: string[];
  selectedValue: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter options based on search query
  const filteredOptions = searchQuery.trim().length > 0
    ? options.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const displayValue = selectedValue === 'all' || !selectedValue ? "All Teams" : selectedValue;

  return (
    <div className="relative w-full sm:w-[200px]" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 bg-black/40 border border-border-custom hover:border-zinc-700 rounded-xl px-4 flex items-center justify-between gap-2.5 text-xs font-bold text-zinc-300 transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
          </svg>
          <span className="truncate">{displayValue}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedValue && selectedValue !== 'all' && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
                setSearchQuery('');
              }}
              className="text-zinc-500 hover:text-zinc-300 text-sm font-bold p-1 cursor-pointer leading-none"
              title="Clear selection"
            >
              ×
            </span>
          )}
          <svg
            className="w-3.5 h-3.5 text-zinc-500 transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-[#0F0F15] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Search Input Box */}
          <div className="p-2 border-b border-zinc-900 flex items-center gap-2 relative">
            <span className="absolute left-4 text-zinc-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full h-8.5 bg-black/60 border border-zinc-850 rounded-lg pl-8 pr-3 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-accent/40 transition-all"
            />
          </div>

          {/* Options Scroll List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* "All Teams" Option */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onChange('all');
                setSearchQuery('');
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-xs cursor-pointer transition-colors flex items-center gap-2.5 ${
                selectedValue === 'all' || !selectedValue
                  ? 'bg-accent/15 text-accent font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-white'
              }`}
            >
              {/* Blank logo container for team name (as the user requested) */}
              <div className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800/50 shrink-0"></div>
              <span>All Teams</span>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 italic">
                No matching teams found
              </div>
            ) : (
              filteredOptions.map((team) => {
                const isSelected = team === selectedValue;
                const logo = getTeamLogo(team);
                return (
                  <div
                    key={team}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(team);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs cursor-pointer transition-colors flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-accent/15 text-accent font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800/30 hover:text-white'
                    }`}
                  >
                    {logo ? (
                      <img src={logo} alt={team} className="w-5 h-5 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800/50 shrink-0"></div>
                    )}
                    <span>{team}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CountrySearchSelect({
  options,
  selectedValue,
  onChange,
  placeholder = "Search country..."
}: {
  options: { code: string; name: string }[];
  selectedValue: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedCountry = options.find(c => c.code === selectedValue);

  const displayValue = selectedCountry
    ? `${getFlagEmoji(selectedCountry.code)} ${selectedCountry.name} (${selectedCountry.code})`
    : "All Nations";

  const filteredOptions = searchQuery.trim().length > 0
    ? options.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : options;

  return (
    <div className="relative w-full sm:w-[200px]" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 bg-black/40 border border-border-custom hover:border-zinc-700 rounded-xl px-4 flex items-center justify-between gap-2.5 text-xs font-bold text-zinc-300 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedCountry ? (
            <img
              src={`https://flagcdn.com/16x12/${selectedCountry.code.toLowerCase()}.png`}
              alt={selectedCountry.code}
              className="w-4 h-3 object-cover rounded-[2px] shrink-0"
            />
          ) : (
            <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-19m0 0a5 5 0 005 5h4a5 5 0 015-5h2v10H9a5 5 0 00-5 5H3" />
            </svg>
          )}
          <span className="truncate">
            {selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : 'All Nations'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedValue && selectedValue !== 'all' && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
                setSearchQuery('');
              }}
              className="text-zinc-500 hover:text-zinc-300 text-sm font-bold p-1 cursor-pointer leading-none"
              title="Clear selection"
            >
              ×
            </span>
          )}
          <svg
            className="w-3.5 h-3.5 text-zinc-500 transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 z-50 w-full mt-1.5 bg-[#0F0F15] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Search Input Box */}
          <div className="p-2 border-b border-zinc-900 flex items-center gap-2 relative">
            <span className="absolute left-4 text-zinc-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full h-8.5 bg-black/60 border border-zinc-850 rounded-lg pl-8 pr-3 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-accent/40 transition-all font-mono"
            />
          </div>

          {/* Options Scroll List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800">
            {/* "All Nations" Option */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onChange('all');
                setSearchQuery('');
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-xs cursor-pointer transition-colors flex items-center gap-2.5 ${
                selectedValue === 'all' || !selectedValue
                  ? 'bg-accent/15 text-accent font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-19m0 0a5 5 0 005 5h4a5 5 0 015-5h2v10H9a5 5 0 00-5 5H3" />
              </svg>
              <span>All Nations</span>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 italic">
                No matching nations found
              </div>
            ) : (
              filteredOptions.map((country) => {
                const isSelected = country.code === selectedValue;
                return (
                  <div
                    key={country.code}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(country.code);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs cursor-pointer transition-colors flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-accent/15 text-accent font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800/30 hover:text-white'
                    }`}
                  >
                    <img
                      src={`https://flagcdn.com/20x15/${country.code.toLowerCase()}.png`}
                      alt={country.code}
                      className="w-5 h-3.5 object-cover rounded-[2px] shrink-0 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span>{country.name} ({country.code})</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // User Authentication & Favorites state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Check login state
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session?.user);
    };
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch favorites from database when user is logged in
  useEffect(() => {
    const fetchDbFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('player_id')
        .eq('user_id', session.user.id);
      
      if (!error && data) {
        setFavorites(data.map(fav => fav.player_id));
      }
    };

    if (isLoggedIn) {
      fetchDbFavorites();
    } else {
      setFavorites([]);
    }
  }, [isLoggedIn]);

  // Toggle favorite in database
  const toggleFavorite = async (playerId: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const isFav = favorites.includes(playerId);
    
    if (isFav) {
      // Remove from DB
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('player_id', playerId);

      if (!error) {
        setFavorites(prev => prev.filter(id => id !== playerId));
      }
    } else {
      // Add to DB
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: session.user.id,
          player_id: playerId
        });

      if (!error) {
        setFavorites(prev => [...prev, playerId]);
      }
    }
  };

  // Filters
  const [selectedGame, setSelectedGame] = useState(() => {
    const gameParam = searchParams.get('game');
    return (gameParam === 'cs2' || gameParam === 'valorant') ? gameParam : 'all';
  });
  const [selectedTeam, setSelectedTeam] = useState(() => {
    return searchParams.get('team') || 'all';
  });
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return searchParams.get('country') || 'all';
  });

  // Sync with searchParams on load/URL change
  useEffect(() => {
    const gameParam = searchParams.get('game');
    const teamParam = searchParams.get('team');
    const countryParam = searchParams.get('country');

    setSelectedGame((gameParam === 'cs2' || gameParam === 'valorant') ? gameParam : 'all');
    setSelectedTeam(teamParam || 'all');
    setSelectedCountry(countryParam || 'all');
  }, [searchParams]);

  // Filter options lists
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [countriesList, setCountriesList] = useState<{ code: string; name: string }[]>([]);

  // Fetch filter options on load
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const teamsRes = await fetch('/api/teams');
        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeamsList(data.teams || []);
        }

        const countriesRes = await fetch('/api/countries');
        if (countriesRes.ok) {
          const data = await countriesRes.json();
          setCountriesList(data.countries || []);
        }
      } catch (err) {
        console.error('Error fetching filter lists:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [selectedGame, selectedTeam, selectedCountry]);

  // Fetch players on parameters change
  useEffect(() => {
    let active = true;

    const fetchPlayers = async () => {
      try {
        setLoading(true);
        let url = `/api/players?page=${pagination.page}&limit=${pagination.limit}`;

        if (debouncedSearch) {
          url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
        }
        if (selectedGame !== 'all') {
          url += `&game=${selectedGame}`;
        }
        if (selectedTeam !== 'all') {
          url += `&team=${encodeURIComponent(selectedTeam)}`;
        }
        if (selectedCountry !== 'all') {
          url += `&country=${selectedCountry}`;
        }

        const response = await fetch(url);
        if (response.ok && active) {
          const data = await response.json();
          setPlayers(data.players || []);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPlayers();

    return () => {
      active = false;
    };
  }, [pagination.page, debouncedSearch, selectedGame, selectedTeam, selectedCountry]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedGame('all');
    setSelectedTeam('all');
    setSelectedCountry('all');
  };

  const getGameBadgeClass = (slug: string) => {
    if (slug === 'valorant') {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 py-16 flex flex-col justify-between space-y-12 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-custom pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
            Esports <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">Athletes Directory</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Browse and inspect configurations of {pagination.total} professional players globally.
          </p>
        </div>

        {/* Active Filters Summary */}
        {(selectedGame !== 'all' || selectedTeam !== 'all' || selectedCountry !== 'all' || search) && (
          <button
            onClick={clearFilters}
            className="self-start md:self-end px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-accent/40 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            RESET ALL FILTERS
          </button>
        )}
      </div>

      {/* Modern Filter Dashboard Bar */}
      <div className="bg-[#12121A]/70 border border-border-custom p-6 rounded-2xl flex flex-col lg:flex-row gap-5 items-stretch lg:items-center justify-between">
        {/* Left Side: Search Box */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500">
            <svg className="h-4.5 w-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type player username, real name or team..."
            className="w-full h-11 bg-black/40 border border-border-custom rounded-xl pl-11 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
          />
        </div>

        {/* Right Side: Filters Group */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Game Dropdown */}
          <GameSearchSelect
            selectedValue={selectedGame}
            onChange={setSelectedGame}
          />

          {/* Team Dropdown */}
          <TeamSearchSelect
            options={teamsList}
            selectedValue={selectedTeam}
            onChange={setSelectedTeam}
          />

          {/* Country Dropdown */}
          <CountrySearchSelect
            options={countriesList}
            selectedValue={selectedCountry}
            onChange={setSelectedCountry}
          />
        </div>
      </div>

      {/* Players Listing (Modern Card Directory Layout) */}
      <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(12)].map((_, idx) => (
              <div key={idx} className="bg-card border border-border-custom h-[290px] rounded-2xl"></div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border-custom rounded-2xl">
            <h3 className="text-sm font-bold text-white mt-4 font-display">No players match your criteria</h3>
            <p className="text-zinc-500 text-xs mt-1 font-mono">Try adjusting your filters or typing another name.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {players.map((player) => {
              const isFav = favorites.includes(player.player_id);
              const teamLogo = getTeamLogo(player.team);
              return (
                <div
                  key={player.settings_id}
                  onClick={() => router.push(`/players/${player.username}`)}
                  className="relative bg-[#12121A]/70 backdrop-blur-md border border-border-custom hover:border-zinc-700/80 rounded-2xl p-6 flex flex-col items-center justify-between text-center hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(245,158,11,0.02)] transition-all duration-300 group cursor-pointer min-h-[300px]"
                >
                  <div className="absolute top-4 left-5 z-20 flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pointer-events-none max-w-[68%]">
                    <TeamLogoImg teamName={player.team} dbLogoUrl={player.team_logo_url} className="w-4.5 h-4.5" />
                    <span className="truncate">{player.team || 'Free Agent'}</span>
                  </div>

                  {/* Floating Star (Favorite) Button at Top Right - Only show if logged in */}
                  {isLoggedIn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(player.player_id);
                      }}
                      className="absolute top-3 right-4.5 z-20 p-1.5 rounded-full hover:bg-white/5 transition-all duration-200"
                      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <svg
                        className={`w-5 h-5 transition-all duration-300 active:scale-75 ${
                          isFav
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                            : 'fill-none text-zinc-650 hover:text-zinc-400'
                        }`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.242.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.773-.568-.375-1.81.587-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  )}

                  {/* 1. Portrait Circle Section */}
                  <div className="relative w-28 h-28 mx-auto mb-4 mt-4 shrink-0">
                    <div className="w-full h-full rounded-full border-2 border-zinc-800/80 bg-gradient-to-b from-zinc-850 to-zinc-950 overflow-hidden flex items-center justify-center shadow-inner relative z-10">
                      {player.profile_img_url ? (
                        <img
                          src={player.profile_img_url}
                          alt={player.username}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900/60 flex items-center justify-center text-2xl font-black text-zinc-500 font-display leading-none">
                          {player.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Game Badge overlap at bottom center */}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
                      {player.games && player.games.map((g) => (
                        <div key={g.slug} className="shrink-0">
                          {renderGameLogo(g.slug)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Info Details */}
                  <div className="w-full flex-1 flex flex-col justify-between pt-2 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-[#FAFAFA] text-lg font-sans group-hover:text-accent transition-colors duration-300 line-clamp-1">
                        {player.username}
                      </h3>
                      <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-sans">
                        <span className="font-medium">{player.real_name || '-'}</span>
                        {player.country_code && (
                          <img
                            src={`https://flagcdn.com/16x12/${player.country_code.toLowerCase()}.png`}
                            alt={player.country_code}
                            title={player.nationality || player.country_code}
                            className="w-4 h-3 object-cover rounded-[2px] shrink-0 shadow-sm"
                          />
                        )}
                      </div>
                    </div>

                    {/* View Profile CTA */}
                    <div className="flex justify-center pt-1 w-full">
                      <div
                        className="flex items-center justify-center gap-1.5 px-5 py-2 w-full max-w-[120px] rounded-lg text-xs font-bold bg-white/5 text-zinc-400 border border-white/5 group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/20 transition-all duration-300"
                      >
                        <span>View Profile</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="px-4 py-2 bg-black/40 hover:bg-[#1A1A24]/40 disabled:opacity-30 text-[#FAFAFA] text-xs font-bold rounded border border-border-custom hover:border-border-hover transition-all duration-300 disabled:cursor-not-allowed font-mono cursor-pointer"
          >
            ← PREV
          </button>

          <span className="text-zinc-500 text-xs font-semibold font-mono">
            PAGE {pagination.page} OF {pagination.pages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages || loading}
            className="px-4 py-2 bg-black/40 hover:bg-[#1A1A24]/40 disabled:opacity-30 text-[#FAFAFA] text-xs font-bold rounded border border-border-custom hover:border-border-hover transition-all duration-300 disabled:cursor-not-allowed font-mono cursor-pointer"
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlayersDirectory() {
  return (
    <Suspense fallback={
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
        <div className="text-zinc-500 text-xs font-mono animate-pulse">Loading players directory...</div>
      </div>
    }>
      <PlayersDirectoryContent />
    </Suspense>
  );
}
