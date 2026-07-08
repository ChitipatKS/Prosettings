'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type SummaryStats = {
  totalPlayers: number;
  totalTeams: number;
  totalGears: number;
};

type RecentPlayer = {
  id: number;
  username: string;
  real_name: string | null;
  team: string | null;
  profile_img_url: string | null;
  created_at: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<SummaryStats>({ totalPlayers: 0, totalTeams: 0, totalGears: 0 });
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // 1. Get count of players
        const { count: playerCount, error: playerErr } = await supabase
          .from('players')
          .select('id', { count: 'exact', head: true });

        // 2. Get count of products (gears)
        const { count: gearCount, error: gearErr } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true });

        // 3. Get unique teams
        const { data: teamData, error: teamErr } = await supabase
          .from('players')
          .select('team')
          .not('team', 'is', null);

        const uniqueTeams = new Set<string>();
        if (teamData) {
          teamData.forEach(item => {
            const teamName = item.team?.trim();
            if (teamName && teamName !== '-') {
              uniqueTeams.add(teamName);
            }
          });
        }

        // 4. Fetch 5 most recent players
        const { data: recents } = await supabase
          .from('players')
          .select('id, username, real_name, team, profile_img_url, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalPlayers: playerCount || 0,
          totalGears: gearCount || 0,
          totalTeams: uniqueTeams.size
        });

        if (recents) {
          setRecentPlayers(recents as RecentPlayer[]);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-[50vh] flex flex-col justify-center items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        <span className="text-zinc-500 text-xs font-mono">Loading overview statistics...</span>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Players',
      value: stats.totalPlayers,
      desc: 'Active pro players and community profiles',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.05)]',
      color: 'text-accent',
      icon: (
        <svg className="w-8 h-8 text-accent/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'Active Teams',
      value: stats.totalTeams,
      desc: 'Unique eSports organizations registered',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.03)]',
      color: 'text-blue-400',
      icon: (
        <svg className="w-8 h-8 text-blue-400/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'Gears & Products',
      value: stats.totalGears,
      desc: 'Gaming mice, keyboards, mousepads, etc.',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.03)]',
      color: 'text-emerald-400',
      icon: (
        <svg className="w-8 h-8 text-emerald-400/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="border-b border-zinc-800/60 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
          Overview <span className="text-accent">Console</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Welcome to the ProSettings admin dashboard. Quick summary of directory statistics.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-[#12121A]/70 border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 ${card.glow}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-sans block">
                  {card.title}
                </span>
                <span className={`text-3xl font-black font-mono leading-none mt-3.5 block ${card.color}`}>
                  {card.value}
                </span>
              </div>
              {card.icon}
            </div>
            <p className="text-xs text-zinc-500 font-sans mt-5">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Recents list */}
      <div className="bg-[#12121A]/45 border border-zinc-800/60 p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Recently Added Players</h2>
            <p className="text-xs text-zinc-500 mt-0.5">The latest players inserted into the database</p>
          </div>
          <Link
            href="/admin/players"
            className="px-4 py-2 bg-accent/5 hover:bg-accent/10 border border-accent/15 rounded-lg text-[10px] font-bold font-sans uppercase tracking-wider text-accent transition-colors"
          >
            Manage All
          </Link>
        </div>

        {recentPlayers.length === 0 ? (
          <p className="text-xs text-zinc-500 italic font-mono py-4 text-center">
            No players added yet.
          </p>
        ) : (
          <div className="divide-y divide-zinc-900 border border-zinc-800/50 rounded-xl overflow-hidden bg-black/20">
            {recentPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-accent text-sm overflow-hidden shrink-0">
                    {player.profile_img_url ? (
                      <img src={player.profile_img_url} alt={player.username} className="h-full w-full object-cover" />
                    ) : (
                      player.username[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white font-display">{player.username}</span>
                    <span className="text-[10px] text-zinc-500 font-sans">{player.real_name || 'No Real Name'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 font-mono">
                    {player.team || 'Free Agent'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                    {new Date(player.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/admin/players/${player.id}/edit`}
                    className="text-xs text-accent hover:underline font-bold font-sans"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
