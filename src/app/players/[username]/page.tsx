import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GearCard from '@/components/GearCard';
import CommentSection from '@/components/CommentSection';
import FavoriteButton from '@/components/FavoriteButton';
import ProfileSidebar from '@/components/ProfileSidebar';
import CopyButton from '@/components/CopyButton';

type PageProps = {
  params: Promise<{ username: string }> | { username: string };
};

// --- Helper functions ---
function getAspectRatio(res: string | null) {
  if (!res) return null;
  const cleanRes = res.toLowerCase().trim();
  const knownMap: Record<string, string> = {
    '1920x1080': '16:9', '1280x960': '4:3', '1280x1024': '5:4',
    '1440x1080': '4:3', '1600x900': '16:9', '1024x768': '4:3',
    '2560x1440': '16:9', '1680x1050': '16:10', '1920x1200': '16:10',
    '1600x1200': '4:3', '1152x864': '4:3', '1400x1050': '4:3',
  };
  if (knownMap[cleanRes]) return knownMap[cleanRes];
  const [wStr, hStr] = cleanRes.split('x');
  const w = parseInt(wStr, 10);
  const h = parseInt(hStr, 10);
  if (!w || !h) return null;
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(w, h);
  return `${w / divisor}:${h / divisor}`;
}

function getRefreshRate(monitorName: string | null) {
  if (!monitorName) return null;
  const name = monitorName.toUpperCase();
  if (name.includes('540') || name.includes('PG248QP')) return '540';
  if (name.includes('500') || name.includes('AW2524H')) return '500';
  if (name.includes('380') || name.includes('XL2586X')) return '380';
  if (name.includes('360') || name.includes('XL2566') || name.includes('PG259') || name.includes('AW2521H')) return '360';
  if (name.includes('240') || name.includes('XL2546') || name.includes('PG258')) return '240';
  if (name.includes('165')) return '165';
  if (name.includes('144') || name.includes('XL2411') || name.includes('VG248')) return '144';
  return null;
}

function formatBirthDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// --- Reusable inline components ---
function SettingRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0">
      <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold text-white font-display">
        {value !== null && value !== undefined && value !== '' ? value : <span className="text-zinc-700">—</span>}
      </span>
    </div>
  );
}

function SectionHeader({ icon, title, id }: { icon: React.ReactNode; title: string; id?: string }) {
  return (
    <div id={id} className="flex items-center gap-2.5 mb-5 scroll-mt-24">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 text-accent">
        {icon}
      </div>
      <h2 className="text-sm font-bold text-white font-display uppercase tracking-wider">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border-custom to-transparent ml-2"></div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-white/[0.06] rounded-xl bg-white/[0.01] px-4">
      <svg className="h-5 w-5 mb-2 text-zinc-600 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p className="text-[10px] text-zinc-500 font-mono text-center">{message}</p>
    </div>
  );
}

function StatHighlight({ label, value, accent = false }: { label: string; value: string | number | null | undefined; accent?: boolean }) {
  const displayValue = value !== null && value !== undefined && value !== '' ? value : '—';
  const isEmpty = displayValue === '—';

  if (accent) {
    return (
      <div className="bg-accent/[0.05] border border-accent/20 hover:border-accent/40 hover:bg-accent/[0.08] p-3 rounded-xl transition-all duration-300 flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-accent/70 font-mono">{label}</span>
        <span className={`text-lg font-extrabold font-display ${isEmpty ? 'text-zinc-700' : 'text-accent'}`}>
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#12121A]/40 border border-border-custom hover:border-border-hover/60 p-3 rounded-xl transition-all duration-300 flex flex-col gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">{label}</span>
      <span className={`text-lg font-bold font-display ${isEmpty ? 'text-zinc-700' : 'text-white'}`}>
        {displayValue}
      </span>
    </div>
  );
}

// ================================================
// MAIN PAGE COMPONENT
// ================================================
export default async function PlayerProfilePage({ params }: PageProps) {
  const resolvedParams = 'then' in params ? await params : params;
  const username = resolvedParams.username;

  if (!username) return notFound();

  // --- Fetch player ---
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .ilike('username', username)
    .maybeSingle();

  if (playerError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-sm font-bold text-white mt-2 font-display">Database Connection Error</h2>
        <p className="text-zinc-500 text-xs mt-1 font-mono">{playerError.message}</p>
        <Link href="/" className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold font-mono">
          RETURN TO HOME
        </Link>
      </div>
    );
  }
  if (!player) return notFound();

  // --- Fetch settings ---
  const { data: settingsData } = await supabase
    .from('player_game_settings')
    .select(`
      id, game_role, mouse_dpi, mouse_hz, in_game_sens, edpi,
      resolution, aspect_ratio, refresh_rate, settings_data,
      games ( id, name, slug )
    `)
    .eq('player_id', player.id);

  // --- Fetch products ---
  const { data: productsData } = await supabase
    .from('player_products')
    .select(`
      products (
        id, name, category, product_type,
        shopee_url, lazada_url, amazon_url,
        image_url, estimated_price_thb
      )
    `)
    .eq('player_id', player.id);

  const products = (productsData || []).map((item: any) => item.products).filter((p: any) => p !== null);
  const gears = products.filter((p: any) => p.product_type === 'gear');
  const hardware = products.filter((p: any) => p.product_type === 'hardware');
  const playerMouse = gears.find((g: any) => g.category.toLowerCase() === 'mouse');
  const playerKeyboard = gears.find((g: any) => g.category.toLowerCase() === 'keyboard');
  const playerMonitor = hardware.find((h: any) => h.category.toLowerCase() === 'monitor');

  // Pick first settings entry for primary display
  const primarySettings = settingsData?.[0] || null;
  const settingsJson = primarySettings?.settings_data || {};

  // Derived values
  const displayAspect = primarySettings?.aspect_ratio || getAspectRatio(primarySettings?.resolution);
  const displayRefresh = primarySettings?.refresh_rate
    ? `${primarySettings.refresh_rate}`
    : getRefreshRate(playerMonitor?.name);

  // Keyboard special settings check
  const hasKeyboardSettings = settingsJson && (
    settingsJson.rapid_trigger !== undefined ||
    settingsJson.actuation_point !== undefined ||
    settingsJson.keyboard_profile !== undefined ||
    settingsJson.polling_rate !== undefined
  );

  const isValorant = (primarySettings?.games as any)?.slug === 'valorant';

  return (
    <div className="relative flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Ambient orbs */}
      <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent opacity-[0.015] blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[25%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent opacity-[0.015] blur-[150px] pointer-events-none"></div>

      {/* Back Link */}
      <div className="relative z-10 mb-6">
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white transition-colors duration-200 font-mono"
        >
          ← BACK TO PLAYERS
        </Link>
      </div>

      {/* ================================================ */}
      {/* SECTION 1: PROFILE HEADER (Full Width) */}
      {/* ================================================ */}
      <section className="relative z-10 bg-card backdrop-blur-[8px] border border-border-custom p-6 sm:p-8 rounded-2xl mb-10 hover:border-border-hover transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-2xl bg-[#1A1A24] border border-border-custom flex items-center justify-center font-black text-accent text-4xl overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.05)] shrink-0">
            {player.profile_img_url ? (
              <img src={player.profile_img_url} alt={player.username} className="h-full w-full object-cover" />
            ) : (
              player.username[0].toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display flex items-center gap-3">
                {player.username}
                <FavoriteButton playerId={player.id} />
              </h1>
              {player.team && (
                <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg font-mono tracking-wide">
                  {player.team}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 font-mono">
              {player.real_name && (
                <span className="font-medium">{player.real_name}</span>
              )}
              {player.nationality && (
                <span className="flex items-center gap-1.5">
                  {player.country_code && (
                    <img
                      src={`https://flagcdn.com/16x12/${player.country_code.toLowerCase()}.png`}
                      alt={player.country_code}
                      className="w-4 h-3 object-cover rounded-[2px]"
                    />
                  )}
                  {player.nationality}
                </span>
              )}
              {!player.nationality && player.country_code && (
                <span className="flex items-center gap-1.5">
                  <img
                    src={`https://flagcdn.com/16x12/${player.country_code.toLowerCase()}.png`}
                    alt={player.country_code}
                    className="w-4 h-3 object-cover rounded-[2px]"
                  />
                  {player.country_code}
                </span>
              )}
              {player.birth_date && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{formatBirthDate(player.birth_date)}</span>
                </span>
              )}
            </div>

            {/* Game badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {settingsData && settingsData.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 bg-[#12121A]/80 border border-border-custom py-1.5 px-3 rounded-lg">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${s.games.slug === 'valorant'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                    {s.games.name}
                  </span>
                  {s.game_role && (
                    <span className="text-[10px] text-zinc-400 font-medium border-l border-white/10 pl-2 font-mono">
                      {s.game_role}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Description placeholder */}
            {(player as any).bio && (
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl pt-1">
                {(player as any).bio}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ================================================ */}
      {/* MAIN CONTENT + SIDEBAR LAYOUT */}
      {/* ================================================ */}
      <div className="relative z-10 flex gap-8">

        {/* ======= MAIN CONTENT ======= */}
        <div className="flex-1 min-w-0 space-y-10">

          {/* ================================================ */}
          {/* SECTION 2: SETTINGS 2-COLUMN LAYOUT */}
          {/* ================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ---- LEFT COLUMN: Devices & Controls ---- */}
            <div className="space-y-6">

              {/* MOUSE SETTINGS */}
              <div id="mouse-settings" className="scroll-mt-24 bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-2xl">
                <SectionHeader 
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="5" y="2" width="14" height="20" rx="7" />
                      <path d="M12 2v10M5 12h14" />
                    </svg>
                  } 
                  title="Mouse Settings" 
                />

                {/* Mouse product banner */}
                {playerMouse && (
                  <div className="flex items-center gap-3 bg-[#12121A]/60 border border-border-custom p-3 rounded-xl mb-4">
                    {playerMouse.image_url ? (
                      <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0">
                        <img src={playerMouse.image_url} alt={playerMouse.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0 text-zinc-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <rect x="5" y="2" width="14" height="20" rx="7" />
                          <path d="M12 2v10M5 12h14" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono mr-2">
                        {playerMouse.name.split(' ')[0]}
                      </span>
                      <span className="text-xs font-bold text-white font-display">{playerMouse.name}</span>
                    </div>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <StatHighlight label="DPI" value={primarySettings?.mouse_dpi} accent />
                  <StatHighlight label="Sensitivity" value={primarySettings?.in_game_sens !== null && primarySettings?.in_game_sens !== undefined ? Number(primarySettings.in_game_sens).toFixed(3) : null} accent />
                  <StatHighlight label="eDPI" value={primarySettings?.edpi} />
                  <StatHighlight label="Hz" value={primarySettings?.mouse_hz ? `${primarySettings.mouse_hz}` : null} />
                  {isValorant && settingsJson.scoped_sens && (
                    <StatHighlight label="ADS / Scoped" value={settingsJson.scoped_sens} />
                  )}
                  {!isValorant && settingsJson.zoom_sens && (
                    <StatHighlight label="Zoom Sens" value={settingsJson.zoom_sens} />
                  )}
                </div>

                {/* Show other game settings if multiple */}
                {settingsData && settingsData.length > 1 && (
                  <div className="mt-4 space-y-3">
                    {settingsData.slice(1).map((s: any) => {
                      const sJson = s.settings_data || {};
                      const isVal = s.games.slug === 'valorant';
                      return (
                        <div key={s.id} className="border-t border-white/5 pt-3">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono mb-2 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isVal ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                            {s.games.name} {s.game_role && `· ${s.game_role}`}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <StatHighlight label="DPI" value={s.mouse_dpi} accent />
                            <StatHighlight label="Sens" value={s.in_game_sens !== null ? Number(s.in_game_sens).toFixed(3) : null} accent />
                            <StatHighlight label="eDPI" value={s.edpi} />
                            <StatHighlight label="Hz" value={s.mouse_hz ? `${s.mouse_hz}` : null} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* KEYBOARD SETTINGS */}
              <div id="keyboard-settings" className="scroll-mt-24 bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-2xl">
                <SectionHeader 
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
                    </svg>
                  } 
                  title="Keyboard Settings" 
                />

                {/* Keyboard product banner */}
                {playerKeyboard && (
                  <div className="flex items-center gap-3 bg-[#12121A]/60 border border-border-custom p-3 rounded-xl mb-4">
                    {playerKeyboard.image_url ? (
                      <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0">
                        <img src={playerKeyboard.image_url} alt={playerKeyboard.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0 text-zinc-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <rect x="2" y="4" width="20" height="16" rx="3" />
                          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono mr-2">
                        {playerKeyboard.name.split(' ')[0]}
                      </span>
                      <span className="text-xs font-bold text-white font-display">{playerKeyboard.name}</span>
                    </div>
                  </div>
                )}

                {hasKeyboardSettings ? (
                  <div className="space-y-1">
                    {settingsJson.rapid_trigger !== undefined && (
                      <SettingRow label="Rapid Trigger" value={settingsJson.rapid_trigger} />
                    )}
                    {settingsJson.actuation_point !== undefined && (
                      <SettingRow label="Actuation Point" value={settingsJson.actuation_point} />
                    )}
                    {settingsJson.polling_rate !== undefined && (
                      <SettingRow label="Polling Rate" value={`${settingsJson.polling_rate} Hz`} />
                    )}
                    {settingsJson.keyboard_profile !== undefined && (
                      <SettingRow label="Profile Code" value={settingsJson.keyboard_profile} />
                    )}

                    {/* Copy to clipboard button placeholder */}
                    {settingsJson.keyboard_profile && (
                      <div className="pt-3">
                        <CopyButton 
                          textToCopy={settingsJson.keyboard_profile} 
                          label="Copy Profile Code" 
                          successLabel="Profile Code Copied!"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState message="No keyboard performance data available" />
                )}
              </div>

              {/* CONTROLS / KEYBINDS */}
              <div id="controls-keybinds" className="scroll-mt-24 bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-2xl">
                <SectionHeader 
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="2" y="6" width="20" height="12" rx="3" />
                      <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  } 
                  title="Controls / Keybinds" 
                />

                <EmptyState message="Keybind data coming soon — stay tuned!" />
              </div>
            </div>

            {/* ---- RIGHT COLUMN: Crosshair & Map ---- */}
            <div className="space-y-6">

              {/* CROSSHAIR SIMULATION */}
              <div id="crosshair" className="scroll-mt-24 bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-2xl">
                <SectionHeader 
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 12h.01" strokeLinecap="round" />
                    </svg>
                  } 
                  title="Crosshair" 
                />

                {/* Crosshair preview area */}
                <div className="relative bg-[#12121a] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] border border-border-custom rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Crosshair simulation placeholder */}
                    <div className="relative">
                      <div className="w-px h-6 bg-green-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full opacity-80"></div>
                      <div className="w-px h-6 bg-green-400 absolute top-1/2 left-1/2 -translate-x-1/2 opacity-80"></div>
                      <div className="w-6 h-px bg-green-400 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-full opacity-80"></div>
                      <div className="w-6 h-px bg-green-400 absolute top-1/2 left-1/2 -translate-y-1/2 opacity-80"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80"></div>
                    </div>
                  </div>

                  {/* Navigation arrows */}
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all cursor-pointer">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all cursor-pointer">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>

                  {/* Crosshair counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-500 bg-black/60 px-2 py-0.5 rounded-full border border-white/5">
                    1 / 1
                  </div>
                </div>

                {/* Crosshair Settings */}
                <div className="space-y-1 mb-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent border-l-2 border-accent pl-2 font-mono mb-3">Crosshair Settings</p>
                  <SettingRow label="Inner Lines" value={null} />
                  <SettingRow label="Outer Lines" value={null} />
                  <SettingRow label="Center Dot" value={null} />
                  <SettingRow label="Thickness" value={null} />
                  <SettingRow label="Outline" value={null} />
                  <SettingRow label="Color" value={null} />
                </div>

                {/* Copy crosshair code */}
                <CopyButton 
                  textToCopy={settingsJson.crosshair_code || "0;P;c;5;o;1;d;1;z;3;f;0;0t;4;0l;2;0o;2;0a;1;0f;0;1b;0"} 
                  label="Copy Crosshair Code" 
                  successLabel="Crosshair Code Copied!"
                  className="w-full text-[10px] font-bold py-2.5 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-border-custom hover:border-border-hover transition-all duration-200 font-mono uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                />
              </div>

              {/* MAP SETTINGS */}
              <div className="bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-2xl">
                <SectionHeader 
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                      <line x1="9" y1="3" x2="9" y2="18" />
                      <line x1="15" y1="6" x2="15" y2="21" />
                    </svg>
                  } 
                  title="Map Settings" 
                />

                <div className="space-y-1">
                  <SettingRow label="Rotate" value={null} />
                  <SettingRow label="Fixed Orientation" value={null} />
                  <SettingRow label="Keep Player Centered" value={null} />
                  <SettingRow label="Minimap Size" value={null} />
                  <SettingRow label="Minimap Zoom" value={null} />
                  <SettingRow label="Minimap Vision Cones" value={null} />
                </div>
              </div>
            </div>
          </div>

          {/* ================================================ */}
          {/* SECTION 3: VIDEO SETTINGS (Full Width, 2-col inside) */}
          {/* ================================================ */}
          <div id="video-settings" className="scroll-mt-24 bg-card backdrop-blur-[8px] border border-border-custom p-5 sm:p-6 rounded-2xl">
            <SectionHeader 
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              } 
              title="Video Settings" 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: General */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-accent border-l-2 border-accent pl-2 font-mono mb-3 border-b border-white/5 pb-2">Video — General</p>
                <div className="space-y-1">
                  <SettingRow label="Display Mode" value="Fullscreen" />
                  <SettingRow label="Resolution" value={primarySettings?.resolution} />
                  <SettingRow label="Aspect Ratio" value={displayAspect} />
                  <SettingRow label="Refresh Rate" value={displayRefresh ? `${displayRefresh} Hz` : null} />
                  {!isValorant && settingsJson.scaling_mode && (
                    <SettingRow label="Scaling Mode" value={settingsJson.scaling_mode} />
                  )}
                  <SettingRow label="NVIDIA Reflex Low Latency" value={null} />
                </div>

                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-accent border-l-2 border-accent pl-2 font-mono mt-5 mb-3 border-b border-white/5 pb-2">Accessibility</p>
                <div className="space-y-1">
                  <SettingRow label="Enemy Highlight Color" value={settingsJson.enemy_highlight_color || null} />
                </div>
              </div>

              {/* Right: Graphics Quality */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-accent border-l-2 border-accent pl-2 font-mono mb-3 border-b border-white/5 pb-2">Video — Graphics Quality</p>
                <div className="space-y-1">
                  <SettingRow label="Multithreaded Rendering" value={null} />
                  <SettingRow label="Material Quality" value={null} />
                  <SettingRow label="Texture Quality" value={null} />
                  <SettingRow label="Detail Quality" value={null} />
                  <SettingRow label="UI Quality" value={null} />
                  <SettingRow label="Vignette" value={null} />
                  <SettingRow label="VSync" value={null} />
                  <SettingRow label="Anti-Aliasing" value={null} />
                  <SettingRow label="Anisotropic Filtering" value={null} />
                  <SettingRow label="Improve Clarity" value={null} />
                  <SettingRow label="Bloom" value={null} />
                  <SettingRow label="Distortion" value={null} />
                  <SettingRow label="Cast Shadows" value={null} />
                </div>
              </div>
            </div>
          </div>

          {/* ================================================ */}
          {/* SECTION 4: GEARS */}
          {/* ================================================ */}
          <div id="gears" className="scroll-mt-24">
            <SectionHeader 
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9M3 14h3v5H3v-5Zm15 0h3v5h-3v-5Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              } 
              title="Gaming Gear" 
            />
            {gears.length === 0 ? (
              <EmptyState message="No gaming gear information available" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {gears.map((product: any) => (
                  <GearCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* ================================================ */}
          {/* SECTION 5: PC SPEC */}
          {/* ================================================ */}
          <div id="pc-spec" className="scroll-mt-24">
            <SectionHeader 
              icon={
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="5" y="5" width="14" height="14" rx="2" />
                  <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4M9 9h6v6H9z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              } 
              title="PC Specifications" 
            />
            {hardware.length === 0 ? (
              <EmptyState message="No hardware specifications available" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {hardware.map((product: any) => (
                  <GearCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* ================================================ */}
          {/* SECTION 6: COMMENTS */}
          {/* ================================================ */}
          <div id="comments" className="scroll-mt-24 bg-card backdrop-blur-[8px] border border-border-custom p-5 sm:p-6 rounded-2xl">
            <CommentSection username={player.username} />
          </div>

        </div>

        {/* ======= RIGHT SIDEBAR (Desktop only) ======= */}
        <ProfileSidebar />

      </div>
    </div>
  );
}
