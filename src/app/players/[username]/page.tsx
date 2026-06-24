import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/StatCard';
import GearCard from '@/components/GearCard';
import CommentSection from '@/components/CommentSection';

type PageProps = {
  params: Promise<{ username: string }> | { username: string };
};

export default async function PlayerProfilePage({ params }: PageProps) {
  const resolvedParams = 'then' in params ? await params : params;
  const username = resolvedParams.username;

  if (!username) {
    return notFound();
  }

  // 1. ดึงข้อมูลประวัติผู้เล่น (Player Profile)
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .ilike('username', username)
    .maybeSingle();

  if (playerError) {
    console.error('Database error fetching player:', playerError.message);
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

  if (!player) {
    return notFound();
  }

  // 2. ดึงค่าการตั้งค่าเกมทั้งหมดของผู้เล่น (Game Settings)
  const { data: settingsData, error: settingsError } = await supabase
    .from('player_game_settings')
    .select(`
      id,
      game_role,
      mouse_dpi,
      mouse_hz,
      in_game_sens,
      edpi,
      resolution,
      aspect_ratio,
      refresh_rate,
      settings_data,
      games (
        id,
        name,
        slug
      )
    `)
    .eq('player_id', player.id);

  if (settingsError) {
    console.error('Error fetching settings:', settingsError.message);
  }

  // 3. ดึงรายการอุปกรณ์ (Gears & Hardware)
  const { data: productsData, error: productsError } = await supabase
    .from('player_products')
    .select(`
      products (
        id,
        name,
        category,
        product_type,
        shopee_url,
        lazada_url,
        amazon_url,
        image_url,
        estimated_price_thb
      )
    `)
    .eq('player_id', player.id);

  if (productsError) {
    console.error('Error fetching products:', productsError.message);
  }

  // ปรับรูปข้อมูลสินค้า
  const products = (productsData || [])
    .map((item: any) => item.products)
    .filter((p: any) => p !== null);

  // แยกประเภทสินค้า
  const gears = products.filter((p: any) => p.product_type === 'gear');
  const hardware = products.filter((p: any) => p.product_type === 'hardware');

  // ดึงชื่อเมาส์ของผู้เล่นเพื่อเอาไปแสดงคู่กับ Mouse Settings
  const playerMouse = gears.find((g: any) => g.category.toLowerCase() === 'mouse');

  // ดึงชื่อคีย์บอร์ดเพื่อเอาไปแสดงคู่กับ Keyboard Settings
  const playerKeyboard = gears.find((g: any) => g.category.toLowerCase() === 'keyboard');

  return (
    <div className="relative flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-10 space-y-12 overflow-hidden">

      {/* Decorative Local Ambient Orbs */}
      <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-accent opacity-[0.02] blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[30%] right-[-15%] w-[450px] h-[450px] rounded-full bg-accent opacity-[0.02] blur-[120px] pointer-events-none"></div>

      {/* Back Link */}
      <div className="relative z-10">
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-mono"
        >
          ← BACK TO PLAYERS
        </Link>
      </div>

      {/* Player Header Card */}
      <div className="relative z-10 bg-card backdrop-blur-[8px] border border-border-custom p-6 sm:p-8 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-border-hover transition-all duration-300">
        <div className="flex items-center gap-5">
          {/* Avatar Profile */}
          <div className="h-20 w-20 rounded-full bg-[#1A1A24] border border-border-custom flex items-center justify-center font-black text-accent text-3xl overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.05)]">
            {player.profile_img_url ? (
              <img
                src={player.profile_img_url}
                alt={player.username}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).parentElement!.innerText = player.username[0].toUpperCase();
                }}
              />
            ) : (
              player.username[0].toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                {player.username}
              </h1>
              {player.country_code && (
                <span
                  className="text-[10px] font-bold text-zinc-500 font-mono tracking-wider"
                  title={player.nationality || ''}
                >
                  {player.country_code}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {player.real_name && (
                <p className="text-sm text-zinc-400 font-medium">
                  {player.real_name}
                </p>
              )}
              {player.team && (
                <p className="text-xs font-bold text-accent font-mono tracking-wide bg-accent/5 border border-accent/15 px-2 py-0.5 rounded">
                  {player.team}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Roles/Games Badges */}
        <div className="flex flex-wrap gap-2">
          {settingsData && settingsData.map((s: any) => (
            <div
              key={s.id}
              className="flex items-center gap-2 bg-[#12121A]/80 border border-border-custom py-2 px-4 rounded-lg"
            >
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${s.games.slug === 'valorant' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                {s.games.name}
              </span>
              {s.game_role && (
                <span className="text-xs text-zinc-400 font-medium border-l border-white/10 pl-2 font-mono">
                  {s.game_role}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Grid (Mouse & Video & Keyboard Settings) */}
      <div className="relative z-10 space-y-6">
        {settingsData && settingsData.map((s: any) => {
          const isValorant = s.games.slug === 'valorant';
          const settingsJson = s.settings_data || {};

          // ตรวจสอบเงื่อนไข Keyboard Settings พิเศษ
          const hasKeyboardSettings = settingsJson && (
            settingsJson.rapid_trigger !== undefined ||
            settingsJson.actuation_point !== undefined ||
            settingsJson.keyboard_profile !== undefined ||
            settingsJson.polling_rate !== undefined
          );

          return (
            <div key={s.id} className="space-y-6 border border-border-custom bg-card backdrop-blur-[8px] p-6 rounded-lg">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-border-custom pb-3 font-display">
                <span className={`h-2 w-2 rounded-full ${isValorant ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                {s.games.name} Game Settings
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Mouse Settings Block */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono flex flex-wrap items-center gap-2">
                    <span>Mouse Settings</span>
                    {playerMouse && (
                      <span className="text-accent text-[9px] bg-accent/5 px-2 py-0.5 rounded font-bold border border-accent/15">
                        {playerMouse.name}
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="DPI" value={s.mouse_dpi} />
                    <StatCard label="Sensitivity" value={s.in_game_sens !== null ? s.in_game_sens.toFixed(3) : '—'} />
                    <StatCard label="eDPI" value={s.edpi} />
                    <StatCard label="Hz" value={s.mouse_hz} />
                  </div>

                  {/* Game-Specific Mouse Settings */}
                  {isValorant && settingsJson.scoped_sens && (
                    <div className="bg-[#12121A]/50 border border-border-custom p-4 rounded-lg flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-500">Scoped Sensitivity</span>
                      <span className="font-bold text-accent text-sm">{settingsJson.scoped_sens}</span>
                    </div>
                  )}
                  {!isValorant && settingsJson.zoom_sens && (
                    <div className="bg-[#12121A]/50 border border-border-custom p-4 rounded-lg flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-500">Zoom Sensitivity</span>
                      <span className="font-bold text-accent text-sm">{settingsJson.zoom_sens}</span>
                    </div>
                  )}
                </div>

                {/* Video Settings Block */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    Video Settings
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard label="Resolution" value={s.resolution} />
                    <StatCard label="Aspect Ratio" value={s.aspect_ratio} />
                    <StatCard label="Refresh Rate" value={s.refresh_rate} subValue="Hz" />
                  </div>

                  {/* CS2 Scaling Mode */}
                  {!isValorant && settingsJson.scaling_mode && (
                    <div className="bg-[#12121A]/50 border border-border-custom p-4 rounded-lg flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-500">Scaling Mode</span>
                      <span className="font-bold text-white text-sm">{settingsJson.scaling_mode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Keyboard Settings (Conditional Display) */}
              {hasKeyboardSettings && (
                <div className="border-t border-border-custom pt-6 space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono flex flex-wrap items-center gap-2">
                    <span>Keyboard Settings</span>
                    {playerKeyboard && (
                      <span className="text-accent text-[9px] bg-accent/5 px-2 py-0.5 rounded font-bold border border-accent/15">
                        {playerKeyboard.name}
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {settingsJson.rapid_trigger !== undefined && (
                      <StatCard label="Rapid Trigger" value={settingsJson.rapid_trigger} />
                    )}
                    {settingsJson.actuation_point !== undefined && (
                      <StatCard label="Actuation Point" value={settingsJson.actuation_point} />
                    )}
                    {settingsJson.keyboard_profile !== undefined && (
                      <StatCard label="Keyboard Profile" value={settingsJson.keyboard_profile} />
                    )}
                    {settingsJson.polling_rate !== undefined && (
                      <StatCard label="Polling Rate" value={settingsJson.polling_rate} />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gaming Gear Section */}
      <div className="relative z-10 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
          <span>Gaming Gear</span>
        </h2>
        {gears.length === 0 ? (
          <p className="text-xs text-zinc-500 italic font-mono">No gaming gear information available for this pro player.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gears.map((product: any) => (
              <GearCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* PC Specifications Section */}
      <div className="relative z-10 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
          <span>PC Specifications</span>
        </h2>
        {hardware.length === 0 ? (
          <p className="text-xs text-zinc-500 italic font-mono">No hardware specifications available for this pro player.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {hardware.map((product: any) => (
              <GearCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="relative z-10 bg-card backdrop-blur-[8px] border border-border-custom p-6 sm:p-8 rounded-lg">
        <CommentSection username={player.username} />
      </div>

    </div>
  );
}
