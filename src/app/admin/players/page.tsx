'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type PlayerListItem = {
  id: number;
  username: string;
  real_name: string | null;
  team: string | null;
  country_code: string | null;
  profile_img_url: string | null;
  created_at: string;
};

export default function AdminPlayersList() {
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

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
 
  const limit = 50;
 
  async function loadPlayers(silent: boolean = false) {
    try {
      if (!silent) setLoading(true);
      const from = (page - 1) * limit;
      const to = from + limit - 1;
 
      let selectStr = 'id, username, Full_name, team, country_code, profile_img_url, created_at';
      if (selectedGame !== 'all') {
        selectStr += ', player_game_settings!inner(game_id)';
      }

      let query = supabase
        .from('players')
        .select(selectStr, { count: 'exact' });
 
      if (search.trim()) {
        query = query.or(`username.ilike.%${search}%,Full_name.ilike.%${search}%,team.ilike.%${search}%`);
      }

      if (selectedGame === 'valorant') {
        query = query.eq('player_game_settings.game_id', 2);
      } else if (selectedGame === 'cs2') {
        query = query.eq('player_game_settings.game_id', 3);
      }
 
      const { data, error, count } = await query
        .order('team', { ascending: true, nullsFirst: false })
        .order('username', { ascending: true })
        .range(from, to);
 
      if (error) throw error;
 
      if (data) {
        const mapped = (data as any[]).map((p: any) => ({
          id: p.id,
          username: p.username,
          real_name: p.Full_name || p.full_name || p.real_name || null,
          team: p.team,
          country_code: p.country_code,
          profile_img_url: p.profile_img_url,
          created_at: p.created_at
        }));
        setPlayers(mapped);
        setTotalCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / limit) || 1);
      }
    } catch (err) {
      console.error('Error loading players:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }
 
  // Reload when page, search query or game filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPlayers();
    }, 300); // debounce search input
 
    return () => clearTimeout(timer);
  }, [page, search, selectedGame]);

  // Handle single player deletion
  const handleDeletePlayer = async (id: number, username: string) => {
    showConfirm(
      'Confirm Player Deletion',
      `Are you sure you want to delete player "${username}"? This will delete all their game settings, gear references, and comments.`,
      async () => {
        try {
          setDeletingId(id);
          // Optimistically remove from state
          setPlayers(prev => prev.filter(p => p.id !== id));
          setSelectedIds(prev => prev.filter(item => item !== id));

          // 1. Delete player game settings
          const { error: settingsError } = await supabase
            .from('player_game_settings')
            .delete()
            .eq('player_id', id);
          
          if (settingsError) throw settingsError;

          // 2. Delete player gear products references
          const { error: productsError } = await supabase
            .from('player_products')
            .delete()
            .eq('player_id', id);

          if (productsError) throw productsError;

          // 3. Delete player favorites
          await supabase
            .from('user_favorites')
            .delete()
            .eq('player_id', id);

          // 4. Delete player from players table
          const { error: playerError } = await supabase
            .from('players')
            .delete()
            .eq('id', id);

          if (playerError) throw playerError;

          loadPlayers(true); // Silent background sync
        } catch (err: any) {
          loadPlayers(); // Rollback list state
          showConfirm(
            'Deletion Error',
            `Error deleting player: ${err.message}`,
            () => {},
            true
          );
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  // Handle multi-select checkboxes
  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrentPage = () => {
    const pageIds = players.map(p => p.id);
    const isAllPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

    if (isAllPageSelected) {
      // Unselect all on current page
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      // Select all on current page
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Handle bulk / batch delete
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;

    showConfirm(
      'Confirm Bulk Deletion',
      `Are you sure you want to permanently delete ${selectedIds.length} selected player(s)? This will delete all their game settings, gear references, and comments.`,
      async () => {
        try {
          setIsBatchDeleting(true);
          const idsToDelete = [...selectedIds];

          // Optimistically remove from state
          setPlayers(prev => prev.filter(p => !idsToDelete.includes(p.id)));

          // 1. Delete game settings
          await supabase
            .from('player_game_settings')
            .delete()
            .in('player_id', idsToDelete);

          // 2. Delete gear references
          await supabase
            .from('player_products')
            .delete()
            .in('player_id', idsToDelete);

          // 3. Delete favorites
          await supabase
            .from('user_favorites')
            .delete()
            .in('player_id', idsToDelete);

          // 4. Delete players
          const { error: batchErr } = await supabase
            .from('players')
            .delete()
            .in('id', idsToDelete);

          if (batchErr) throw batchErr;

          setSelectedIds([]);
          loadPlayers(true);
        } catch (err: any) {
          loadPlayers();
          showConfirm(
            'Batch Deletion Error',
            `Error deleting selected players: ${err.message}`,
            () => {},
            true
          );
        } finally {
          setIsBatchDeleting(false);
        }
      }
    );
  };

  const allOnPageSelected = players.length > 0 && players.every(p => selectedIds.includes(p.id));
  const someOnPageSelected = players.some(p => selectedIds.includes(p.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Manage <span className="text-accent">Players</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create, update, and delete eSports athletes profiles. Total: {totalCount} players
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedIds([]);
            }}
            className={`px-4 py-2.5 font-bold text-xs font-sans rounded-xl tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer border ${
              isSelectMode || selectedIds.length > 0
                ? 'bg-accent/15 border-accent text-accent shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-black/30 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>{isSelectMode || selectedIds.length > 0 ? 'Exit Select' : 'Select'}</span>
          </button>

          <Link
            href="/admin/players/new"
            className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-accent-fg font-bold text-xs font-sans rounded-xl tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-98 text-center"
          >
            + Add New Player
          </Link>
        </div>
      </div>

      {/* Batch Action Floating Banner */}
      {(isSelectMode || selectedIds.length > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-[#1A1A24] to-red-500/10 border border-amber-500/30 p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold font-mono text-xs">
              {selectedIds.length}
            </div>
            <div>
              <span className="text-xs font-bold text-white font-display">
                {selectedIds.length} {selectedIds.length === 1 ? 'player' : 'players'} selected
              </span>
              <p className="text-[10px] text-zinc-400 font-mono">
                Click checkboxes to select or deselect players for bulk operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handleSelectAllCurrentPage}
              className="px-3.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
            >
              {allOnPageSelected ? 'Deselect Page' : 'Select All Page'}
            </button>

            {selectedIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-3.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
                >
                  Clear All
                </button>

                <button
                  type="button"
                  disabled={isBatchDeleting}
                  onClick={handleBatchDelete}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{isBatchDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="bg-[#12121A]/70 border border-zinc-800/80 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset page to 1 on new search
            }}
            placeholder="Search by username, real name, or team..."
            className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent transition-all font-mono"
          />
        </div>

        {/* Game Filter Buttons */}
        <div className="flex bg-black/40 border border-zinc-800 p-1 rounded-xl items-center w-full sm:w-auto justify-center sm:justify-start">
          <button
            onClick={() => { setSelectedGame('all'); setPage(1); }}
            className={`h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
              selectedGame === 'all' ? 'bg-accent text-accent-fg shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { setSelectedGame('cs2'); setPage(1); }}
            className={`h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
              selectedGame === 'cs2' ? 'bg-amber-500/10 text-accent border border-accent/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            CS2
          </button>
          <button
            onClick={() => { setSelectedGame('valorant'); setPage(1); }}
            className={`h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
              selectedGame === 'valorant' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            VALORANT
          </button>
        </div>
      </div>

      {/* Players List Table */}
      {loading && players.length === 0 ? (
        <div className="flex-1 w-full min-h-[30vh] flex flex-col justify-center items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
          <span className="text-zinc-500 text-xs font-mono">Loading players list...</span>
        </div>
      ) : players.length === 0 ? (
        <div className="bg-[#12121A]/40 border border-dashed border-zinc-800/80 p-12 text-center rounded-2xl">
          <p className="text-sm text-zinc-500 font-mono italic">No players found matching your query.</p>
        </div>
      ) : (
        <div className="bg-[#12121A]/40 border border-zinc-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/30 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                  {(isSelectMode || selectedIds.length > 0) && (
                    <th className="px-4 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = !allOnPageSelected && someOnPageSelected;
                          }
                        }}
                        onChange={handleSelectAllCurrentPage}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-accent focus:ring-accent cursor-pointer accent-amber-500"
                        title="Select/Deselect All on this page"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4">Real Name</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                {players.map((player) => {
                  const isSelected = selectedIds.includes(player.id);
                  return (
                    <tr
                      key={player.id}
                      onClick={() => {
                        if (isSelectMode) {
                          handleToggleSelect(player.id);
                        }
                      }}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.12]'
                          : 'hover:bg-white/[0.01]'
                      } ${isSelectMode ? 'cursor-pointer' : ''}`}
                    >
                      {(isSelectMode || selectedIds.length > 0) && (
                        <td
                          className="px-4 py-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(player.id)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-accent focus:ring-accent cursor-pointer accent-amber-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-white text-sm font-display">{player.username}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-zinc-400">
                        {player.real_name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 font-mono font-semibold uppercase text-[10px]">
                          {player.team || 'Free Agent'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {player.country_code ? (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={`https://flagcdn.com/16x12/${player.country_code.toLowerCase()}.png`}
                              alt={player.country_code}
                              className="w-4 h-3 object-cover rounded-[2px]"
                            />
                            <span className="font-mono text-zinc-400">{player.country_code}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/players/${player.id}/edit`}
                            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-300 transition-colors uppercase font-sans"
                          >
                            Edit
                          </Link>
                          <button
                            disabled={deletingId === player.id}
                            onClick={() => handleDeletePlayer(player.id, player.username)}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 rounded-lg text-[10px] font-bold text-red-400 transition-colors uppercase font-sans cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === player.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-black/10 border-t border-zinc-800/80">
              <span className="text-zinc-500 font-mono text-[10px]">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} of {totalCount} players
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 disabled:opacity-30 rounded-lg text-[10px] font-bold uppercase font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-zinc-400 font-mono text-xs px-2">
                  Page {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 disabled:opacity-30 rounded-lg text-[10px] font-bold uppercase font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
