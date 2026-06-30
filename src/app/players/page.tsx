'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (selectedValue && selectedValue !== 'all') {
      setSearchQuery(selectedValue);
    } else {
      setSearchQuery('');
    }
  }, [selectedValue]);

  const filteredOptions = searchQuery.trim().length > 0
    ? options.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="relative w-full sm:w-[200px]">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
              onChange('all');
            }
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={selectedValue === 'all' || !selectedValue ? "All Teams" : selectedValue}
          className="w-full h-11 bg-black/40 border border-border-custom rounded-xl px-4 pr-10 text-xs font-bold text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all font-mono"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {selectedValue && selectedValue !== 'all' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
                setSearchQuery('');
              }}
              className="text-zinc-500 hover:text-zinc-300 text-sm font-bold p-1 cursor-pointer font-mono leading-none"
              title="Clear selection"
            >
              ×
            </button>
          )}
          <span 
            className="text-zinc-500 pointer-events-none text-[8px] transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        </div>

        {isOpen && searchQuery.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-[#0F0F15] border border-zinc-800 rounded-xl shadow-2xl divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 italic font-mono">
                No matching teams found
              </div>
            ) : (
              filteredOptions.map((team) => {
                const isSelected = team === selectedValue;
                return (
                  <div
                    key={team}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(team);
                      setSearchQuery(team);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-accent/15 text-accent font-bold' 
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    {team}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
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

  const selectedCountry = options.find(c => c.code === selectedValue);

  useEffect(() => {
    if (selectedCountry) {
      setSearchQuery(`${selectedCountry.name} (${selectedCountry.code})`);
    } else {
      setSearchQuery('');
    }
  }, [selectedCountry]);

  const filteredOptions = searchQuery.trim().length > 0
    ? options.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="relative w-full sm:w-[200px]">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
              onChange('all');
            }
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={selectedValue === 'all' || !selectedCountry ? "All Nations" : `${selectedCountry.name} (${selectedCountry.code})`}
          className="w-full h-11 bg-black/40 border border-border-custom rounded-xl px-4 pr-10 text-xs font-bold text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all font-mono"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {selectedValue && selectedValue !== 'all' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
                setSearchQuery('');
              }}
              className="text-zinc-500 hover:text-zinc-300 text-sm font-bold p-1 cursor-pointer font-mono leading-none"
              title="Clear selection"
            >
              ×
            </button>
          )}
          <span 
            className="text-zinc-500 pointer-events-none text-[8px] transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        </div>

        {isOpen && searchQuery.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-[#0F0F15] border border-zinc-800 rounded-xl shadow-2xl divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 italic font-mono">
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
                      setSearchQuery(`${country.name} (${country.code})`);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-accent/15 text-accent font-bold' 
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    {country.name} ({country.code})
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayersDirectory() {
  const router = useRouter();
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
  
  // Filters
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');

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
        if (response.ok) {
          const data = await response.json();
          setPlayers(data.players || []);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
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
          {/* Game Segment Selector */}
          <div className="flex bg-black/40 border border-border-custom p-1 rounded-xl items-center">
            <button
              onClick={() => setSelectedGame('all')}
              className={`h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                selectedGame === 'all' ? 'bg-accent text-accent-fg shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedGame('cs2')}
              className={`h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                selectedGame === 'cs2' ? 'bg-amber-500/10 text-accent border border-accent/20' : 'text-zinc-400 hover:text-white'
              }`}
            >
              CS2
            </button>
            <button
              onClick={() => setSelectedGame('valorant')}
              className={`h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                selectedGame === 'valorant' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-zinc-400 hover:text-white'
              }`}
            >
              VALORANT
            </button>
          </div>

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
            <h3 className="text-sm font-bold text-white mt-4 font-display">No pro players match your criteria</h3>
            <p className="text-zinc-500 text-xs mt-1 font-mono">Try adjusting your filters or typing another name.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {players.map((player) => (
              <div
                key={player.settings_id}
                onClick={() => router.push(`/players/${player.username}`)}
                className="bg-card backdrop-blur-[8px] border border-border-custom rounded-2xl flex flex-col justify-between hover:border-accent/30 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.05)] transition-all duration-300 group overflow-hidden cursor-pointer"
              >
                {/* 1. Portrait Section with Glow */}
                <div className="relative h-44 bg-[#0F0F15] flex items-center justify-center border-b border-white/5 overflow-hidden">
                  
                  {/* Subtle background glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/15 transition-all duration-300"></div>

                  {player.profile_img_url ? (
                    <img 
                      src={player.profile_img_url} 
                      alt={player.username} 
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-5xl font-black text-white/10 group-hover:text-accent/20 transition-colors duration-300 font-display">
                      {player.username[0].toUpperCase()}
                    </span>
                  )}

                  {/* Corner Game Badge */}
                  <span className={`absolute top-3 right-3 text-[8px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md font-mono z-20 ${getGameBadgeClass(player.game_slug)}`}>
                    {player.game}
                  </span>
                </div>

                {/* 2. Info details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-[#FAFAFA] text-lg font-display group-hover:text-accent transition-colors duration-300 line-clamp-1">
                        {player.username}
                      </h3>
                      {player.country_code && (
                        <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-wider" title={player.nationality || ''}>
                          {player.country_code}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs font-bold text-accent/80 font-mono tracking-wide line-clamp-1">
                      {player.real_name || '-'}
                    </p>
                  </div>

                  {/* Team Tag pill badge in place of specs preview box and button */}
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (player.team) {
                          router.push(`/teams?team=${encodeURIComponent(player.team)}&game=${player.game_slug}`);
                        } else {
                          router.push(`/teams`);
                        }
                      }}
                      className="inline-block text-center text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl bg-accent/5 text-accent border border-accent/15 font-mono w-full hover:bg-accent/20 hover:border-accent/40 active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                      {player.team || 'Free Agent'}
                    </button>
                  </div>
                </div>

              </div>
            ))}
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
