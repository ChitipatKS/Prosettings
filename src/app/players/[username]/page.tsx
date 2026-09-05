import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTeamLogo } from '@/lib/teamLogos';
import TeamLogoImg from '@/components/TeamLogoImg';
import FavoriteButton from '@/components/FavoriteButton';
import CopyProfileUrlButton from '@/components/CopyProfileUrlButton';
import PlayerProfileClient from '@/components/PlayerProfileClient';

type PageProps = {
  params: Promise<{ username: string }>;
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

// Helper to render beautiful game badge logos (Valorant, CS2, PUBG, Apex, Fortnite)
function renderGameLogo(slug: string) {
  const s = (slug || '').toLowerCase();
  if (s.includes('valorant')) {
    return (
      <div className="w-5 h-5 rounded overflow-hidden shadow-md border border-black/20 flex items-center justify-center shrink-0" title="VALORANT">
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
      <div className="w-5 h-5 rounded overflow-hidden shadow-md border border-black/20 flex items-center justify-center shrink-0" title="CS2">
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
      <div className="w-5 h-5 rounded bg-[#DA292A] flex items-center justify-center shadow-md border border-black/10 shrink-0" title="Apex Legends">
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
      </div>
    );
  }
  if (s.includes('pubg')) {
    return (
      <div className="w-5 h-5 rounded bg-[#F2A900] flex items-center justify-center shadow-md border border-black/10 shrink-0" title="PUBG">
        <span className="text-[7px] font-black text-black tracking-tighter">PUBG</span>
      </div>
    );
  }
  if (s.includes('fortnite')) {
    return (
      <div className="w-5 h-5 rounded bg-[#2E97F1] flex items-center justify-center shadow-md border border-black/10 shrink-0" title="Fortnite">
        <span className="text-[8px] font-black text-white tracking-tighter">FN</span>
      </div>
    );
  }
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/80">
      {slug.toUpperCase()}
    </span>
  );
}


// Helper to format social media link cleanly
function formatSocialUrl(url: string | null | undefined, platform: 'twitter' | 'twitch' | 'instagram' | 'youtube' | 'tiktok') {
  if (!url) return '#';
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  const baseMap: Record<string, string> = {
    twitter: 'https://x.com/',
    twitch: 'https://twitch.tv/',
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/',
    tiktok: 'https://tiktok.com/@',
  };
  const sanitized = clean.replace(/^@/, '');
  if (clean.includes('.')) {
    return `https://${clean}`;
  }
  return `${baseMap[platform]}${sanitized}`;
}

// Helper to calculate age from birth date string
function calculateAge(dateStr: string | null): number | null {
  if (!dateStr) return null;
  try {
    const birthDate = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

// Helper to get custom brand colors per esports team
function getTeamBrandColors(teamName: string | null) {
  if (!teamName) return {
    bg: 'bg-zinc-800/40',
    border: 'border-zinc-700/30',
    text: 'text-zinc-300',
    avatarRing: 'border-zinc-800/80 shadow-[0_0_20px_rgba(255,255,255,0.02)]',
    glow: 'hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]'
  };
  const t = teamName.toLowerCase().trim();
  if (t.includes('sentinels')) {
    return {
      bg: 'bg-[#E01E35]/10',
      border: 'border-[#E01E35]/30',
      text: 'text-[#E01E35]',
      avatarRing: 'border-[#E01E35]/40 shadow-[0_0_25px_rgba(224,30,53,0.12)]',
      glow: 'hover:shadow-[0_0_15px_rgba(224,30,53,0.25)]'
    };
  }
  if (t.includes('tsm')) {
    return {
      bg: 'bg-zinc-800/80',
      border: 'border-zinc-700/80',
      text: 'text-white',
      avatarRing: 'border-zinc-500/30 shadow-[0_0_25px_rgba(255,255,255,0.08)]',
      glow: 'hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
    };
  }
  if (t.includes('fnatic')) {
    return {
      bg: 'bg-[#FF5900]/10',
      border: 'border-[#FF5900]/30',
      text: 'text-[#FF5900]',
      avatarRing: 'border-[#FF5900]/40 shadow-[0_0_25px_rgba(255,89,0,0.12)]',
      glow: 'hover:shadow-[0_0_15px_rgba(255,89,0,0.25)]'
    };
  }
  if (t.includes('paper rex') || t.includes('prx')) {
    return {
      bg: 'bg-[#F20574]/10',
      border: 'border-[#F20574]/30',
      text: 'text-[#F20574]',
      avatarRing: 'border-[#F20574]/40 shadow-[0_0_25px_rgba(242,5,116,0.12)]',
      glow: 'hover:shadow-[0_0_15px_rgba(242,5,116,0.25)]'
    };
  }
  if (t.includes('t1')) {
    return {
      bg: 'bg-[#E4002B]/10',
      border: 'border-[#E4002B]/30',
      text: 'text-[#E4002B]',
      avatarRing: 'border-[#E4002B]/40 shadow-[0_0_25px_rgba(228,0,43,0.12)]',
      glow: 'hover:shadow-[0_0_15px_rgba(228,0,43,0.25)]'
    };
  }
  return {
    bg: 'bg-zinc-800/40',
    border: 'border-zinc-700/30',
    text: 'text-zinc-300',
    avatarRing: 'border-zinc-800/80 shadow-[0_0_20px_rgba(255,255,255,0.02)]',
    glow: 'hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]'
  };
}

// --- Reusable inline components ---
const isNumeric = (val: string | number) => {
  if (typeof val === 'number') return true;
  return /\d/.test(String(val));
};

function SettingRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  const isValNumeric = value !== null && value !== undefined && isNumeric(value);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0">
      <span className="text-xs text-zinc-400 font-sans font-medium">{label}</span>
      <span className={`text-sm text-white ${isValNumeric ? 'font-mono font-medium' : 'font-display font-bold'}`}>
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
  const isValNumeric = !isEmpty && isNumeric(displayValue);

  if (accent) {
    return (
      <div className="bg-accent/[0.05] border border-accent/20 hover:border-accent/40 hover:bg-accent/[0.08] p-3 rounded-xl transition-all duration-300 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent/80 font-sans">{label}</span>
        <span className={`text-lg font-extrabold ${isEmpty ? 'text-zinc-700 font-display' : isValNumeric ? 'text-accent font-mono font-medium' : 'text-accent font-display'}`}>
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#12121A]/40 border border-border-custom hover:border-border-hover/60 p-3 rounded-xl transition-all duration-300 flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-sans">{label}</span>
      <span className={`text-lg font-bold ${isEmpty ? 'text-zinc-700 font-display' : isValNumeric ? 'font-mono font-medium text-white' : 'font-display text-white'}`}>
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

  // Dynamic profile image mock for Boo
  if (player.username.toLowerCase() === 'boo') {
    player.profile_img_url = '/images/boo.png';
  }

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

  // Dynamic mock images for testing (Boo)
  if (player.username.toLowerCase() === 'boo') {
    products.forEach((prod: any) => {
      if (prod.category.toLowerCase() === 'mouse') {
        prod.name = 'Razer Viper V4 Pro White';
        prod.image_url = '/images/viper-v4.png';
      }
      if (prod.category.toLowerCase() === 'monitor') {
        prod.name = 'ZOWIE XL2586X+';
        prod.image_url = '/images/zowie-monitor.png';
      }
    });
  }

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
  const brandColors = getTeamBrandColors(player.team);
  const realName = player.Full_name || player.full_name || player.real_name;

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
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 min-w-32 min-h-32 md:min-w-40 md:min-h-40 max-w-32 max-h-32 md:max-w-40 md:max-h-40 aspect-square rounded-2xl bg-[#1A1A24] border border-border-custom flex items-center justify-center font-black text-accent text-4xl md:text-5xl overflow-hidden shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.05)]">
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
                  <Link href={`/teams?team=${encodeURIComponent(player.team)}`}>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg font-sans tracking-wide border cursor-pointer transition-all duration-300 ${brandColors.bg} ${brandColors.border} ${brandColors.text} ${brandColors.glow}`}>
                      <TeamLogoImg teamName={player.team} className="w-4 h-4" />
                      <span>{player.team}</span>
                    </span>
                  </Link>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center text-xs sm:text-sm text-zinc-400 font-sans gap-x-3 gap-y-1.5">
                {realName && (
                  <span className="font-semibold text-zinc-200">{realName}</span>
                )}
                {realName && (player.nationality || player.country_code || player.birth_date) && (
                  <span className="text-zinc-700 font-bold">•</span>
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
                    <span>{player.nationality}</span>
                  </span>
                )}
                {!player.nationality && player.country_code && (
                  <span className="flex items-center gap-1.5">
                    <img
                      src={`https://flagcdn.com/16x12/${player.country_code.toLowerCase()}.png`}
                      alt={player.country_code}
                      className="w-4 h-3 object-cover rounded-[2px]"
                    />
                    <span>{player.country_code}</span>
                  </span>
                )}
                {(player.nationality || player.country_code) && player.birth_date && (
                  <span className="text-zinc-700 font-bold">•</span>
                )}
                {player.birth_date && (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>
                      {formatBirthDate(player.birth_date)}
                      {calculateAge(player.birth_date) !== null && ` (${calculateAge(player.birth_date)} years old)`}
                    </span>
                  </span>
                )}
              </div>



              {/* Description placeholder */}
              <div className="border-l-2 border-zinc-700/50 pl-4 py-0.5 max-w-2xl pt-1">
                <p className="text-xs text-zinc-400 leading-relaxed italic font-sans">
                  {(player as any).bio || "Description ex: Professional Esports player. Best known for exceptional playstyle, high-level game sense, and contribution to team strategies in competitive tournaments."}
                </p>
              </div>
            </div>
          </div>

          {/* Social media logos & Copy profile URL */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 lg:ml-auto">
            {/* Dynamic Social logos container */}
            {(() => {
              const socials = (player as any).social_links || {};
              const twitterLink = socials.twitter || socials.x;
              const twitchLink = socials.twitch;
              const instagramLink = socials.instagram;
              const youtubeLink = socials.youtube;
              const tiktokLink = socials.tiktok;

              const hasAnySocial = Boolean(twitterLink || twitchLink || instagramLink || youtubeLink || tiktokLink);
              if (!hasAnySocial) return null;

              return (
                <div className="flex items-center gap-1 bg-[#12121A]/60 border border-border-custom px-2 py-1.5 rounded-xl">
                  {/* Twitter / X */}
                  {twitterLink && (
                    <a
                      href={formatSocialUrl(twitterLink, 'twitter')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      title="Twitter / X"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}

                  {/* Twitch */}
                  {twitchLink && (
                    <a
                      href={formatSocialUrl(twitchLink, 'twitch')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-[#9146FF] hover:bg-[#9146FF]/10 rounded-lg transition-all duration-200"
                      title="Twitch"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" fillRule="evenodd" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}

                  {/* Instagram */}
                  {instagramLink && (
                    <a
                      href={formatSocialUrl(instagramLink, 'instagram')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-[#E1306C] hover:bg-[#E1306C]/10 rounded-lg transition-all duration-200"
                      title="Instagram"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" />
                      </svg>
                    </a>
                  )}

                  {/* YouTube */}
                  {youtubeLink && (
                    <a
                      href={formatSocialUrl(youtubeLink, 'youtube')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-[#FF0000] hover:bg-[#FF0000]/10 rounded-lg transition-all duration-200"
                      title="YouTube"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  )}

                  {/* TikTok */}
                  {tiktokLink && (
                    <a
                      href={formatSocialUrl(tiktokLink, 'tiktok')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-[#00F2FE] hover:bg-[#00F2FE]/10 rounded-lg transition-all duration-200"
                      title="TikTok"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.27 1.76-.23 1.02.14 2.16.92 2.85.8.72 1.95.91 2.97.62.91-.25 1.67-.98 1.9-1.9.15-.6.18-1.24.18-1.87V.02z" />
                      </svg>
                    </a>
                  )}
                </div>
              );
            })()}

            {/* Copy profile URL button */}
            <CopyProfileUrlButton />
          </div>
        </div>
      </section>

      {/* ================================================ */}
      {/* INTERACTIVE CLIENT DETAIL AREA */}
      {/* ================================================ */}
      <PlayerProfileClient
        player={player}
        settingsData={settingsData || []}
        gears={gears}
        hardware={hardware}
        playerMouse={playerMouse}
        playerKeyboard={playerKeyboard}
        playerMonitor={playerMonitor}
      />
    </div>
  );
}
