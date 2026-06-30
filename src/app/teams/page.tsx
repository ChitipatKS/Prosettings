'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Player = {
  settings_id: number;
  username: string;
  real_name: string | null;
  team: string | null;
  game: string;
  game_slug: string;
  game_role: string | null;
  mouse_settings: {
    dpi: number | null;
    sens: number | null;
  };
};

function TeamsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTeam = searchParams.get('team');
  const selectedGameFilter = searchParams.get('game');

  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch unique teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Fetch players when a team is selected or game filter is applied
  useEffect(() => {
    if (!selectedTeam) {
      setTeamPlayers([]);
      return;
    }

    const fetchTeamPlayers = async () => {
      try {
        setLoadingPlayers(true);
        const res = await fetch(`/api/players?search=${encodeURIComponent(selectedTeam)}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          // Filter to make sure it's an exact match or closely matching team field
          let players = (data.players || []).filter((p: Player) => 
            p.team?.toLowerCase() === selectedTeam.toLowerCase()
          );
          if (selectedGameFilter) {
            players = players.filter((p: Player) => p.game_slug === selectedGameFilter);
          }
          setTeamPlayers(players);
        }
      } catch (err) {
        console.error('Error fetching team players:', err);
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchTeamPlayers();
  }, [selectedTeam, selectedGameFilter]);

  const filteredTeams = teams.filter(team => 
    team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGameBadgeClass = (slug: string) => {
    if (slug === 'valorant') {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 py-16 flex flex-col space-y-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
          Professional <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">Esports Teams</span>
        </h1>
        <p className="text-sm text-zinc-400">
          Browse professional esports organizations and discover the setups, gear, and sensitivities of their active players.
        </p>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Section: Team Selector List */}
        <div className="lg:col-span-1 space-y-4 bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-xl">
          <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
            Find Team ({filteredTeams.length})
          </h3>
          
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team names..."
              className="w-full h-10 bg-black/40 border border-border-custom rounded-xl pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5 pr-1">
            {loading ? (
              <div className="text-center py-8 text-zinc-500 text-xs font-mono">Loading teams...</div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs font-mono">No teams found</div>
            ) : (
              filteredTeams.map((teamName) => (
                <button
                  key={teamName}
                  onClick={() => {
                    router.push(`/teams?team=${encodeURIComponent(teamName)}`);
                  }}
                  className={`w-full text-left px-3 py-3 text-xs font-semibold font-display tracking-wide rounded-md transition-colors flex items-center justify-between ${
                    selectedTeam === teamName 
                      ? 'bg-accent/10 text-accent border-l-2 border-accent pl-2' 
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{teamName}</span>
                  <svg className={`h-3 w-3 text-zinc-500 ${selectedTeam === teamName ? 'text-accent' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Section: Selected Team Roster Display */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <div className="bg-[#12121A]/80 border border-border-custom p-6 sm:p-8 rounded-xl min-h-[450px] flex flex-col justify-between">
              <div>
                {/* Team Header banner */}
                <div className="border-b border-white/5 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-accent font-mono uppercase tracking-widest">
                      {selectedGameFilter ? `${selectedGameFilter.toUpperCase()} Active Roster` : 'Active Roster'}
                    </span>
                    <h2 className="text-3xl font-extrabold text-white font-display mt-1">{selectedTeam}</h2>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono font-semibold">
                    {teamPlayers.length} {teamPlayers.length === 1 ? 'Player' : 'Players'} found
                  </span>
                </div>

                {/* Team players list */}
                {loadingPlayers ? (
                  <div className="space-y-4 py-8">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="h-16 bg-white/5 rounded-2xl animate-pulse border border-border-custom"></div>
                    ))}
                  </div>
                ) : teamPlayers.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 text-xs font-mono">
                    No active players recorded for this team.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teamPlayers.map((player) => (
                      <Link
                        key={player.settings_id}
                        href={`/players/${player.username}`}
                        className="bg-black/20 border border-border-custom p-4 rounded-2xl flex items-center justify-between hover:border-accent/40 hover:bg-[#1A1A24]/30 hover:scale-[1.01] transition-all duration-300 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#FAFAFA] text-sm group-hover:text-accent font-display transition-colors">
                              {player.username}
                            </span>
                            {player.game_role && (
                              <span className="text-[9px] text-zinc-500 font-mono tracking-wider font-semibold uppercase bg-white/5 px-1.5 py-0.5 rounded">
                                {player.game_role}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            Sens: <span className="text-zinc-200">{player.mouse_settings.sens || '—'}</span> | DPI: <span className="text-zinc-200">{player.mouse_settings.dpi || '—'}</span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-wider py-0.5 px-2 rounded font-mono ${getGameBadgeClass(player.game_slug)}`}>
                          {player.game}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Banner */}
              <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-zinc-500 font-mono">
                Click a player roster card to inspect their complete sensitivity values, PC specs, and equipment setup.
              </div>
            </div>
          ) : (
            <div className="bg-card backdrop-blur-[8px] border border-dashed border-border-custom rounded-xl p-8 min-h-[450px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-white/5 border border-border-custom flex items-center justify-center text-zinc-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.97 5.97 0 00-.75-2.906m-.75 2.906a5.986 5.986 0 01-1.077-2.906M6 18.72a9.094 9.094 0 01-3.741-.479 3 3 0 014.682-2.72m-.94 3.198l-.001.031c0 .225.012.447.037.666A11.944 11.944 0 0012 21c2.17 0 4.207-.576 5.963-1.584A6.062 6.062 0 0018 18.719m-12 0a5.97 5.97 0 01.75-2.906m.75 2.906a5.986 5.986 0 001.077-2.906M15 8.25a3 3 0 11-6 0 3 3 0 016 0zm6 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5-2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-display">No Organization Selected</h3>
                <p className="text-xs text-zinc-500 font-mono">Select an esports team from the menu to load its active roster.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 py-16 flex items-center justify-center min-h-[600px]">
        <div className="text-center py-8 text-zinc-500 text-xs font-mono">Loading Dashboard...</div>
      </div>
    }>
      <TeamsContent />
    </Suspense>
  );
}
