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

type RecentGear = {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  estimated_price_thb: number | null;
  created_at: string;
};

type PlayerProductJoin = {
  player_id: number;
  product_id: number;
  products: {
    id: number;
    name: string;
    category: string;
  } | null;
};

type PlayerGameJoin = {
  player_id: number;
  game_id: number;
};

// Helper: relative time ago string
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Rank badge colors for top 3
const RANK_STYLES: Record<number, { bg: string; text: string; bar: string; glow: string }> = {
  0: { bg: 'bg-amber-500/15', text: 'text-amber-400', bar: 'bg-gradient-to-r from-amber-500 to-yellow-400', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]' },
  1: { bg: 'bg-zinc-400/10', text: 'text-zinc-300', bar: 'bg-gradient-to-r from-zinc-400 to-zinc-300', glow: 'shadow-[0_0_10px_rgba(161,161,170,0.2)]' },
  2: { bg: 'bg-orange-700/15', text: 'text-orange-400', bar: 'bg-gradient-to-r from-orange-600 to-orange-400', glow: 'shadow-[0_0_10px_rgba(194,65,12,0.2)]' },
};

const DEFAULT_RANK_STYLE = { bg: 'bg-zinc-800/50', text: 'text-zinc-500', bar: 'bg-accent', glow: '' };

export default function AdminDashboard() {
  const [stats, setStats] = useState<SummaryStats>({ totalPlayers: 0, totalTeams: 0, totalGears: 0 });
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [recentGears, setRecentGears] = useState<RecentGear[]>([]);
  
  const [playerProducts, setPlayerProducts] = useState<PlayerProductJoin[]>([]);
  const [playerGames, setPlayerGames] = useState<PlayerGameJoin[]>([]);
  
  const [valCount, setValCount] = useState(0);
  const [csCount, setCsCount] = useState(0);
  
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [gameFilter, setGameFilter] = useState<'all' | 'valorant' | 'cs2'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('mouse');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const startTime = performance.now();

        const { count: playerCount } = await supabase
          .from('players')
          .select('id', { count: 'exact', head: true });

        const { count: gearCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true });

        const { data: teamData } = await supabase
          .from('players')
          .select('team')
          .not('team', 'is', null);

        const uniqueTeams = new Set<string>();
        if (teamData) {
          teamData.forEach(item => {
            const teamName = item.team?.trim();
            if (teamName && teamName !== '-' && teamName !== '') {
              uniqueTeams.add(teamName);
            }
          });
        }

        const { data: playerGamesData } = await supabase
          .from('player_game_settings')
          .select('player_id, game_id');
        
        let valCountTemp = 0;
        let csCountTemp = 0;
        if (playerGamesData) {
          setPlayerGames(playerGamesData as PlayerGameJoin[]);
          playerGamesData.forEach(item => {
            if (item.game_id === 2) valCountTemp++;
            if (item.game_id === 3) csCountTemp++;
          });
        }
        setValCount(valCountTemp);
        setCsCount(csCountTemp);

        const { data: playerProductsData } = await supabase
          .from('player_products')
          .select(`
            player_id,
            product_id,
            products (
              id,
              name,
              category
            )
          `);
        if (playerProductsData) {
          setPlayerProducts(playerProductsData as any[]);
        }

        const { data: recents } = await supabase
          .from('players')
          .select('id, username, real_name, team, profile_img_url, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: recentGearsData } = await supabase
          .from('products')
          .select('id, name, category, estimated_price_thb, image_url, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalPlayers: playerCount || 0,
          totalGears: gearCount || 0,
          totalTeams: uniqueTeams.size
        });

        if (recents) setRecentPlayers(recents as RecentPlayer[]);
        if (recentGearsData) setRecentGears(recentGearsData as RecentGear[]);

        const endTime = performance.now();
        setDbLatency(Math.round(endTime - startTime));
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

  // --- Brand Analytics Computation ---
  const playerGamesMap: Record<number, Set<number>> = {};
  playerGames.forEach(item => {
    if (!playerGamesMap[item.player_id]) {
      playerGamesMap[item.player_id] = new Set();
    }
    playerGamesMap[item.player_id].add(item.game_id);
  });

  const filteredEntries = playerProducts.filter((entry) => {
    if (!entry.products) return false;
    if (entry.products.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (gameFilter !== 'all') {
      const targetGameId = gameFilter === 'valorant' ? 2 : 3;
      const pGames = playerGamesMap[entry.player_id];
      if (!pGames || !pGames.has(targetGameId)) return false;
    }
    return true;
  });

  // Count unique players who have any product in this category+game filter
  const uniquePlayersInFilter = new Set(filteredEntries.map(e => e.player_id)).size;

  const brandUsage: Record<string, { count: number; models: Record<string, number> }> = {};
  filteredEntries.forEach((entry) => {
    if (!entry.products) return;
    const name = entry.products.name || '';
    const brand = name.split(' ')[0].trim();
    if (!brand) return;

    if (!brandUsage[brand]) {
      brandUsage[brand] = { count: 0, models: {} };
    }
    brandUsage[brand].count += 1;
    brandUsage[brand].models[name] = (brandUsage[brand].models[name] || 0) + 1;
  });

  const calculatedBrands = Object.entries(brandUsage)
    .map(([brandName, data]) => {
      const topModelEntry = Object.entries(data.models)
        .sort((a, b) => b[1] - a[1])[0];
      const topModel = topModelEntry?.[0] || 'Unknown';
      const topModelCount = topModelEntry?.[1] || 0;

      // Use unique players as denominator for accurate market share
      const percentage = uniquePlayersInFilter > 0
        ? Math.round((data.count / uniquePlayersInFilter) * 100)
        : 0;

      return {
        name: brandName,
        count: data.count,
        percentage,
        topModel,
        topModelCount
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxBrandCount = calculatedBrands[0]?.count || 1;

  // Dynamic insight sentence
  const topBrand = calculatedBrands[0];
  const gameLabel = gameFilter === 'all' ? 'all players' : gameFilter === 'valorant' ? 'VALORANT players' : 'CS2 players';
  const catLabel = CATEGORY_OPTIONS.find(c => c.value === categoryFilter)?.name || categoryFilter;

  const statCards = [
    {
      title: 'Total Players',
      value: stats.totalPlayers,
      desc: 'Pro players & community profiles in the database',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.05)]',
      color: 'text-accent',
      icon: (
        <svg className="w-7 h-7 text-accent/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'Active Teams',
      value: stats.totalTeams,
      desc: 'Unique eSports organizations registered',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.04)]',
      color: 'text-blue-400',
      icon: (
        <svg className="w-7 h-7 text-blue-400/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'Gears & Products',
      value: stats.totalGears,
      desc: 'Gaming peripherals and hardware items',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.04)]',
      color: 'text-emerald-400',
      scrollAction: true,
      icon: (
        <svg className="w-7 h-7 text-emerald-400/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header & System Info */}
      <div className="border-b border-zinc-800/60 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Overview <span className="text-accent">Console</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Quick summary of your ProSettings directory statistics.
          </p>
        </div>

        <div className="bg-black/40 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-3 self-start md:self-auto font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-400">DB Connected</span>
          </div>
          <span className="text-zinc-700">|</span>
          <span>Latency: <span className="font-bold text-white">{dbLatency !== null ? `${dbLatency}ms` : '...'}</span></span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-[#12121A]/70 border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-300 ${card.glow}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-sans block">
                  {card.title}
                </span>
                <span className={`text-3xl font-black font-mono leading-none mt-3 block ${card.color}`}>
                  {card.value}
                </span>
              </div>
              {card.icon}
            </div>
            <div className="mt-4">
              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                {card.desc}
              </p>
              {card.scrollAction && (
                <button 
                  onClick={() => document.getElementById('recently-added-gears')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-[10px] text-accent hover:text-white font-mono uppercase tracking-wider font-bold mt-2 text-left cursor-pointer flex items-center gap-1 group/btn bg-transparent border-0 p-0 transition-colors"
                >
                  View recently added <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-[#12121A]/70 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/players/new"
            className="flex items-center justify-center gap-2 h-11 bg-accent text-accent-fg hover:bg-accent/90 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-all cursor-pointer hover:-translate-y-px"
          >
            <span>+</span> Add New Player
          </Link>
          <Link
            href="/admin/players/new?focus=team"
            className="flex items-center justify-center gap-2 h-11 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider font-mono text-white transition-all cursor-pointer hover:-translate-y-px"
          >
            <span>🛡️</span> Add New Team
          </Link>
          <Link
            href="/admin/gears?add=true"
            className="flex items-center justify-center gap-2 h-11 bg-black/40 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wider font-mono text-zinc-300 hover:text-white transition-all cursor-pointer hover:-translate-y-px"
          >
            <span>📦</span> Add New Gear
          </Link>
        </div>
      </div>

      {/* ═══ Esports Brand Popularity Analytics ═══ */}
      <div className="bg-[#12121A]/70 border border-zinc-800/80 p-6 rounded-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Pro Brand Popularity Analytics</h2>
            <p className="text-xs text-zinc-500 mt-1">Real-time usage shares and favorite gear models among pro players</p>
          </div>
          
          {/* Game filter tabs */}
          <div className="flex bg-black/40 border border-zinc-800 p-1 rounded-xl font-mono text-[10px] self-start md:self-auto">
            {([
              { key: 'all' as const, label: 'All Games', activeClass: 'bg-zinc-800 text-white' },
              { key: 'valorant' as const, label: 'VALORANT', activeClass: 'bg-[#FF4655]/15 text-[#FF4655]' },
              { key: 'cs2' as const, label: 'CS2', activeClass: 'bg-amber-500/10 text-amber-400' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setGameFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  gameFilter === tab.key ? tab.activeClass : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gear categories selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {CATEGORY_OPTIONS.map(cat => {
            const isActive = categoryFilter === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3.5 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider font-mono shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-accent/10 border-accent/60 text-accent shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                    : 'bg-black/20 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></span>}
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Dynamic insight sentence */}
        {topBrand && (
          <div className="bg-accent/5 border border-accent/10 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-300 font-sans">
              <span className="text-accent font-bold">{topBrand.name}</span> leads with <span className="text-white font-bold">{topBrand.percentage}%</span> share in <span className="text-white font-semibold">{catLabel}</span> among {gameLabel}.
              {topBrand.topModel !== 'Unknown' && (
                <> Their most popular model is <span className="text-accent font-semibold">{topBrand.topModel}</span> ({topBrand.topModelCount} players).</>
              )}
            </p>
          </div>
        )}

        {/* Brand leaderboard */}
        <div className="space-y-3">
          {calculatedBrands.length === 0 ? (
            <div className="py-12 text-center bg-black/20 border border-zinc-800 rounded-xl">
              <span className="text-sm font-mono text-zinc-500">No brand data found for this selection. Try changing the filters!</span>
            </div>
          ) : (
            calculatedBrands.map((brand, idx) => {
              // Use relative width (to max brand) so bars fill the space nicely
              const barWidth = Math.max(Math.round((brand.count / maxBrandCount) * 100), 3);
              const style = RANK_STYLES[idx] || DEFAULT_RANK_STYLE;
              return (
                <div key={idx} className="bg-black/20 border border-zinc-800/60 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors group">
                  {/* Rank badge + brand info */}
                  <div className="flex items-center gap-3 md:w-[38%] min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black font-mono shrink-0 ${style.bg} ${style.text}`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-white font-display uppercase tracking-wide">{brand.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">({brand.count} players)</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono truncate leading-normal mt-0.5">
                        <span className="text-accent/80 font-semibold">★ </span>
                        {brand.topModel}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar + percentage */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/80 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${style.bar} ${style.glow}`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-black font-mono w-12 text-right ${idx === 0 ? 'text-accent' : 'text-white'}`}>{brand.percentage}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ Recents: Side-by-Side ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Recently Added Players */}
        <div className="bg-[#12121A]/45 border border-zinc-800/60 p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-display">Recently Added Players</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Latest players inserted into the database</p>
            </div>
            <Link
              href="/admin/players"
              className="px-3 py-1.5 bg-accent/5 hover:bg-accent/10 border border-accent/15 rounded-lg text-[10px] font-bold font-sans uppercase tracking-wider text-accent transition-colors cursor-pointer"
            >
              Manage All
            </Link>
          </div>

          {recentPlayers.length === 0 ? (
            <p className="text-xs text-zinc-500 italic font-mono py-6 text-center">
              No players added yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800/50 border border-zinc-800/50 rounded-xl overflow-hidden bg-black/20">
              {recentPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-accent text-sm overflow-hidden shrink-0">
                      {player.profile_img_url ? (
                        <img src={player.profile_img_url} alt={player.username} className="h-full w-full object-cover" />
                      ) : (
                        player.username[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white font-display truncate">{player.username}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-sans truncate">{player.real_name || 'No Real Name'}</span>
                        <span className="text-[9px] text-zinc-600 font-mono">{timeAgo(player.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                    <span className="font-bold uppercase tracking-wider px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hidden sm:inline-block">
                      {player.team || 'Free Agent'}
                    </span>
                    <Link
                      href={`/admin/players/${player.id}/edit`}
                      className="text-[11px] text-accent hover:underline font-bold font-sans"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Added Gears */}
        <div id="recently-added-gears" className="scroll-mt-24 bg-[#12121A]/45 border border-zinc-800/60 p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-display">Recently Added Gears</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Latest gear and hardware products registered</p>
            </div>
            <Link
              href="/admin/gears"
              className="px-3 py-1.5 bg-accent/5 hover:bg-accent/10 border border-accent/15 rounded-lg text-[10px] font-bold font-sans uppercase tracking-wider text-accent transition-colors cursor-pointer"
            >
              Manage All
            </Link>
          </div>

          {recentGears.length === 0 ? (
            <p className="text-xs text-zinc-500 italic font-mono py-6 text-center">
              No gear added yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800/50 border border-zinc-800/50 rounded-xl overflow-hidden bg-black/20">
              {recentGears.map((gear) => (
                <div key={gear.id} className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                      {gear.image_url ? (
                        <img src={gear.image_url} alt={gear.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-400">📦</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white font-display truncate">{gear.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{gear.category}</span>
                        <span className="text-[9px] text-zinc-600 font-mono">{timeAgo(gear.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                    {gear.estimated_price_thb ? (
                      <span className="font-bold text-zinc-400">
                        ฿{Number(gear.estimated_price_thb).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                    <Link
                      href="/admin/gears"
                      className="text-[11px] text-accent hover:underline font-bold font-sans"
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

    </div>
  );
}

const CATEGORY_OPTIONS = [
  { name: 'Mouse', value: 'mouse', icon: '🖱️' },
  { name: 'Keyboard', value: 'keyboard', icon: '⌨️' },
  { name: 'Mousepad', value: 'mousepad', icon: '🟦' },
  { name: 'Headset', value: 'headset', icon: '🎧' },
  { name: 'Monitor', value: 'monitor', icon: '🖥️' },
  { name: 'GPU', value: 'gpu', icon: '🔌' },
  { name: 'CPU', value: 'cpu', icon: '🔲' }
];
