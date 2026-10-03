'use client';

import { useState } from 'react';
import Link from 'next/link';
import GearCard from '@/components/GearCard';
import CommentSection from '@/components/CommentSection';
import ProfileSidebar from '@/components/ProfileSidebar';
import CopyButton from '@/components/CopyButton';
import TeamLogoImg from '@/components/TeamLogoImg';
import CrosshairPreview, { getCrosshairExportCode, parseCrosshairDetails } from '@/components/CrosshairPreview';
import CS2CrosshairPreview, {
  parseCS2CrosshairDetails,
  getCS2ConsoleCommandsString,
  CS2_COLOR_PRESETS,
  CS2_STYLES
} from '@/components/CS2CrosshairPreview';

type Product = {
  id: number;
  name: string;
  category: string;
  product_type: 'gear' | 'hardware';
  image_url: string | null;
  shopee_url: string | null;
  lazada_url: string | null;
  amazon_url: string | null;
  estimated_price_thb: number | null;
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

const isNumeric = (val: string | number) => {
  if (typeof val === 'number') return true;
  return /\d/.test(String(val));
};

export function MouseLeftClickIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="14" height="20" rx="7" stroke="currentColor" strokeWidth="1.8" className="text-zinc-500" />
      <line x1="5" y1="9.5" x2="19" y2="9.5" stroke="currentColor" strokeWidth="1.4" className="text-zinc-600" />
      <line x1="12" y1="2" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.4" className="text-zinc-600" />
      <path
        d="M 12 2.2 A 6.8 6.8 0 0 0 5.2 9 L 5.2 9.5 L 12 9.5 Z"
        fill="currentColor"
        className="text-white"
      />
    </svg>
  );
}

export function MouseRightClickIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="14" height="20" rx="7" stroke="currentColor" strokeWidth="1.8" className="text-zinc-500" />
      <line x1="5" y1="9.5" x2="19" y2="9.5" stroke="currentColor" strokeWidth="1.4" className="text-zinc-600" />
      <line x1="12" y1="2" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.4" className="text-zinc-600" />
      <path
        d="M 12 2.2 A 6.8 6.8 0 0 1 18.8 9 L 18.8 9.5 L 12 9.5 Z"
        fill="currentColor"
        className="text-white"
      />
    </svg>
  );
}

export function MouseMiddleClickIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="14" height="20" rx="7" stroke="currentColor" strokeWidth="1.8" className="text-zinc-500" />
      <line x1="5" y1="9.5" x2="19" y2="9.5" stroke="currentColor" strokeWidth="1.4" className="text-zinc-600" />
      <line x1="12" y1="2" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.4" className="text-zinc-600" />
      <rect x="10.5" y="3.5" width="3" height="5" rx="1.5" fill="currentColor" className="text-white" />
    </svg>
  );
}

const CANONICAL_KEYBINDS_ORDER: Record<string, string[]> = {
  Weapons: [
    'Fire',
    'Alternate Fire',
    'Toggle Zoom Level',
    'Aim Down Sights',
    'Sniper Rifle Aim',
    'Operator Zoom',
    'Operator Zoom Mode',
    'Auto Re-enter Scope',
    'Reload',
    'Inspect Weapon',
    'Equip Primary Weapon',
    'Equip Secondary Weapon',
    'Equip Melee Weapon',
    'Equip Spike',
    'Cycle to Next Weapon',
    'Cycle to Previous Weapon',
    'Drop Equipped Item',
    'Use / Defuse Object'
  ],
  Movement: [
    'Forward',
    'Strafe Left',
    'Back',
    'Strafe Right',
    'Jump',
    'Walk',
    'Crouch'
  ],
  Abilities: [
    'Ability 1',
    'Ability 2',
    'Ability 3 (Signature)',
    'Ultimate Ability'
  ],
  Communication: [
    'Ping',
    'Team Push to Talk',
    'Party Push to Talk'
  ],
  Interface: [
    'Show Map',
    'Show Scoreboard'
  ]
};

export function renderKeyBadge(action: string, keyName: string) {
  const normKey = String(keyName).trim().toLowerCase();
  const normAction = String(action).trim().toLowerCase();

  const isLeftClick =
    normKey === 'l-click' ||
    normKey === 'leftmousebutton' ||
    (normAction === 'fire' && normKey.includes('click'));

  const isRightClick =
    normKey === 'r-click' ||
    normKey === 'rightmousebutton' ||
    (normAction === 'alternate fire' && normKey.includes('click'));

  const isMiddleClick =
    normKey === 'm-click' ||
    normKey === 'middlemousebutton' ||
    normKey === 'wheel click' ||
    normKey === 'middle mouse button' ||
    (normAction === 'toggle zoom level' && normKey.includes('click'));

  if (isLeftClick) {
    return (
      <span
        className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-750 text-white font-mono text-[10px] font-bold shadow-sm shrink-0 inline-flex items-center justify-center min-w-[28px] h-[22px]"
        title="Left Click"
      >
        <MouseLeftClickIcon className="w-3.5 h-3.5" />
      </span>
    );
  }

  if (isRightClick) {
    return (
      <span
        className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-750 text-white font-mono text-[10px] font-bold shadow-sm shrink-0 inline-flex items-center justify-center min-w-[28px] h-[22px]"
        title="Right Click"
      >
        <MouseRightClickIcon className="w-3.5 h-3.5" />
      </span>
    );
  }

  if (isMiddleClick) {
    return (
      <span
        className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-750 text-white font-mono text-[10px] font-bold shadow-sm shrink-0 inline-flex items-center justify-center min-w-[28px] h-[22px]"
        title="Middle Click"
      >
        <MouseMiddleClickIcon className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-750 text-white font-mono text-[10px] font-bold shadow-sm shrink-0 inline-flex items-center justify-center h-[22px]">
      {String(keyName)}
    </span>
  );
}

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

function renderGameLogo(slug: string | undefined) {
  if (!slug) return null;
  const s = slug.toLowerCase();
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
  return null;
}

type PlayerProfileClientProps = {
  player: any;
  settingsData: any[];
  gears: any[];
  hardware: any[];
  playerMouse: any;
  playerKeyboard: any;
  playerMonitor: any;
  showComments?: boolean;
};

export default function PlayerProfileClient({
  player,
  settingsData,
  gears,
  hardware,
  playerMouse,
  playerKeyboard,
  playerMonitor,
  showComments = true
}: PlayerProfileClientProps) {
  const [selectedGameId, setSelectedGameId] = useState<number>(settingsData[0]?.games?.id || 0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeCrosshairIndex, setActiveCrosshairIndex] = useState<number>(0);

  const activeSettings = settingsData.find(s => s.games?.id === selectedGameId) || settingsData[0] || null;
  const settingsJson = activeSettings?.settings_data || {};
  const isValorant = activeSettings?.games?.slug === 'valorant';
  const isCS2 = activeSettings?.games?.slug === 'cs2' || activeSettings?.games?.slug === 'csgo';

  // Multiple Crosshairs extraction
  const crosshairsList = Array.isArray(settingsJson.crosshairs) && settingsJson.crosshairs.length > 0
    ? settingsJson.crosshairs
    : [
        {
          name: 'Primary Crosshair',
          crosshair_code: settingsJson.crosshair_code,
          crosshair_color: settingsJson.crosshair_color,
          crosshair_dot: settingsJson.crosshair_dot,
          crosshair_outline: settingsJson.crosshair_outline,
          crosshair_inner: settingsJson.crosshair_inner,
          crosshair_outer: settingsJson.crosshair_outer,
          crosshair_thickness: settingsJson.crosshair_thickness,
        }
      ];

  const currentCrosshair = crosshairsList[activeCrosshairIndex] || crosshairsList[0];
  const parsedCurrentCrosshair = parseCrosshairDetails(currentCrosshair);
  const parsedCsCurrentCrosshair = parseCS2CrosshairDetails(currentCrosshair);
  const currentCrosshairCode = isCS2
    ? (currentCrosshair.crosshair_code || parsedCsCurrentCrosshair.crosshair_code)
    : getCrosshairExportCode(currentCrosshair);

  const displayAspect = activeSettings?.aspect_ratio || getAspectRatio(activeSettings?.resolution);
  const displayRefresh = activeSettings?.refresh_rate
    ? `${activeSettings.refresh_rate}`
    : getRefreshRate(playerMonitor?.name);

  const hasKeyboardSettings = settingsJson && (
    settingsJson.rapid_trigger !== undefined ||
    settingsJson.actuation_point !== undefined ||
    settingsJson.keyboard_profile !== undefined ||
    settingsJson.polling_rate !== undefined
  );

  return (
    <div className="w-full">
      {/* Game Settings Selector Dropdown (renders if multiple game profiles exist) */}
      {settingsData && settingsData.length > 1 && (
        <div className="relative z-30 max-w-xs mb-8">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-11 bg-card hover:bg-white/[0.02] border border-border-custom hover:border-border-hover rounded-xl px-4 flex items-center justify-between text-white font-display font-bold text-sm tracking-wide transition-all duration-200 cursor-pointer shadow-md select-none"
          >
            <div className="flex items-center gap-2.5">
              {renderGameLogo(activeSettings?.games?.slug)}
              <span>{activeSettings?.games?.name} Settings</span>
            </div>
            <span className="text-zinc-500 text-[10px] ml-2 font-mono transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-[#12121A] border border-border-custom rounded-xl shadow-2xl overflow-hidden divide-y divide-white/[0.04] z-50">
              {settingsData.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedGameId(s.games.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-4 py-3.5 text-xs font-bold font-display cursor-pointer transition-colors ${
                    s.games.id === selectedGameId
                      ? 'bg-accent/15 text-accent'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {renderGameLogo(s.games.slug)}
                  <span>{s.games.name} Settings</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content + Sidebar Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8">
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
                  <div className="flex items-center gap-3 bg-[#12121A]/40 border border-border-custom/50 p-2 rounded-xl mb-5 hover:border-border-hover/80 transition-all duration-200">
                    {playerMouse.image_url ? (
                      <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        <img src={playerMouse.image_url} alt={playerMouse.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-black/40 border border-zinc-805 flex items-center justify-center shrink-0 text-zinc-650 shadow-inner">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <rect x="5" y="2" width="14" height="20" rx="7" />
                          <path d="M12 2v10M5 12h14" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white tracking-wide uppercase font-sans line-clamp-1">{playerMouse.name}</p>
                    </div>
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <StatHighlight label="DPI" value={activeSettings?.mouse_dpi} />
                  <StatHighlight label="Sensitivity" value={activeSettings?.in_game_sens !== null && activeSettings?.in_game_sens !== undefined ? Number(activeSettings.in_game_sens).toFixed(3) : null} />
                  <StatHighlight label="eDPI" value={activeSettings?.edpi} />
                  <StatHighlight label="Hz" value={activeSettings?.mouse_hz ? `${activeSettings.mouse_hz}` : null} />
                  {isValorant && settingsJson.scoped_sens && (
                    <StatHighlight label="ADS / Scoped" value={settingsJson.scoped_sens} />
                  )}
                  {!isValorant && settingsJson.zoom_sens && (
                    <StatHighlight label="Zoom Sens" value={settingsJson.zoom_sens} />
                  )}
                </div>
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
                  <div className="flex items-center gap-3 bg-[#12121A]/40 border border-border-custom/50 p-2 rounded-xl mb-5 hover:border-border-hover/80 transition-all duration-200">
                    {playerKeyboard.image_url ? (
                      <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        <img src={playerKeyboard.image_url} alt={playerKeyboard.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-black/40 border border-zinc-850 flex items-center justify-center shrink-0 text-zinc-650 shadow-inner">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <rect x="2" y="4" width="20" height="16" rx="3" />
                          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white tracking-wide uppercase font-sans line-clamp-1">{playerKeyboard.name}</p>
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

                {settingsJson.keybinds && typeof settingsJson.keybinds === 'object' ? (() => {
                  const rawKeybinds = settingsJson.keybinds as Record<string, Record<string, string>>;

                  const getCategoryItems = (categoryName: string): [string, string][] => {
                    const matchedCatKey = Object.keys(rawKeybinds).find(
                      k => k.toLowerCase() === categoryName.toLowerCase()
                    );
                    if (!matchedCatKey) return [];
                    const rawCat = rawKeybinds[matchedCatKey];
                    if (!rawCat || typeof rawCat !== 'object') return [];

                    const orderedActions = CANONICAL_KEYBINDS_ORDER[categoryName] || [];
                    const items: [string, string][] = [];

                    for (const action of orderedActions) {
                      const matchedActionKey = Object.keys(rawCat).find(
                        k => k.toLowerCase() === action.toLowerCase()
                      );
                      if (!matchedActionKey) continue;
                      const val = rawCat[matchedActionKey];
                      if (val && typeof val === 'string' && val.trim() !== '' && val.trim().toLowerCase() !== 'none') {
                        items.push([action, val.trim()]);
                      }
                    }
                    return items;
                  };

                  const weaponsItems = getCategoryItems('Weapons');
                  const movementItems = getCategoryItems('Movement');
                  const abilitiesItems = getCategoryItems('Abilities');
                  const commsItems = getCategoryItems('Communication');
                  const interfaceItems = getCategoryItems('Interface');

                  const totalCount = weaponsItems.length + movementItems.length + abilitiesItems.length + commsItems.length + interfaceItems.length;
                  if (totalCount === 0) {
                    return <EmptyState message="Keybind data coming soon — stay tuned!" />;
                  }

                  return (
                    <div className="space-y-4">
                      {/* Main Categories in 2-column grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5 items-start">
                        {/* Col 1: Weapons & Abilities */}
                        <div className="space-y-3.5">
                          {weaponsItems.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent border-l-2 border-accent pl-2 font-sans">
                                Weapons
                              </p>
                              <div className="space-y-1">
                                {weaponsItems.map(([action, keyName]) => (
                                  <div
                                    key={action}
                                    className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                                  >
                                    <span className="text-[11px] text-zinc-400 font-sans truncate mr-2">{action}</span>
                                    {renderKeyBadge(action, keyName)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {abilitiesItems.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent border-l-2 border-accent pl-2 font-sans">
                                Abilities
                              </p>
                              <div className="space-y-1">
                                {abilitiesItems.map(([action, keyName]) => (
                                  <div
                                    key={action}
                                    className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                                  >
                                    <span className="text-[11px] text-zinc-400 font-sans truncate mr-2">{action}</span>
                                    {renderKeyBadge(action, keyName)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Col 2: Movement & Communication */}
                        <div className="space-y-3.5">
                          {movementItems.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent border-l-2 border-accent pl-2 font-sans">
                                Movement
                              </p>
                              <div className="space-y-1">
                                {movementItems.map(([action, keyName]) => (
                                  <div
                                    key={action}
                                    className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                                  >
                                    <span className="text-[11px] text-zinc-400 font-sans truncate mr-2">{action}</span>
                                    {renderKeyBadge(action, keyName)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {commsItems.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent border-l-2 border-accent pl-2 font-sans">
                                Communication
                              </p>
                              <div className="space-y-1">
                                {commsItems.map(([action, keyName]) => (
                                  <div
                                    key={action}
                                    className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                                  >
                                    <span className="text-[11px] text-zinc-400 font-sans truncate mr-2">{action}</span>
                                    {renderKeyBadge(action, keyName)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interface Category as compact inline pills */}
                      {interfaceItems.length > 0 && (
                        <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent border-l-2 border-accent pl-2 font-sans">
                            Interface
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {interfaceItems.map(([action, keyName]) => (
                              <div
                                key={action}
                                className="inline-flex items-center gap-2 py-1 px-2.5 rounded-lg bg-black/20 hover:bg-black/40 border border-zinc-800/40 transition-colors"
                              >
                                <span className="text-[11px] text-zinc-400 font-sans">{action}</span>
                                {renderKeyBadge(action, keyName)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <EmptyState message="Keybind data coming soon — stay tuned!" />
                )}
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

                {/* Dynamic Crosshair preview area */}
                {isCS2 ? (
                  <CS2CrosshairPreview
                    settings={currentCrosshair}
                    crosshairs={crosshairsList}
                    currentIndex={activeCrosshairIndex}
                    onIndexChange={setActiveCrosshairIndex}
                  />
                ) : (
                  <CrosshairPreview
                    settings={currentCrosshair}
                    crosshairs={crosshairsList}
                    currentIndex={activeCrosshairIndex}
                    onIndexChange={setActiveCrosshairIndex}
                    isValorant={isValorant}
                  />
                )}

                {/* Crosshair Settings */}
                {isCS2 ? (
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 border-l-2 border-amber-400 pl-2 font-sans">
                        {currentCrosshair.name || "CS2 Crosshair Settings"}
                      </p>
                      {crosshairsList.length > 1 && (
                        <span className="text-[9px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/5">
                          {activeCrosshairIndex + 1} of {crosshairsList.length}
                        </span>
                      )}
                    </div>
                    <SettingRow label="Style" value={CS2_STYLES[parsedCsCurrentCrosshair.style] || `Style ${parsedCsCurrentCrosshair.style}`} />
                    <SettingRow label="Size" value={parsedCsCurrentCrosshair.size} />
                    <SettingRow label="Gap" value={parsedCsCurrentCrosshair.gap} />
                    <SettingRow label="Thickness" value={parsedCsCurrentCrosshair.thickness} />
                    <SettingRow label="Center Dot" value={parsedCsCurrentCrosshair.dot ? "On" : "Off"} />
                    <SettingRow
                      label="Outline"
                      value={
                        parsedCsCurrentCrosshair.outline
                          ? (parsedCsCurrentCrosshair.outline_thickness > 1
                              ? `On (${parsedCsCurrentCrosshair.outline_thickness})`
                              : "On")
                          : "Off"
                      }
                    />
                    <SettingRow label="T-Style" value={parsedCsCurrentCrosshair.t_style ? "On" : "Off"} />
                    <SettingRow label="Follow Recoil" value={parsedCsCurrentCrosshair.recoil ? "On" : "Off"} />
                    <SettingRow label="Color" value={parsedCsCurrentCrosshair.color === 5 ? "Custom RGB" : (CS2_COLOR_PRESETS[parsedCsCurrentCrosshair.color]?.name || "Green")} />
                  </div>
                ) : (
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent border-l-2 border-accent pl-2 font-sans">
                        {currentCrosshair.name || "Crosshair Settings"}
                      </p>
                      {crosshairsList.length > 1 && (
                        <span className="text-[9px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/5">
                          {activeCrosshairIndex + 1} of {crosshairsList.length}
                        </span>
                      )}
                    </div>
                    <SettingRow
                      label="Inner Lines"
                      value={
                        parsedCurrentCrosshair.innerShow
                          ? `${parsedCurrentCrosshair.innerOpacity} / ${parsedCurrentCrosshair.innerLength} / ${parsedCurrentCrosshair.innerThickness} / ${parsedCurrentCrosshair.innerOffset}`
                          : "Off"
                      }
                    />
                    <SettingRow
                      label="Outer Lines"
                      value={
                        parsedCurrentCrosshair.outerShow
                          ? `${parsedCurrentCrosshair.outerOpacity} / ${parsedCurrentCrosshair.outerLength} / ${parsedCurrentCrosshair.outerThickness} / ${parsedCurrentCrosshair.outerOffset}`
                          : "Off"
                      }
                    />
                    <SettingRow label="Center Dot" value={parsedCurrentCrosshair.hasCenterDot ? (parsedCurrentCrosshair.dotSize > 1 ? `On (${parsedCurrentCrosshair.dotSize})` : "On") : "Off"} />
                    <SettingRow label="Thickness" value={parsedCurrentCrosshair.innerThickness} />
                    <SettingRow
                      label="Outline"
                      value={
                        parsedCurrentCrosshair.hasOutline
                          ? (parsedCurrentCrosshair.outlineOpacity !== 1 || parsedCurrentCrosshair.outlineThickness !== 1
                              ? `On (${parsedCurrentCrosshair.outlineOpacity} / ${parsedCurrentCrosshair.outlineThickness})`
                              : "On")
                          : "Off"
                      }
                    />
                    <SettingRow label="Color" value={parsedCurrentCrosshair.colorName} />
                  </div>
                )}

                {isCS2 ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <CopyButton 
                      textToCopy={currentCrosshairCode} 
                      label="Copy Share Code" 
                      successLabel="Share Code Copied!"
                      className="flex-1 text-[10px] font-bold py-2.5 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-border-custom hover:border-border-hover transition-all duration-200 font-mono uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                    />
                    <CopyButton 
                      textToCopy={getCS2ConsoleCommandsString(currentCrosshair)} 
                      label="Copy Commands" 
                      successLabel="Commands Copied!"
                      className="flex-1 text-[10px] font-bold py-2.5 px-4 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white border border-amber-500/20 hover:border-amber-500/30 transition-all duration-200 font-mono uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                    />
                  </div>
                ) : (
                  <CopyButton 
                    textToCopy={currentCrosshairCode} 
                    label="Copy Crosshair Code" 
                    successLabel="Crosshair Code Copied!"
                    className="w-full text-[10px] font-bold py-2.5 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-border-custom hover:border-border-hover transition-all duration-200 font-mono uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                  />
                )}
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
                  <SettingRow label="Rotate" value={settingsJson.map_rotate} />
                  <SettingRow label="Fixed Orientation" value={settingsJson.map_fixed_orientation} />
                  <SettingRow label="Keep Player Centered" value={settingsJson.map_keep_centered} />
                  <SettingRow label="Minimap Size" value={settingsJson.map_minimap_size} />
                  <SettingRow label="Minimap Zoom" value={settingsJson.map_minimap_zoom} />
                  <SettingRow label="Minimap Vision Cones" value={settingsJson.map_vision_cones} />
                </div>
              </div>
            </div>
          </div>

          {/* ================================================ */}
          {/* SECTION 3: VIDEO SETTINGS (Full Width) */}
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
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-accent border-l-2 border-accent pl-2 font-sans mb-3 border-b border-white/5 pb-2">Video — General</p>
                <div className="space-y-1">
                  <SettingRow label="Display Mode" value={settingsJson.display_mode || 'Fullscreen'} />
                  <SettingRow label="Resolution" value={activeSettings?.resolution} />
                  <SettingRow label="Aspect Ratio" value={displayAspect} />
                  {!isValorant && settingsJson.scaling_mode && (
                    <SettingRow label="Scaling Mode" value={settingsJson.scaling_mode} />
                  )}
                  <SettingRow label="NVIDIA Reflex Low Latency" value={settingsJson.nvidia_reflex || null} />
                </div>

                {isValorant && (
                  <>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-accent border-l-2 border-accent pl-2 font-sans mt-5 mb-3 border-b border-white/5 pb-2">Accessibility</p>
                    <div className="space-y-1">
                      <SettingRow label="Enemy Highlight Color" value={settingsJson.enemy_highlight_color || null} />
                    </div>
                  </>
                )}
              </div>

              {/* Right: Graphics Quality */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-accent border-l-2 border-accent pl-2 font-sans mb-3 border-b border-white/5 pb-2">Video — Graphics Quality</p>
                <div className="space-y-1">
                  {isValorant ? (
                    <>
                      <SettingRow label="Multithreaded Rendering" value={settingsJson.multithreaded_rendering || null} />
                      <SettingRow label="Material Quality" value={settingsJson.material_quality || null} />
                      <SettingRow label="Texture Quality" value={settingsJson.texture_quality || null} />
                      <SettingRow label="Detail Quality" value={settingsJson.detail_quality || null} />
                      <SettingRow label="UI Quality" value={settingsJson.ui_quality || null} />
                      <SettingRow label="Vignette" value={settingsJson.vignette || null} />
                      <SettingRow label="VSync" value={settingsJson.vsync || null} />
                      <SettingRow label="Anti-Aliasing" value={settingsJson.anti_aliasing || null} />
                      <SettingRow label="Anisotropic Filtering" value={settingsJson.anisotropic_filtering || null} />
                      <SettingRow label="Improve Clarity" value={settingsJson.improve_clarity || null} />
                      <SettingRow label="Bloom" value={settingsJson.bloom || null} />
                      <SettingRow label="Distortion" value={settingsJson.distortion || null} />
                      <SettingRow label="Cast Shadows" value={settingsJson.cast_shadows || null} />
                    </>
                  ) : (
                    <>
                      <SettingRow label="Multithreaded Rendering" value={settingsJson.multithreaded_rendering || null} />
                      <SettingRow label="Global Shadow Quality" value={settingsJson.material_quality || null} />
                      <SettingRow label="Model / Texture Detail" value={settingsJson.texture_quality || null} />
                      <SettingRow label="VSync" value={settingsJson.vsync || null} />
                      <SettingRow label="Anti-Aliasing Mode" value={settingsJson.anti_aliasing || null} />
                      <SettingRow label="Texture Filtering Mode" value={settingsJson.anisotropic_filtering || null} />
                    </>
                  )}
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
          {/* SECTION 6: COMMENTS (Only on Pro Player pages) */}
          {/* ================================================ */}
          {showComments && (
            <div id="comments" className="scroll-mt-24 bg-card backdrop-blur-[8px] border border-border-custom p-5 sm:p-6 rounded-2xl">
              <CommentSection username={player.username} />
            </div>
          )}
        </div>

        {/* ======= RIGHT SIDEBAR (Desktop only) ======= */}
        <ProfileSidebar showComments={showComments} />
      </div>
    </div>
  );
}
