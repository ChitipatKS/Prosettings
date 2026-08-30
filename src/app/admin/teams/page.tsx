'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import TeamLogoImg from '@/components/TeamLogoImg';
import { getTeamLogo, setCustomLogoMap } from '@/lib/teamLogos';

type PlayerSimple = {
  id: number;
  username: string;
  Full_name?: string | null;
  full_name?: string | null;
  real_name?: string | null;
  profile_img_url?: string | null;
  team?: string | null;
  game?: string | number | null;
};

type TeamObj = {
  id?: number | null;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  games?: string[] | string | null;
  region?: string | null;
  players?: PlayerSimple[];
};

const AVAILABLE_GAMES = [
  { id: 'VALORANT', label: 'VALORANT', color: 'border-red-500/40 text-red-400 bg-red-500/10' },
  { id: 'CS2', label: 'Counter-Strike 2', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { id: 'Apex Legends', label: 'Apex Legends', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
  { id: 'PUBG', label: 'PUBG', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
  { id: 'Overwatch 2', label: 'Overwatch 2', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { id: 'Rainbow Six', label: 'Rainbow Six', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { id: 'League of Legends', label: 'League of Legends', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' }
];

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamObj[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState('all');

  // Pagination state for Teams
  const [teamsPage, setTeamsPage] = useState(1);
  const teamsLimit = 50;

  // Unified Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamObj | null>(null);

  // Form Fields
  const [teamName, setTeamName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [teamRegion, setTeamRegion] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(number | string)[]>([]);

  // File Upload State
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Player search inside modal
  const [modalPlayerSearch, setModalPlayerSearch] = useState('');

  // Custom confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    isAlertOnly?: boolean;
  } | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isAlertOnly: boolean = false
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      },
      onCancel: isAlertOnly ? undefined : () => {
        setConfirmModal(null);
      },
      isAlertOnly
    });
  };

  useEffect(() => {
    if (modalPlayerSearch.trim().length >= 1) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await fetch(`/api/players?all=true&search=${encodeURIComponent(modalPlayerSearch.trim())}`);
          const data = await res.json();
          if (data.players) {
            setAllPlayers(prev => {
              const existingIds = new Set(prev.map(p => String(p.id)));
              const newPlayers = data.players.filter((p: PlayerSimple) => !existingIds.has(String(p.id)));
              return [...prev, ...newPlayers];
            });
          }
        } catch (e) {
          console.error('Failed to search players:', e);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [modalPlayerSearch]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeams();
    fetchAllPlayers();
  }, []);

  const fetchTeams = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.teamObjects) {
        setTeams(data.teamObjects);
        const map: Record<string, string> = {};
        data.teamObjects.forEach((t: any) => {
          if (t.name && t.logo_url) {
            map[t.name.toLowerCase().trim()] = t.logo_url;
          }
        });
        setCustomLogoMap(map);
      }
    } catch (e: any) {
      console.error('Failed to load teams:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAllPlayers = async () => {
    try {
      const res = await fetch('/api/players?all=true');
      const data = await res.json();
      if (data.players) {
        setAllPlayers(data.players);
      }
    } catch (e: any) {
      console.error('Failed to load players:', e);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setTeamName('');
    setLogoUrl('');
    setTeamDescription('');
    setSelectedGames(['VALORANT']);
    setTeamRegion('');
    setSelectedPlayerIds([]);
    setSelectedFile(null);
    setFilePreview(null);
    setLogoInputType('upload');
    setModalPlayerSearch('');
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: TeamObj) => {
    setEditingTeam(t);
    setTeamName(t.name || '');
    setLogoUrl(t.logo_url || '');
    setTeamDescription(t.description || '');

    const parsedGames = Array.isArray(t.games)
      ? t.games
      : (typeof t.games === 'string' && t.games ? t.games.split(',') : []);
    setSelectedGames(parsedGames);

    setTeamRegion(t.region || '');

    // Append any players in t.players that are not already in allPlayers to allPlayers
    if (t.players && t.players.length > 0) {
      setAllPlayers(prev => {
        const existingIds = new Set(prev.map(p => String(p.id)));
        const missingPlayers = t.players!.filter(p => !existingIds.has(String(p.id)));
        if (missingPlayers.length > 0) {
          const formattedMissing = missingPlayers.map(p => ({
            id: p.id,
            username: p.username,
            real_name: p.Full_name || p.full_name || p.real_name || null,
            team: t.name,
            profile_img_url: p.profile_img_url || null
          }));
          return [...prev, ...formattedMissing];
        }
        return prev;
      });
    }

    // Existing team players pre-check logic (strict String ID deduplication)
    const teamNameClean = (t.name || '').trim().toLowerCase();

    const idsFromTeamObj = (t.players || [])
      .map(p => (p.id !== undefined && p.id !== null ? String(p.id) : String(p.username)))
      .filter(Boolean);

    const idsFromAllPlayers = allPlayers
      .filter(p => p.team && p.team.trim().toLowerCase() === teamNameClean)
      .map(p => (p.id !== undefined && p.id !== null ? String(p.id) : String(p.username)));

    const uniquePlayerIds = Array.from(new Set([...idsFromTeamObj, ...idsFromAllPlayers]));
    setSelectedPlayerIds(uniquePlayerIds);

    setSelectedFile(null);
    setFilePreview(null);
    setLogoInputType('upload');
    setModalPlayerSearch('');
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const toggleGameSelection = (gameId: string) => {
    setSelectedGames(prev =>
      prev.includes(gameId) ? prev.filter(g => g !== gameId) : [...prev, gameId]
    );
  };

  const togglePlayerSelection = (playerId: number | string) => {
    const targetId = String(playerId);
    const playerObj = allPlayers.find(p => String(p.id) === targetId);

    const performToggle = () => {
      setSelectedPlayerIds(prev => {
        const prevStrings = prev.map(String);
        if (prevStrings.includes(targetId)) {
          return prev.filter(id => String(id) !== targetId);
        } else {
          return [...prev, targetId];
        }
      });
    };

    if (playerObj) {
      const isCurrentlyChecked = selectedPlayerIds.map(String).includes(targetId);

      if (isCurrentlyChecked) {
        // Mark Out (Unchecking)
        // If the player is currently in this team, ask for confirmation
        const currentEditingTeamName = editingTeam?.name || '';
        const playerCurrentTeam = playerObj.team || '';

        if (
          currentEditingTeamName &&
          playerCurrentTeam.toLowerCase().trim() === currentEditingTeamName.toLowerCase().trim()
        ) {
          showConfirm(
            'Confirm Roster Removal',
            `Are you sure you want to remove ${playerObj.username} from ${currentEditingTeamName}?`,
            performToggle
          );
          return;
        }
      } else {
        // Mark In (Checking)
        // If the player already belongs to another team, ask for confirmation
        const currentEditingTeamName = editingTeam?.name || teamName || 'this team';
        const playerCurrentTeam = (playerObj.team || '').trim();

        if (
          playerCurrentTeam &&
          playerCurrentTeam !== '-' &&
          playerCurrentTeam.toLowerCase() !== 'none' &&
          playerCurrentTeam.toLowerCase() !== 'free agent' &&
          playerCurrentTeam.toLowerCase() !== currentEditingTeamName.toLowerCase()
        ) {
          showConfirm(
            'Confirm Team Transfer',
            `${playerObj.username} is currently in team "${playerCurrentTeam}". Are you sure you want to transfer them to ${currentEditingTeamName}?`,
            performToggle
          );
          return;
        }
      }
    }

    performToggle();
  };

  const handleSubmitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setMessage({ type: 'error', text: 'Team name is required' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      let finalLogoUrl = logoUrl;

      // Handle File Upload if selected
      if (logoInputType === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || uploadData.error) {
          throw new Error(uploadData.error || 'Upload failed');
        }
        finalLogoUrl = uploadData.url;
      }

      const payload = {
        id: editingTeam?.id || null,
        name: teamName.trim(),
        logo_url: finalLogoUrl,
        description: teamDescription,
        games: selectedGames,
        region: teamRegion,
        assigned_player_ids: selectedPlayerIds
      };

      const method = editingTeam ? 'PUT' : 'POST';

      const res = await fetch('/api/teams', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Failed to save team');
      }

      setMessage({ type: 'success', text: `Team "${teamName}" saved successfully!` });
      setTimeout(() => {
        setIsModalOpen(false);
        fetchTeams();
        fetchAllPlayers();
      }, 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (t: TeamObj) => {
    showConfirm(
      'Confirm Team Deletion',
      `Are you sure you want to delete team "${t.name}"? This action cannot be undone and will unassign all roster players.`,
      async () => {
        try {
          // Optimistically remove the team from the UI state
          setTeams(prev => prev.filter(item => item.id !== t.id && item.name !== t.name));

          const res = await fetch(`/api/teams?id=${t.id || ''}&name=${encodeURIComponent(t.name)}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error('Delete failed');
          fetchTeams(true); // Silent reload to sync team statistics in background
        } catch (e: any) {
          fetchTeams(); // Rollback if error occurs
          showConfirm(
            'Deletion Error',
            `Failed to delete team "${t.name}". Please try again.`,
            () => {},
            true
          );
        }
      }
    );
  };

  // Filtered teams list
  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const gamesArr = Array.isArray(t.games)
      ? t.games
      : (typeof t.games === 'string' && t.games ? t.games.split(',') : []);
    const matchesGame = selectedGameFilter === 'all' || (gamesArr.length > 0 ? gamesArr.some(g => g.toLowerCase().includes(selectedGameFilter)) : true);
    return matchesSearch && matchesGame;
  });

  // Teams table pagination calculation
  const totalPages = Math.ceil(filteredTeams.length / teamsLimit) || 1;
  const paginatedTeams = filteredTeams.slice(
    (teamsPage - 1) * teamsLimit,
    teamsPage * teamsLimit
  );

  const teamsWithLogoCount = teams.filter(t => !!getTeamLogo(t.name, t.logo_url)).length;
  const teamsWithoutLogoCount = teams.length - teamsWithLogoCount;

  // Modal Player Filter & Sort (Checked players pinned to top, hide unchecked unless searching to prevent lag)
  const fullFilteredModalPlayers = allPlayers
    .filter(p => {
      const pId = p.id !== undefined && p.id !== null ? String(p.id) : String(p.username);
      const isChecked = selectedPlayerIds.map(String).includes(pId);
      const q = modalPlayerSearch.trim().toLowerCase();

      // If not searching, only show checked players
      if (q === '') {
        return isChecked;
      }

      // If searching, show checked players OR anyone matching search
      const matchesSearch = p.username.toLowerCase().includes(q) ||
        (p.real_name && p.real_name.toLowerCase().includes(q));
      return isChecked || matchesSearch;
    })
    .sort((a, b) => {
      const aId = a.id !== undefined && a.id !== null ? String(a.id) : String(a.username);
      const bId = b.id !== undefined && b.id !== null ? String(b.id) : String(b.username);
      const selectedStrings = selectedPlayerIds.map(String);
      const aChecked = selectedStrings.includes(aId);
      const bChecked = selectedStrings.includes(bId);

      if (aChecked && !bChecked) return -1;
      if (!aChecked && bChecked) return 1;
      return a.username.localeCompare(b.username);
    });

  const totalModalPlayersMatching = fullFilteredModalPlayers.length;
  const modalPlayerLimit = 20;
  const filteredModalPlayers = fullFilteredModalPlayers.slice(0, modalPlayerLimit);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#12121A]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white font-display">TEAMS & LOGO MANAGEMENT</h1>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-zinc-950 rounded-xl text-xs font-extrabold font-mono tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <span>+ ADD NEW TEAM</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#12121A]/60 border border-border-custom p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Total Teams</p>
              <p className="text-2xl font-extrabold text-white mt-1 font-display">{teams.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-lg font-mono">
              🛡️
            </div>
          </div>

          <div className="bg-[#12121A]/60 border border-border-custom p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Teams With Logo</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-display">{teamsWithLogoCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
              🖼️
            </div>
          </div>

          <div className="bg-[#12121A]/60 border border-border-custom p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Teams Without Logo</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1 font-display">{teamsWithoutLogoCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg font-mono">
              ⚠️
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-[#12121A]/80 border border-border-custom p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search team name..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setTeamsPage(1);
              }}
              className="w-full bg-black/40 border border-border-custom rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 transition-all font-mono"
            />
          </div>

          <div className="flex bg-black/40 border border-border-custom p-1 rounded-xl font-mono text-[10px]">
            {['all', 'valorant', 'cs2'].map(game => (
              <button
                key={game}
                onClick={() => {
                  setSelectedGameFilter(game);
                  setTeamsPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${selectedGameFilter === game ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {game}
              </button>
            ))}
          </div>
        </div>

        {/* Teams Table */}
        <div className="bg-[#12121A]/80 border border-border-custom rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-xs">
              Loading teams directory...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-xs">
              No teams found matching search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20 text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-[12%]">Logo</th>
                    <th className="py-3.5 px-4 w-[43%]">Team Name</th>
                    <th className="py-3.5 px-4 w-[15%]">Games</th>
                    <th className="py-3.5 px-4 w-[15%]">Players Count</th>
                    <th className="py-3.5 px-4 w-[15%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-sans">
                  {paginatedTeams.map((t, idx) => {
                    const gamesArr = Array.isArray(t.games)
                      ? t.games
                      : (typeof t.games === 'string' && t.games ? t.games.split(',') : []);
                    const playerCount = t.players?.length || allPlayers.filter(p => p.team && p.team.toLowerCase() === t.name.toLowerCase()).length;

                    return (
                      <tr key={t.id ? `team-${t.id}` : `team-${t.name}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 align-middle">
                          <TeamLogoImg teamName={t.name} dbLogoUrl={t.logo_url} className="w-8 h-8 rounded-lg bg-black/40 p-1 border border-white/10" />
                        </td>
                        <td className="py-3 px-4 align-middle overflow-hidden">
                          <span className="font-extrabold text-white text-sm font-display block truncate w-full" title={t.name}>{t.name}</span>
                          {t.description && (
                            <span className="text-[10px] text-zinc-400 block truncate mt-0.5 w-full" title={t.description}>{t.description}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex flex-wrap gap-1">
                            {gamesArr.length > 0 ? (
                              gamesArr.map(g => (
                                <span key={g} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-zinc-300">
                                  {g}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-600 font-mono text-[10px]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle font-mono font-bold text-zinc-300">
                          {playerCount} Players
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(t)}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-[11px] font-mono transition-all cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between font-mono text-xs select-none">
                  <div className="text-zinc-500">
                    Showing <span className="text-zinc-300 font-bold">{filteredTeams.length === 0 ? 0 : (teamsPage - 1) * teamsLimit + 1}</span> to{" "}
                    <span className="text-zinc-300 font-bold">{Math.min(filteredTeams.length, teamsPage * teamsLimit)}</span> of{" "}
                    <span className="text-zinc-300 font-bold">{filteredTeams.length}</span> teams
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={teamsPage === 1}
                      onClick={() => setTeamsPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold"
                    >
                      PREV
                    </button>
                    <span className="text-zinc-400 px-2">
                      PAGE <span className="text-accent font-extrabold">{teamsPage}</span> OF <span className="text-zinc-300 font-bold">{totalPages}</span>
                    </span>
                    <button
                      type="button"
                      disabled={teamsPage === totalPages}
                      onClick={() => setTeamsPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ═══ Unified Create / Edit Team Modal ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12121A] border border-border-custom rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div>
                <h3 className="text-lg font-extrabold text-white font-display">
                  {editingTeam ? `Edit Team: ${editingTeam.name}` : 'Create New Team'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Configure team name, logo, description, games, and roster assignment
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-2 rounded-lg bg-white/5 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTeam} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
              {message && (
                <div className={`p-3 rounded-xl text-xs font-mono font-bold ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                  {message.text}
                </div>
              )}

              {/* 1. TEAM NAME */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block mb-1.5">
                  1. Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="e.g. Sentinels, Paper Rex, Team Vitality"
                  className="w-full h-11 bg-black/40 border border-border-custom rounded-xl px-4 text-sm text-white font-bold placeholder-zinc-600 focus:outline-none focus:border-accent/50 transition-all font-display"
                />
              </div>

              {/* 2. LOGO ASSET */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                  2. Team Logo Image
                </label>

                {/* Live Preview Bar */}
                <div className="flex items-center justify-between gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <TeamLogoImg teamName={teamName || 'Team'} dbLogoUrl={logoUrl} className="w-9 h-9" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block">Logo Live Preview</span>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 truncate max-w-[260px] sm:max-w-[340px]">
                        {filePreview
                          ? 'New local file selected'
                          : logoUrl === 'none'
                          ? 'Logo explicitly removed'
                          : logoUrl
                          ? logoUrl
                          : getTeamLogo(teamName, '')
                          ? 'Using auto static logo fallback'
                          : 'No logo set'}
                      </span>
                    </div>
                  </div>

                  {(filePreview || (logoUrl && logoUrl !== 'none') || (!logoUrl && logoUrl !== 'none' && !!getTeamLogo(teamName, ''))) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        setLogoUrl('none');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all font-mono text-[9px] font-bold cursor-pointer uppercase shrink-0"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-black/40 border border-border-custom p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLogoInputType('upload')}
                    className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${logoInputType === 'upload' ? 'bg-accent text-zinc-950' : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    📁 UPLOAD FILE
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputType('url')}
                    className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${logoInputType === 'url' ? 'bg-accent text-zinc-950' : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    🔗 IMAGE URL
                  </button>
                </div>

                {logoInputType === 'upload' ? (
                  <div key="logo-upload-container">
                    <input
                      key="logo-file-input"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 hover:border-accent/50 bg-black/20 p-5 rounded-xl text-center cursor-pointer transition-all"
                    >
                      <span className="text-xl block mb-1">📤</span>
                      <span className="text-xs font-bold text-white block">
                        {selectedFile ? selectedFile.name : 'Click to select image file from computer'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-1">Supports Transparent PNG, SVG, WebP</span>
                    </div>
                  </div>
                ) : (
                  <div key="logo-url-container">
                    <input
                      key="logo-url-input"
                      type="url"
                      value={logoUrl || ''}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full h-10 bg-black/40 border border-border-custom rounded-xl px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent/50 transition-all font-mono"
                    />
                  </div>
                )}
              </div>

              {/* 3. DESCRIPTION */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block mb-1.5">
                  3. Team Description
                </label>
                <textarea
                  rows={3}
                  value={teamDescription}
                  onChange={e => setTeamDescription(e.target.value)}
                  placeholder="Enter team details, history, region background, or competitive overview..."
                  className="w-full bg-black/40 border border-border-custom rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent/50 transition-all font-sans leading-relaxed"
                />
              </div>

              {/* 4. GAMES SELECTION */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block mb-2">
                  4. Games Played (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_GAMES.map(g => {
                    const isSelected = selectedGames.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGameSelection(g.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${isSelected
                          ? `${g.color} shadow-sm`
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                          }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. PLAYERS IN TEAM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                    5. Players in Team ({Array.from(new Set(selectedPlayerIds.map(String))).length} Selected)
                  </label>
                  <span className="text-[10px] text-accent font-mono">
                    Check players to assign to this team
                  </span>
                </div>

                <div className="bg-black/40 border border-border-custom rounded-xl p-3 space-y-3">
                  <input
                    type="text"
                    placeholder="Search player name to add..."
                    value={modalPlayerSearch}
                    onChange={e => setModalPlayerSearch(e.target.value)}
                    className="w-full h-8 bg-black/60 border border-white/10 rounded-lg px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent/50 font-mono"
                  />

                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {totalModalPlayersMatching > modalPlayerLimit && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-center text-[10px] font-mono text-amber-400 sticky top-0 z-10 backdrop-blur-md mb-2">
                        Showing top 20 of {totalModalPlayersMatching} matches. Narrow your search.
                      </div>
                    )}
                    {filteredModalPlayers.length === 0 ? (
                      <div className="text-center py-4 text-xs font-mono text-zinc-600">
                        No players found matching search.
                      </div>
                    ) : (
                      filteredModalPlayers.map((p, idx) => {
                        const pId = p.id !== undefined && p.id !== null ? String(p.id) : String(p.username);
                        const isChecked = selectedPlayerIds.map(String).includes(pId);
                        return (
                          <div
                            key={`player-item-${pId}-${idx}`}
                            onClick={() => togglePlayerSelection(pId)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all select-none ${isChecked
                              ? 'bg-amber-500/10 border-amber-500/40 text-white font-bold shadow-sm'
                              : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 font-bold text-[10px] ${isChecked ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'border-zinc-600 bg-black/40'
                                }`}>
                                {isChecked && '✓'}
                              </div>
                              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-accent font-mono">
                                {p.profile_img_url ? (
                                  <img src={p.profile_img_url} alt={p.username} className="w-full h-full object-cover" />
                                ) : (
                                  p.username[0]?.toUpperCase()
                                )}
                              </div>
                              <div>
                                <span className="text-xs font-bold font-display block">{p.username}</span>
                                {p.real_name && (
                                  <span className="text-[10px] text-zinc-400 block">{p.real_name}</span>
                                )}
                              </div>
                            </div>

                            {p.team && p.team.trim().toLowerCase() !== teamName.trim().toLowerCase() && (
                              <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                                currently in {p.team}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-zinc-950 rounded-xl text-xs font-mono font-extrabold transition-all disabled:opacity-50 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  {saving ? 'SAVING TEAM...' : editingTeam ? 'SAVE TEAM CHANGES' : 'CREATE NEW TEAM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Styled Confirmation Dialog */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#12121A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-fade-in font-sans">
            {/* Top gold-orange accent line */}
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  ⚠️
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  {confirmModal.title}
                </h3>
              </div>

              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {confirmModal.message}
              </p>

              <div className="flex justify-end gap-3 pt-2 font-mono text-[10px] font-bold">
                {!confirmModal.isAlertOnly && (
                  <button
                    type="button"
                    onClick={confirmModal.onCancel}
                    className="px-4 py-2.5 rounded-xl border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>
                )}
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer uppercase"
                >
                  {confirmModal.isAlertOnly ? 'OK' : 'CONFIRM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
