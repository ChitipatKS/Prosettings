'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { parseValorantCrosshairToFields, getCrosshairExportCode, parseCrosshairDetails } from '@/components/CrosshairPreview';
import CS2CrosshairPreview, {
  CS2CrosshairSettings,
  decodeCSGOShareCode,
  encodeCSGOShareCode,
  parseCS2CrosshairDetails,
  getCS2ConsoleCommandsString,
  CS2_COLOR_PRESETS,
  CS2_STYLES
} from '@/components/CS2CrosshairPreview';

type Country = {
  name: string;
  code: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  product_type: 'gear' | 'hardware';
};

function GearSearchSelect({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = "Search and select..."
}: {
  label: string;
  options: Product[];
  selectedValue: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = options.find(p => p.id.toString() === selectedValue);

  useEffect(() => {
    if (!isUserTyping) {
      if (selectedProduct) {
        setSearchQuery(selectedProduct.name);
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedProduct, isUserTyping]);

  const filteredOptions = isUserTyping && searchQuery.trim().length > 0
    ? options.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const displayOptions = filteredOptions;

  return (
    <div className="relative space-y-1.5 w-full">
      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsUserTyping(true);
            setIsOpen(true);
            if (e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={() => {
            if (inputRef.current) {
              inputRef.current.select();
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              setIsUserTyping(false);
              if (selectedProduct) {
                setSearchQuery(selectedProduct.name);
              } else {
                setSearchQuery('');
              }
            }, 200);
          }}
          placeholder={placeholder}
          className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 pr-10 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {selectedValue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchQuery('');
                setIsUserTyping(false);
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

        {isOpen && isUserTyping && searchQuery.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-[#0F0F15] border border-zinc-800 rounded-xl shadow-2xl divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
            {displayOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 italic font-mono">
                No matching gears found
              </div>
            ) : (
              displayOptions.map((product) => {
                const isSelected = product.id.toString() === selectedValue;
                return (
                  <div
                    key={product.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(product.id.toString());
                      setSearchQuery(product.name);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors ${isSelected
                        ? 'bg-accent/15 text-accent font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                      }`}
                  >
                    {product.name}
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

function getAspectRatio(res: string | null): string {
  if (!res) return '16:9';
  const cleanRes = res.trim();
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
  if (!w || !h) return '16:9';
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(w, h);
  return `${w / divisor}:${h / divisor}`;
}

function getRefreshRate(monitorName: string | null): string {
  if (!monitorName) return '240';
  const name = monitorName.toUpperCase();
  if (name.includes('540') || name.includes('PG248QP')) return '540';
  if (name.includes('500') || name.includes('AW2524H')) return '500';
  if (name.includes('380') || name.includes('XL2586X')) return '380';
  if (name.includes('360') || name.includes('XL2566') || name.includes('PG259') || name.includes('AW2521H')) return '360';
  if (name.includes('240') || name.includes('XL2546') || name.includes('PG258')) return '240';
  if (name.includes('165')) return '165';
  if (name.includes('144') || name.includes('XL2411') || name.includes('VG248')) return '144';
  return '240';
}

type PlayerFormProps = {
  title: string;
  isEdit?: boolean;
  playerId?: number;
};

export default function PlayerForm({ title, isEdit = false, playerId }: PlayerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lists
  const [countries, setCountries] = useState<Country[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // 1. Basic Info State
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [team, setTeam] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [description, setDescription] = useState('');
  const [profileImgUrl, setProfileImgUrl] = useState('');

  // Social Links State
  const [twitterUrl, setTwitterUrl] = useState('');
  const [twitchUrl, setTwitchUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teamInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Teams Dropdown State
  const [teams, setTeams] = useState<any[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');

  // 2. Games Played State
  const [playsValorant, setPlaysValorant] = useState(false);
  const [playsCS2, setPlaysCS2] = useState(false);

  // Valorant Settings
  const [valRole, setValRole] = useState('');
  const [valDpi, setValDpi] = useState('800');
  const [valSens, setValSens] = useState('0.35');
  const [valHz, setValHz] = useState('1000');
  const [valScopedSens, setValScopedSens] = useState('1.0');
  const [valRes, setValRes] = useState('1920x1080');
  const [valAspect, setValAspect] = useState('16:9');
  const [valEnemyHighlight, setValEnemyHighlight] = useState('Red (Default)');
  const [valDisplayMode, setValDisplayMode] = useState('Fullscreen');
  const [valNvidiaReflex, setValNvidiaReflex] = useState('On + Boost');
  const [valMultithreaded, setValMultithreaded] = useState('On');
  const [valMaterialQuality, setValMaterialQuality] = useState('Low');
  const [valTextureQuality, setValTextureQuality] = useState('Low');
  const [valDetailQuality, setValDetailQuality] = useState('Low');
  const [valUiQuality, setValUiQuality] = useState('Low');
  const [valVignette, setValVignette] = useState('Off');
  const [valVsync, setValVsync] = useState('Off');
  const [valAntiAliasing, setValAntiAliasing] = useState('None');
  const [valAnisotropic, setValAnisotropic] = useState('1x');
  const [valImproveClarity, setValImproveClarity] = useState('Off');
  const [valBloom, setValBloom] = useState('Off');
  const [valDistortion, setValDistortion] = useState('Off');
  const [valCastShadows, setValCastShadows] = useState('Off');

  // Valorant Map Settings
  const [valMapRotate, setValMapRotate] = useState('Rotate');
  const [valMapFixedOrientation, setValMapFixedOrientation] = useState('Always the same');
  const [valMapKeepCentered, setValMapKeepCentered] = useState('On');
  const [valMapMinimapSize, setValMapMinimapSize] = useState('1.1');
  const [valMapMinimapZoom, setValMapMinimapZoom] = useState('0.9');
  const [valMapVisionCones, setValMapVisionCones] = useState('On');

  // Valorant Crosshair Settings (Multiple Crosshairs supported)
  const [valCrosshairs, setValCrosshairs] = useState<Array<{
    id: string;
    name: string;
    crosshair_code: string;
    crosshair_color: string;
    crosshair_outline: string;
    crosshair_dot: string;
    crosshair_inner: string;
    crosshair_outer: string;
    crosshair_thickness: string;
    inner_movement_error?: boolean;
    inner_firing_error?: boolean;
    outer_movement_error?: boolean;
    outer_firing_error?: boolean;
  }>>([
    {
      id: '1',
      name: 'Primary Crosshair',
      crosshair_code: '0;P;c;5;h;0;d;0;0b;1;0t;1;0l;4;0o;2;0a;1;1b;0',
      crosshair_color: 'Cyan',
      crosshair_outline: 'Off',
      crosshair_dot: 'Off',
      crosshair_inner: '1 / 4 / 2 / 2',
      crosshair_outer: 'Off',
      crosshair_thickness: '1'
    }
  ]);

  // CS2 Settings
  const [csRole, setCsRole] = useState('');
  const [csDpi, setCsDpi] = useState('800');
  const [csSens, setCsSens] = useState('1.0');
  const [csHz, setCsHz] = useState('1000');
  const [csZoomSens, setCsZoomSens] = useState('1.0');
  const [csRes, setCsRes] = useState('1280x960');
  const [csAspect, setCsAspect] = useState('4:3');
  const [csDisplayMode, setCsDisplayMode] = useState('Fullscreen');
  const [csNvidiaReflex, setCsNvidiaReflex] = useState('Disabled');
  const [csMultithreaded, setCsMultithreaded] = useState('Enabled');
  const [csMaterialQuality, setCsMaterialQuality] = useState('Low');
  const [csTextureQuality, setCsTextureQuality] = useState('Low');
  const [csVsync, setCsVsync] = useState('Disabled');
  const [csAntiAliasing, setCsAntiAliasing] = useState('None');
  const [csAnisotropic, setCsAnisotropic] = useState('Bilinear');

  // CS2 Crosshair Settings (Multiple Crosshairs supported)
  const [csCrosshairs, setCsCrosshairs] = useState<Array<CS2CrosshairSettings>>([
    {
      id: '1',
      name: 'Primary Crosshair',
      crosshair_code: 'CSGO-xOXnV-jZP3R-9eAyU-8Kewr-UupcG',
      style: 4,
      size: 2,
      gap: -3,
      thickness: 1,
      dot: false,
      outline: false,
      outline_thickness: 1,
      color: 1,
      color_r: 50,
      color_g: 250,
      color_b: 50,
      alpha: 255,
      use_alpha: true,
      t_style: false,
      recoil: false,
      crosshair_color: 'Green',
      crosshair_outline: '0',
      crosshair_dot: '0',
      crosshair_inner: 'Classic Static',
      crosshair_outer: '',
      crosshair_thickness: '1'
    }
  ]);

  const [copiedCsCmdIndex, setCopiedCsCmdIndex] = useState<number | null>(null);
  const [copiedCsCodeIndex, setCopiedCsCodeIndex] = useState<number | null>(null);

  // 3. Gears Selection State
  const [selectedMouseId, setSelectedMouseId] = useState('');
  const [selectedKeyboardId, setSelectedKeyboardId] = useState('');
  const [selectedMousepadId, setSelectedMousepadId] = useState('');
  const [selectedHeadsetId, setSelectedHeadsetId] = useState('');
  const [selectedMonitorId, setSelectedMonitorId] = useState('');
  const [selectedGpuId, setSelectedGpuId] = useState('');
  const [selectedCpuId, setSelectedCpuId] = useState('');

  // Autofocus team input if query param is set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('focus') === 'team') {
        setTimeout(() => {
          teamInputRef.current?.focus();
        }, 500);
      }
    }
  }, []);

  // Handle click outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTeamDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load lists on mount
  useEffect(() => {
    async function loadFormMetadata() {
      try {
        // Load countries
        const countriesRes = await fetch('/api/countries');
        if (countriesRes.ok) {
          const data = await countriesRes.json();
          setCountries(data.countries || []);
        }

        // Load teams
        const teamsRes = await fetch('/api/teams');
        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeams(data.teamObjects || []);
        }

        // Load all products
        const gearsRes = await fetch('/api/gears?limit=1000');
        let allProducts: Product[] = [];
        if (gearsRes.ok) {
          const data = await gearsRes.json();
          allProducts = data.products || [];
          setProducts(allProducts);
        }

        // Load player details if in edit mode
        if (isEdit && playerId) {
          // Fetch player details
          const { data: player, error: playerErr } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .maybeSingle();

          if (playerErr) throw playerErr;
          if (!player) throw new Error('Player not found.');

          setUsername(player.username || '');
          setRealName(player.Full_name || player.full_name || player.real_name || '');
          setTeam(player.team || '');
          setTeamId(player.team_id || null);
          setCountryCode(player.country_code || '');
          setBirthDate(player.birth_date || '');
          setDescription(player.description || '');
          setProfileImgUrl(player.profile_img_url || '');

          const socials = player.social_links || {};
          setTwitterUrl(socials.twitter || socials.x || '');
          setTwitchUrl(socials.twitch || '');
          setInstagramUrl(socials.instagram || '');
          setYoutubeUrl(socials.youtube || '');
          setTiktokUrl(socials.tiktok || '');

          // Fetch player gear/products first to get the monitor name
          const { data: playerProducts, error: productsErr } = await supabase
            .from('player_products')
            .select('product_id, products(category)')
            .eq('player_id', playerId);

          if (productsErr) throw productsErr;

          let monitorName = '';
          if (playerProducts) {
            playerProducts.forEach((pp: any) => {
              if (!pp.products) return;
              const cat = pp.products.category.toLowerCase();
              const pid = pp.product_id.toString();
              if (cat === 'mouse') setSelectedMouseId(pid);
              else if (cat === 'keyboard') setSelectedKeyboardId(pid);
              else if (cat === 'mousepad') setSelectedMousepadId(pid);
              else if (cat === 'headset') setSelectedHeadsetId(pid);
              else if (cat === 'monitor') {
                setSelectedMonitorId(pid);
                const mon = allProducts.find(p => p.id.toString() === pid);
                if (mon) monitorName = mon.name;
              }
              else if (cat === 'gpu') setSelectedGpuId(pid);
              else if (cat === 'cpu') setSelectedCpuId(pid);
            });
          }

          // Fetch player game settings
          const { data: settings, error: settingsErr } = await supabase
            .from('player_game_settings')
            .select('*')
            .eq('player_id', playerId);

          if (settingsErr) throw settingsErr;

          if (settings) {
            const valSetting = settings.find(s => s.game_id === 2); // Valorant
            if (valSetting) {
              setPlaysValorant(true);
              setValRole(valSetting.game_role || '');
              setValDpi(valSetting.mouse_dpi?.toString() || '800');
              setValSens(valSetting.in_game_sens?.toString() || '0.35');
              setValHz(valSetting.mouse_hz?.toString() || '1000');
              setValScopedSens(valSetting.scoped_sens?.toString() || '1.0');
              
              const rawRes = valSetting.resolution || '1920x1080';
              setValRes(rawRes);
              setValAspect(valSetting.aspect_ratio || getAspectRatio(rawRes) || '16:9');
              
              const sData = valSetting.settings_data || {};
              setValEnemyHighlight(sData.enemy_highlight_color || 'Red (Default)');
              setValDisplayMode(sData.display_mode || 'Fullscreen');
              setValNvidiaReflex(sData.nvidia_reflex || 'On + Boost');
              setValMultithreaded(sData.multithreaded_rendering || 'On');
              setValMaterialQuality(sData.material_quality || 'Low');
              setValTextureQuality(sData.texture_quality || 'Low');
              setValDetailQuality(sData.detail_quality || 'Low');
              setValUiQuality(sData.ui_quality || 'Low');
              setValVignette(sData.vignette || 'Off');
              setValVsync(sData.vsync || 'Off');
              setValAntiAliasing(sData.anti_aliasing || 'None');
              setValAnisotropic(sData.anisotropic_filtering || '1x');
              setValImproveClarity(sData.improve_clarity || 'Off');
              setValBloom(sData.bloom || 'Off');
              setValDistortion(sData.distortion || 'Off');
              setValCastShadows(sData.cast_shadows || 'Off');

              // Load Map settings
              setValMapRotate(sData.map_rotate || 'Rotate');
              setValMapFixedOrientation(sData.map_fixed_orientation || 'Always the same');
              setValMapKeepCentered(sData.map_keep_centered || 'On');
              setValMapMinimapSize(sData.map_minimap_size || '1.1');
              setValMapMinimapZoom(sData.map_minimap_zoom || '0.9');
              setValMapVisionCones(sData.map_vision_cones || 'On');

              // Load Crosshair settings (Multiple Crosshairs supported)
              if (Array.isArray(sData.crosshairs) && sData.crosshairs.length > 0) {
                setValCrosshairs(sData.crosshairs.map((c: any, idx: number) => {
                  const chParsed = c.crosshair_code ? parseCrosshairDetails({ crosshair_code: c.crosshair_code }) : null;
                  const item = {
                    id: c.id || String(idx + 1),
                    name: c.name || `Crosshair ${idx + 1}`,
                    crosshair_code: c.crosshair_code || '',
                    crosshair_color: c.crosshair_color || 'Cyan',
                    crosshair_outline: c.crosshair_outline || 'Off',
                    crosshair_dot: c.crosshair_dot || 'Off',
                    crosshair_inner: c.crosshair_inner || '1 / 4 / 2 / 2',
                    crosshair_outer: c.crosshair_outer || 'Off',
                    crosshair_thickness: c.crosshair_thickness || '1',
                    inner_movement_error: c.inner_movement_error ?? chParsed?.innerMovementError ?? false,
                    inner_firing_error: c.inner_firing_error ?? chParsed?.innerFiringError ?? true,
                    outer_movement_error: c.outer_movement_error ?? chParsed?.outerMovementError ?? true,
                    outer_firing_error: c.outer_firing_error ?? chParsed?.outerFiringError ?? true,
                  };
                  if (!item.crosshair_code) {
                    item.crosshair_code = getCrosshairExportCode({ ...item, crosshair_code: undefined });
                  }
                  return item;
                }));
              } else {
                const primaryParsed = sData.crosshair_code ? parseCrosshairDetails({ crosshair_code: sData.crosshair_code }) : null;
                const primaryItem = {
                  id: '1',
                  name: 'Primary Crosshair',
                  crosshair_code: sData.crosshair_code || '',
                  crosshair_color: sData.crosshair_color || 'Cyan',
                  crosshair_outline: sData.crosshair_outline || 'Off',
                  crosshair_dot: sData.crosshair_dot || 'Off',
                  crosshair_inner: sData.crosshair_inner || '1 / 4 / 2 / 2',
                  crosshair_outer: sData.crosshair_outer || 'Off',
                  crosshair_thickness: sData.crosshair_thickness || '1',
                  inner_movement_error: sData.inner_movement_error ?? primaryParsed?.innerMovementError ?? false,
                  inner_firing_error: sData.inner_firing_error ?? primaryParsed?.innerFiringError ?? true,
                  outer_movement_error: sData.outer_movement_error ?? primaryParsed?.outerMovementError ?? true,
                  outer_firing_error: sData.outer_firing_error ?? primaryParsed?.outerFiringError ?? true,
                };
                if (!primaryItem.crosshair_code) {
                  primaryItem.crosshair_code = getCrosshairExportCode({ ...primaryItem, crosshair_code: undefined });
                }
                setValCrosshairs([primaryItem]);
              }
            }

            const csSetting = settings.find(s => s.game_id === 3); // CS2
            if (csSetting) {
              setPlaysCS2(true);
              setCsRole(csSetting.game_role || '');
              setCsDpi(csSetting.mouse_dpi?.toString() || '800');
              setCsSens(csSetting.in_game_sens?.toString() || '1.0');
              setCsHz(csSetting.mouse_hz?.toString() || '1000');
              setCsZoomSens(csSetting.zoom_sens?.toString() || '1.0');
              
              const rawRes = csSetting.resolution || '1280x960';
              setCsRes(rawRes);
              setCsAspect(csSetting.aspect_ratio || getAspectRatio(rawRes) || '4:3');
              
              const sData = csSetting.settings_data || {};
              setCsDisplayMode(sData.display_mode || 'Fullscreen');
              setCsNvidiaReflex(sData.nvidia_reflex || 'Disabled');
              setCsMultithreaded(sData.multithreaded_rendering || 'Enabled');
              setCsMaterialQuality(sData.material_quality || 'Low');
              setCsTextureQuality(sData.texture_quality || 'Low');
              setCsVsync(sData.vsync || 'Disabled');
              setCsAntiAliasing(sData.anti_aliasing || 'None');
              setCsAnisotropic(sData.anisotropic_filtering || 'Bilinear');

              // Load CS2 Crosshair settings (Multiple Crosshairs supported)
              if (Array.isArray(sData.crosshairs) && sData.crosshairs.length > 0) {
                setCsCrosshairs(sData.crosshairs.map((c: any, idx: number) => {
                  const normalized = parseCS2CrosshairDetails(c);
                  return {
                    ...normalized,
                    id: c.id || String(idx + 1),
                    name: c.name || `Crosshair ${idx + 1}`,
                    crosshair_code: c.crosshair_code || normalized.crosshair_code
                  };
                }));
              } else {
                const single = {
                  id: '1',
                  name: 'Primary Crosshair',
                  crosshair_code: sData.crosshair_code || '',
                  crosshair_color: sData.crosshair_color || 'Green',
                  crosshair_outline: sData.crosshair_outline || '0',
                  crosshair_dot: sData.crosshair_dot || '0',
                  crosshair_inner: sData.crosshair_inner || 'Classic Static',
                  crosshair_outer: sData.crosshair_outer || '',
                  crosshair_thickness: sData.crosshair_thickness || '1'
                };
                const normalized = parseCS2CrosshairDetails(single);
                setCsCrosshairs([
                  {
                    ...normalized,
                    ...single,
                    crosshair_code: sData.crosshair_code || normalized.crosshair_code
                  }
                ]);
              }
            }
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading metadata.');
      } finally {
        setLoading(false);
      }
    }

    loadFormMetadata();
  }, [isEdit, playerId]);

  // Handle Image Upload to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple file validation
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file directly to the bucket
      const { error: uploadError } = await supabase.storage
        .from('player-profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-profiles')
        .getPublicUrl(filePath);

      setProfileImgUrl(publicUrl);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const countryObj = countries.find(c => c.code === countryCode);
    const nationality = countryObj ? countryObj.name : '';

    try {
      let savedPlayerId = playerId;

      const socialLinksPayload = {
        twitter: twitterUrl.trim() || null,
        twitch: twitchUrl.trim() || null,
        instagram: instagramUrl.trim() || null,
        youtube: youtubeUrl.trim() || null,
        tiktok: tiktokUrl.trim() || null
      };

      // 1. Insert or Update player info
      if (isEdit && playerId) {
        const { error } = await supabase
          .from('players')
          .update({
            username: username.trim(),
            Full_name: realName.trim() || null,
            team: team.trim() || null,
            team_id: teamId,
            nationality: nationality || null,
            country_code: countryCode || null,
            birth_date: birthDate || null,
            description: description.trim() || null,
            profile_img_url: profileImgUrl || null,
            social_links: socialLinksPayload
          })
          .eq('id', playerId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('players')
          .insert({
            username: username.trim(),
            Full_name: realName.trim() || null,
            team: team.trim() || null,
            team_id: teamId,
            nationality: nationality || null,
            country_code: countryCode || null,
            birth_date: birthDate || null,
            description: description.trim() || null,
            profile_img_url: profileImgUrl || null,
            social_links: socialLinksPayload
          })
          .select('id')
          .single();

        if (error) throw error;
        savedPlayerId = data.id;
      }

      if (!savedPlayerId) throw new Error('Player ID not resolved.');

      // 2. Manage Player Game Settings
      // Delete existing settings first
      await supabase
        .from('player_game_settings')
        .delete()
        .eq('player_id', savedPlayerId);

      // Insert selected settings
      const settingsToInsert = [];
      if (playsValorant) {
        // Automatically generate and ensure fresh crosshair code from configured fields for all crosshairs
        const finalValCrosshairs = valCrosshairs.map(ch => {
          const generatedCode = getCrosshairExportCode({
            ...ch,
            crosshair_code: undefined // Force code generation from current settings fields
          });
          return {
            ...ch,
            crosshair_code: generatedCode || ch.crosshair_code?.trim() || ''
          };
        });

        const primaryValCrosshair = finalValCrosshairs[0] || {};
        settingsToInsert.push({
          player_id: savedPlayerId,
          game_id: 2, // Valorant
          game_role: valRole.trim() || null,
          mouse_dpi: parseFloat(valDpi) || null,
          mouse_hz: parseInt(valHz, 10) || null,
          in_game_sens: parseFloat(valSens) || null,
          edpi: (parseFloat(valDpi) || 0) * (parseFloat(valSens) || 0) || null,
          resolution: valRes || null,
          aspect_ratio: valAspect || null,
          refresh_rate: null,
          settings_data: { 
            enemy_highlight_color: valEnemyHighlight,
            scoped_sens: parseFloat(valScopedSens) || 1.0,
            display_mode: valDisplayMode,
            nvidia_reflex: valNvidiaReflex,
            multithreaded_rendering: valMultithreaded,
            material_quality: valMaterialQuality,
            texture_quality: valTextureQuality,
            detail_quality: valDetailQuality,
            ui_quality: valUiQuality,
            vignette: valVignette,
            vsync: valVsync,
            anti_aliasing: valAntiAliasing,
            anisotropic_filtering: valAnisotropic,
            improve_clarity: valImproveClarity,
            bloom: valBloom,
            distortion: valDistortion,
            cast_shadows: valCastShadows,
            map_rotate: valMapRotate,
            map_fixed_orientation: valMapFixedOrientation,
            map_keep_centered: valMapKeepCentered,
            map_minimap_size: valMapMinimapSize,
            map_minimap_zoom: valMapMinimapZoom,
            map_vision_cones: valMapVisionCones,
            crosshairs: finalValCrosshairs,
            crosshair_code: primaryValCrosshair.crosshair_code?.trim() || undefined,
            crosshair_color: primaryValCrosshair.crosshair_color || undefined,
            crosshair_outline: primaryValCrosshair.crosshair_outline || undefined,
            crosshair_dot: primaryValCrosshair.crosshair_dot || undefined,
            crosshair_inner: primaryValCrosshair.crosshair_inner?.trim() || undefined,
            crosshair_outer: primaryValCrosshair.crosshair_outer?.trim() || undefined,
            crosshair_thickness: primaryValCrosshair.crosshair_thickness?.trim() || undefined
          }
        });
      }

      if (playsCS2) {
        const finalCsCrosshairs = csCrosshairs.map(c => {
          const freshCode = (!c.crosshair_code || !c.crosshair_code.trim().startsWith('CSGO-'))
            ? encodeCSGOShareCode(c)
            : c.crosshair_code.trim();
          return {
            ...c,
            crosshair_code: freshCode
          };
        });
        const primaryCsCrosshair = finalCsCrosshairs[0] || {};
        settingsToInsert.push({
          player_id: savedPlayerId,
          game_id: 3, // CS2
          game_role: csRole.trim() || null,
          mouse_dpi: parseFloat(csDpi) || null,
          mouse_hz: parseInt(csHz, 10) || null,
          in_game_sens: parseFloat(csSens) || null,
          edpi: (parseFloat(csDpi) || 0) * (parseFloat(csSens) || 0) || null,
          resolution: csRes || null,
          aspect_ratio: csAspect || null,
          refresh_rate: null,
          settings_data: { 
            zoom_sens: parseFloat(csZoomSens) || 1.0,
            display_mode: csDisplayMode,
            nvidia_reflex: csNvidiaReflex,
            multithreaded_rendering: csMultithreaded,
            material_quality: csMaterialQuality,
            texture_quality: csTextureQuality,
            vsync: csVsync,
            anti_aliasing: csAntiAliasing,
            anisotropic_filtering: csAnisotropic,
            crosshairs: finalCsCrosshairs,
            crosshair_code: primaryCsCrosshair.crosshair_code?.trim() || undefined,
            crosshair_color: primaryCsCrosshair.color !== undefined ? CS2_COLOR_PRESETS[primaryCsCrosshair.color]?.name : primaryCsCrosshair.crosshair_color,
            crosshair_outline: primaryCsCrosshair.outline ? '1' : '0',
            crosshair_dot: primaryCsCrosshair.dot ? '1' : '0',
            crosshair_inner: primaryCsCrosshair.style !== undefined ? CS2_STYLES[primaryCsCrosshair.style] : primaryCsCrosshair.crosshair_inner,
            crosshair_outer: primaryCsCrosshair.crosshair_outer?.trim() || undefined,
            crosshair_thickness: primaryCsCrosshair.thickness !== undefined ? String(primaryCsCrosshair.thickness) : primaryCsCrosshair.crosshair_thickness
          }
        });
      }

      if (settingsToInsert.length > 0) {
        const { error } = await supabase
          .from('player_game_settings')
          .insert(settingsToInsert);
        if (error) throw error;
      }

      // 3. Manage Player Gear Selection
      // Delete existing products first
      await supabase
        .from('player_products')
        .delete()
        .eq('player_id', savedPlayerId);

      // Insert new selections
      const productIds = [
        selectedMouseId,
        selectedKeyboardId,
        selectedMousepadId,
        selectedHeadsetId,
        selectedMonitorId,
        selectedGpuId,
        selectedCpuId
      ]
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id) && id > 0);

      if (productIds.length > 0) {
        const productRows = productIds.map(pid => ({
          player_id: savedPlayerId,
          product_id: pid
        }));
        const { error } = await supabase
          .from('player_products')
          .insert(productRows);
        if (error) throw error;
      }

      alert(`Player "${username}" saved successfully!`);
      router.push('/admin/players');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full min-h-[50vh] flex-col justify-center items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        <span className="text-zinc-500 text-xs font-mono">Loading form details...</span>
      </div>
    );
  }

  // Filter products by category
  const mice = products.filter(p => p.category === 'mouse');
  const keyboards = products.filter(p => p.category === 'keyboard');
  const mousepads = products.filter(p => p.category === 'mousepad');
  const headsets = products.filter(p => p.category === 'headset');
  const monitors = products.filter(p => p.category === 'monitor');
  const gpus = products.filter(p => p.category === 'gpu');
  const cpus = products.filter(p => p.category === 'cpu');

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      
      {/* Form Header */}
      <div className="border-b border-zinc-800/60 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            {title}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure player profile details, settings, and hardware gears
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/players')}
          className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-black/20 hover:bg-zinc-800/50 rounded-xl text-xs font-bold font-sans uppercase tracking-wider text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono p-4 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Block 1: Basic Profile Details */}
      <div className="bg-[#12121A]/70 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-850 pb-3 flex items-center gap-2">
          <span className="text-accent">1.</span> Basic Profile Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Avatar upload card */}
          <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4 border border-zinc-800/50 p-6 rounded-xl bg-black/25">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center font-bold text-accent text-3xl overflow-hidden relative shadow-inner group">
              {profileImgUrl ? (
                <img src={profileImgUrl} alt="Player Preview" className="h-full w-full object-cover" />
              ) : (
                username ? username[0].toUpperCase() : '?'
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            <div className="flex gap-2 w-full">
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-9 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider font-mono rounded-lg border border-zinc-700 transition-all text-white cursor-pointer text-center flex items-center justify-center"
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>
              {profileImgUrl && (
                <button
                  type="button"
                  onClick={() => setProfileImgUrl('')}
                  className="px-3 h-9 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 rounded-lg text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono cursor-pointer transition-all"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[9px] text-zinc-500 font-mono text-center leading-relaxed">
              Upload files directly to Supabase storage. PNG/JPG formats accepted.
            </p>
          </div>

          {/* Core Info Input Fields */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Real Name</label>
              <input
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
              />
            </div>

            <div ref={dropdownRef} className="space-y-1.5 relative">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Team Name</label>
              <div className="relative">
                <input
                  type="text"
                  ref={teamInputRef}
                  value={team}
                  onChange={(e) => {
                    setTeam(e.target.value);
                    setTeamSearch(e.target.value);
                    setShowTeamDropdown(true);
                  }}
                  onFocus={() => setShowTeamDropdown(true)}
                  placeholder="Select or type to filter..."
                  className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg px-3 pr-10 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  {showTeamDropdown ? '▲' : '▼'}
                </button>
              </div>

              {showTeamDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-[#12121A] border border-zinc-800 rounded-xl shadow-2xl z-50 p-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full h-8 bg-black/60 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent/50 font-mono"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 text-left">
                    <div
                      onClick={() => {
                        setTeam('');
                        setTeamId(null);
                        setTeamSearch('');
                        setShowTeamDropdown(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        team === ''
                          ? 'bg-accent/15 border border-accent/35 text-white font-bold'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md bg-zinc-850 border border-white/5 flex items-center justify-center shrink-0 text-[10px] text-zinc-500 font-bold font-mono">
                        —
                      </div>
                      <span>None (Free Agent)</span>
                    </div>

                    {teams
                      .filter(t => {
                        const q = teamSearch.toLowerCase();
                        return t.name.toLowerCase().includes(q);
                      })
                      .map(t => {
                        const isSelected = team.toLowerCase() === t.name.toLowerCase();
                        return (
                          <div
                            key={`team-opt-${t.id}`}
                            onClick={() => {
                              setTeam(t.name);
                              setTeamId(t.id);
                              setTeamSearch('');
                              setShowTeamDropdown(false);
                            }}
                            className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? 'bg-accent/15 border border-accent/35 text-white font-bold'
                                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-md bg-zinc-850 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-accent font-mono">
                              {t.name[0]?.toUpperCase()}
                            </div>
                            <span>{t.name}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Nationality / Country</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full h-10 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-accent transition-all font-mono cursor-pointer"
              >
                <option value="">Select country...</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Birth Date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-accent transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Image URL (Fallback)</label>
              <input
                type="text"
                value={profileImgUrl}
                onChange={(e) => setProfileImgUrl(e.target.value)}
                placeholder="Direct image link (optional)"
                className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Player Biography / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell something about this player, achievements, roles, bio..."
              rows={3}
              className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
            />
          </div>

          {/* Social Media Links Sub-grid */}
          <div className="md:col-span-3 pt-3 border-t border-zinc-850 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-accent font-mono">
                Social Media Links (Optional)
              </label>
              <span className="text-[9px] text-zinc-500 font-mono">Enter URL or handle</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* X / Twitter */}
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-400 font-mono flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter / X
                </label>
                <input
                  type="text"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              {/* Twitch */}
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-400 font-mono flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-[#9146FF]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" fillRule="evenodd" clipRule="evenodd" />
                  </svg>
                  Twitch
                </label>
                <input
                  type="text"
                  value={twitchUrl}
                  onChange={(e) => setTwitchUrl(e.target.value)}
                  placeholder="https://twitch.tv/username"
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              {/* Instagram */}
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-400 font-mono flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-[#E1306C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" />
                  </svg>
                  Instagram
                </label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              {/* YouTube */}
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-400 font-mono flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  YouTube
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@username"
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>

              {/* TikTok */}
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-400 font-mono flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-[#00F2FE]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.27 1.76-.23 1.02.14 2.16.92 2.85.8.72 1.95.91 2.97.62.91-.25 1.67-.98 1.9-1.9.15-.6.18-1.24.18-1.87V.02z" />
                  </svg>
                  TikTok
                </label>
                <input
                  type="text"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/@username"
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Block 2: Game Settings Configuration */}
      <div className="bg-[#12121A]/70 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-850 pb-3 flex items-center gap-2">
          <span className="text-accent">2.</span> Game Settings Configuration
        </h2>

        {/* Toggle checkboxes */}
        <div className="flex items-center gap-6 py-2">
          <label className="flex items-center gap-2 text-xs font-bold text-white font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={playsValorant}
              onChange={(e) => setPlaysValorant(e.target.checked)}
              className="rounded border-zinc-800 text-accent focus:ring-accent bg-black w-4.5 h-4.5"
            />
            <span>PLAYS VALORANT</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-white font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={playsCS2}
              onChange={(e) => setPlaysCS2(e.target.checked)}
              className="rounded border-zinc-800 text-accent focus:ring-accent bg-black w-4.5 h-4.5"
            />
            <span>PLAYS CS2</span>
          </label>
        </div>

        {/* Valorant settings input sub-block */}
        {playsValorant && (
          <div className="border border-red-500/10 bg-red-500/[0.01] p-5 rounded-xl space-y-5">
            <h3 className="text-xs font-extrabold text-red-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              VALORANT settings configuration
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">In-Game Role</label>
                <input
                  type="text"
                  value={valRole}
                  onChange={(e) => setValRole(e.target.value)}
                  placeholder="e.g. Duelist"
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Mouse DPI</label>
                <input
                  type="number"
                  value={valDpi}
                  onChange={(e) => setValDpi(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Sensitivity</label>
                <input
                  type="number"
                  step="0.001"
                  value={valSens}
                  onChange={(e) => setValSens(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Mouse Hz</label>
                <input
                  type="number"
                  value={valHz}
                  onChange={(e) => setValHz(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Scoped Sens</label>
                <input
                  type="number"
                  step="0.01"
                  value={valScopedSens}
                  onChange={(e) => setValScopedSens(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Resolution</label>
                <input
                  type="text"
                  value={valRes}
                  onChange={(e) => setValRes(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Aspect Ratio</label>
                <input
                  type="text"
                  value={valAspect}
                  onChange={(e) => setValAspect(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Enemy Highlight Color</label>
                <select
                  value={valEnemyHighlight}
                  onChange={(e) => setValEnemyHighlight(e.target.value)}
                  className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
                >
                  <option value="Red (Default)">Red (Default)</option>
                  <option value="Purple">Purple</option>
                  <option value="Yellow (Deuteranopia)">Yellow (Deuteranopia)</option>
                  <option value="Yellow (Protanopia)">Yellow (Protanopia)</option>
                </select>
              </div>
            </div>

            {/* Valorant Video Settings block */}
            <div className="mt-6 border-t border-red-500/10 pt-5 space-y-4">
              <h4 className="text-[11px] font-extrabold text-red-400/85 font-mono uppercase tracking-wider">Video & Graphics Quality Settings</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Display Mode</label>
                  <select value={valDisplayMode} onChange={(e) => setValDisplayMode(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="Fullscreen">Fullscreen</option>
                    <option value="Windowed">Windowed</option>
                    <option value="Borderless">Borderless</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">NVIDIA Reflex</label>
                  <select value={valNvidiaReflex} onChange={(e) => setValNvidiaReflex(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On + Boost">On + Boost</option>
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Multithreaded</label>
                  <select value={valMultithreaded} onChange={(e) => setValMultithreaded(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Material Quality</label>
                  <select value={valMaterialQuality} onChange={(e) => setValMaterialQuality(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Texture Quality</label>
                  <select value={valTextureQuality} onChange={(e) => setValTextureQuality(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Detail Quality</label>
                  <select value={valDetailQuality} onChange={(e) => setValDetailQuality(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">UI Quality</label>
                  <select value={valUiQuality} onChange={(e) => setValUiQuality(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Vignette</label>
                  <select value={valVignette} onChange={(e) => setValVignette(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">VSync</label>
                  <select value={valVsync} onChange={(e) => setValVsync(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Anti-Aliasing</label>
                  <select value={valAntiAliasing} onChange={(e) => setValAntiAliasing(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="MSAA 4x">MSAA 4x</option>
                    <option value="MSAA 2x">MSAA 2x</option>
                    <option value="FXAA">FXAA</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Anisotropic</label>
                  <select value={valAnisotropic} onChange={(e) => setValAnisotropic(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="16x">16x</option>
                    <option value="8x">8x</option>
                    <option value="4x">4x</option>
                    <option value="2x">2x</option>
                    <option value="1x">1x</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Improve Clarity</label>
                  <select value={valImproveClarity} onChange={(e) => setValImproveClarity(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Bloom</label>
                  <select value={valBloom} onChange={(e) => setValBloom(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Distortion</label>
                  <select value={valDistortion} onChange={(e) => setValDistortion(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Cast Shadows</label>
                  <select value={valCastShadows} onChange={(e) => setValCastShadows(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Valorant Map Settings block */}
            <div className="mt-6 border-t border-red-500/10 pt-5 space-y-4">
              <h4 className="text-[11px] font-extrabold text-red-400/85 font-mono uppercase tracking-wider">Minimap & Map Settings</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Rotate</label>
                  <select value={valMapRotate} onChange={(e) => setValMapRotate(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="Rotate">Rotate</option>
                    <option value="Fixed">Fixed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Fixed Orientation</label>
                  <select value={valMapFixedOrientation} onChange={(e) => setValMapFixedOrientation(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="Always the same">Always the same</option>
                    <option value="Based on side">Based on side</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Keep Player Centered</label>
                  <select value={valMapKeepCentered} onChange={(e) => setValMapKeepCentered(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Minimap Size</label>
                  <input
                    type="text"
                    value={valMapMinimapSize}
                    onChange={(e) => setValMapMinimapSize(e.target.value)}
                    placeholder="e.g. 1.1"
                    className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Minimap Zoom</label>
                  <input
                    type="text"
                    value={valMapMinimapZoom}
                    onChange={(e) => setValMapMinimapZoom(e.target.value)}
                    placeholder="e.g. 0.9"
                    className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Minimap Vision Cones</label>
                  <select value={valMapVisionCones} onChange={(e) => setValMapVisionCones(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer">
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Valorant Crosshairs Management (Multiple Crosshairs) */}
            <div className="mt-6 border-t border-red-500/10 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-extrabold text-red-400/85 font-mono uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 12h.01" strokeLinecap="round" />
                  </svg>
                  Crosshair Configurations ({valCrosshairs.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const newCh = {
                      id: String(Date.now()),
                      name: `Crosshair ${valCrosshairs.length + 1}`,
                      crosshair_color: 'Green',
                      crosshair_outline: 'Off',
                      crosshair_dot: 'Off',
                      crosshair_inner: '1 / 4 / 2 / 2',
                      crosshair_outer: 'Off',
                      crosshair_thickness: '2',
                      crosshair_code: ''
                    };
                    newCh.crosshair_code = getCrosshairExportCode({ ...newCh, crosshair_code: undefined });
                    setValCrosshairs(prev => [...prev, newCh]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>+</span> Add Another Crosshair
                </button>
              </div>

              <div className="space-y-4">
                {valCrosshairs.map((c, index) => {
                  const parsed = parseCrosshairDetails(c);

                  const updateValCrosshair = (changes: Partial<typeof c>) => {
                    setValCrosshairs(prev => prev.map((item, i) => {
                      if (i !== index) return item;
                      const updated = { ...item, ...changes };
                      // Always generate fresh code directly from the updated structured settings
                      const newCode = getCrosshairExportCode({
                        ...updated,
                        crosshair_code: undefined
                      });
                      return { ...updated, crosshair_code: newCode };
                    }));
                  };

                  return (
                    <div key={c.id || index} className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-4 relative group">
                      {/* Crosshair Card Header */}
                      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValCrosshairs(prev => prev.map((item, i) => i === index ? { ...item, name: val } : item));
                            }}
                            placeholder="e.g. Primary Crosshair, Dot Crosshair"
                            className="h-8 bg-black/50 border border-zinc-800 rounded-md px-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500/40 w-full"
                          />
                        </div>
                        {valCrosshairs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setValCrosshairs(prev => prev.filter((_, i) => i !== index))}
                            className="text-zinc-500 hover:text-red-400 text-xs font-mono px-2.5 py-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove this crosshair"
                          >
                            ✕ Delete
                          </button>
                        )}
                      </div>

                      {/* Code String Input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase">
                            Crosshair Profile Code (Export / Import String)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const code = getCrosshairExportCode({ ...c, crosshair_code: undefined });
                              setValCrosshairs(prev => prev.map((item, i) => i === index ? { ...item, crosshair_code: code } : item));
                            }}
                            className="text-[9px] font-mono text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"
                            title="Re-generate code from current settings"
                          >
                            <span>⚡ Generate Code from Settings</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={c.crosshair_code}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.trim().includes(';')) {
                              const auto = parseValorantCrosshairToFields(val.trim());
                              setValCrosshairs(prev => prev.map((item, i) => i === index ? {
                                ...item,
                                crosshair_code: val,
                                crosshair_color: auto.crosshair_color,
                                crosshair_outline: auto.crosshair_outline,
                                crosshair_dot: auto.crosshair_dot,
                                crosshair_inner: auto.crosshair_inner,
                                crosshair_outer: auto.crosshair_outer,
                                crosshair_thickness: auto.crosshair_thickness,
                                inner_movement_error: auto.inner_movement_error,
                                inner_firing_error: auto.inner_firing_error,
                                outer_movement_error: auto.outer_movement_error,
                                outer_firing_error: auto.outer_firing_error,
                              } : item));
                            } else {
                              setValCrosshairs(prev => prev.map((item, i) => i === index ? { ...item, crosshair_code: val } : item));
                            }
                          }}
                          placeholder="e.g. 0;P;c;5;o;1;d;1;z;3;f;0;0t;4;0l;2;0o;2;0a;1;0f;0;1b;0"
                          className="w-full h-8 bg-black/60 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono placeholder:text-zinc-700"
                        />
                      </div>

                      {/* 1. GENERAL / COLOR / OUTLINES / DOT */}
                      <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                        <p className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                          Primary / General
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Color</label>
                            <select
                              value={parsed.colorName}
                              onChange={(e) => updateValCrosshair({ crosshair_color: e.target.value })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="Cyan">Cyan</option>
                              <option value="Green">Green</option>
                              <option value="White">White</option>
                              <option value="Yellow">Yellow</option>
                              <option value="Red">Red</option>
                              <option value="Pink">Pink</option>
                              <option value="Custom">Custom</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Crosshair Color (Hex)</label>
                            <input
                              type="text"
                              value={parsed.color}
                              onChange={(e) => updateValCrosshair({ crosshair_color: e.target.value })}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outlines</label>
                            <select
                              value={parsed.hasOutline ? "On" : "Off"}
                              onChange={(e) => {
                                const show = e.target.value === "On";
                                const updated = show ? `On / ${parsed.outlineOpacity} / ${parsed.outlineThickness}` : "Off";
                                updateValCrosshair({ crosshair_outline: updated });
                              }}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="On">On</option>
                              <option value="Off">Off</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outline Opacity</label>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              max="1"
                              value={parsed.outlineOpacity}
                              onChange={(e) => {
                                const op = parseFloat(e.target.value) || 1;
                                const updated = parsed.hasOutline ? `On / ${op} / ${parsed.outlineThickness}` : "Off";
                                updateValCrosshair({ crosshair_outline: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outline Thickness</label>
                            <input
                              type="number"
                              min="1"
                              max="6"
                              value={parsed.outlineThickness}
                              onChange={(e) => {
                                const th = parseFloat(e.target.value) || 1;
                                const updated = parsed.hasOutline ? `On / ${parsed.outlineOpacity} / ${th}` : "Off";
                                updateValCrosshair({ crosshair_outline: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Center Dot</label>
                            <select
                              value={parsed.hasCenterDot ? "On" : "Off"}
                              onChange={(e) => {
                                const show = e.target.value === "On";
                                const updated = show ? `On / 1 / ${parsed.dotSize || 2}` : "Off";
                                updateValCrosshair({ crosshair_dot: updated });
                              }}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="Off">Off</option>
                              <option value="On">On</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Center Dot Opacity</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={parsed.hasCenterDot ? parsed.dotOpacity : 0}
                              disabled={!parsed.hasCenterDot}
                              onChange={(e) => {
                                const op = parseFloat(e.target.value) || 0;
                                const updated = parsed.hasCenterDot ? `On / ${op} / ${parsed.dotSize || 2}` : "Off";
                                updateValCrosshair({ crosshair_dot: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Center Dot Thickness</label>
                            <input
                              type="number"
                              min="1"
                              max="6"
                              value={parsed.dotSize}
                              onChange={(e) => {
                                const sz = parseFloat(e.target.value) || 2;
                                const updated = parsed.hasCenterDot ? `On / 1 / ${sz}` : "Off";
                                updateValCrosshair({ crosshair_dot: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. INNER LINES */}
                      <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                        <p className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                          Inner Lines
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Show Inner Lines</label>
                            <select
                              value={parsed.innerShow ? "On" : "Off"}
                              onChange={(e) => {
                                const show = e.target.value === "On";
                                const updated = show ? `1 / ${parsed.innerLength} / ${parsed.innerThickness} / ${parsed.innerOffset}` : "Off";
                                updateValCrosshair({ crosshair_inner: updated });
                              }}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="On">On</option>
                              <option value="Off">Off</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Inner Line Opacity</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="1"
                              value={parsed.innerOpacity}
                              onChange={(e) => {
                                const op = parseFloat(e.target.value) || 1;
                                const updated = `${op} / ${parsed.innerLength} / ${parsed.innerThickness} / ${parsed.innerOffset}`;
                                updateValCrosshair({ crosshair_inner: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Inner Line Length</label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={parsed.innerLength}
                              onChange={(e) => {
                                const len = parseFloat(e.target.value) || 0;
                                const updated = `1 / ${len} / ${parsed.innerThickness} / ${parsed.innerOffset}`;
                                updateValCrosshair({ crosshair_inner: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Inner Line Thickness</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={parsed.innerThickness}
                              onChange={(e) => {
                                const th = parseFloat(e.target.value) || 1;
                                const updated = `1 / ${parsed.innerLength} / ${th} / ${parsed.innerOffset}`;
                                updateValCrosshair({ crosshair_inner: updated, crosshair_thickness: String(th) });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Inner Line Offset</label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={parsed.innerOffset}
                              onChange={(e) => {
                                const off = parseFloat(e.target.value) || 0;
                                const updated = `1 / ${parsed.innerLength} / ${parsed.innerThickness} / ${off}`;
                                updateValCrosshair({ crosshair_inner: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Movement Error</label>
                            <select
                              value={parsed.innerMovementError ? "On" : "Off"}
                              onChange={(e) => updateValCrosshair({ inner_movement_error: e.target.value === "On" })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="Off">Off</option>
                              <option value="On">On</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Firing Error</label>
                            <select
                              value={parsed.innerFiringError ? "On" : "Off"}
                              onChange={(e) => updateValCrosshair({ inner_firing_error: e.target.value === "On" })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="Off">Off</option>
                              <option value="On">On</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 3. OUTER LINES */}
                      <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                        <p className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                          Outer Lines
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Show Outer Lines</label>
                            <select
                              value={parsed.outerShow ? "On" : "Off"}
                              onChange={(e) => {
                                const show = e.target.value === "On";
                                const updated = show ? `1 / ${parsed.outerLength || 2} / ${parsed.outerThickness || 1} / ${parsed.outerOffset || 3}` : "Off";
                                updateValCrosshair({ crosshair_outer: updated });
                              }}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="Off">Off</option>
                              <option value="On">On</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outer Line Opacity</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="1"
                              value={parsed.outerOpacity}
                              onChange={(e) => {
                                const op = parseFloat(e.target.value) || 1;
                                const updated = `${op} / ${parsed.outerLength} / ${parsed.outerThickness} / ${parsed.outerOffset}`;
                                updateValCrosshair({ crosshair_outer: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outer Line Length</label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={parsed.outerLength}
                              onChange={(e) => {
                                const len = parseFloat(e.target.value) || 0;
                                const updated = `1 / ${len} / ${parsed.outerThickness} / ${parsed.outerOffset}`;
                                updateValCrosshair({ crosshair_outer: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outer Line Thickness</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={parsed.outerThickness}
                              onChange={(e) => {
                                const th = parseFloat(e.target.value) || 0;
                                const updated = `1 / ${parsed.outerLength} / ${th} / ${parsed.outerOffset}`;
                                updateValCrosshair({ crosshair_outer: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outer Line Offset</label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={parsed.outerOffset}
                              onChange={(e) => {
                                const off = parseFloat(e.target.value) || 0;
                                const updated = `1 / ${parsed.outerLength} / ${parsed.outerThickness} / ${off}`;
                                updateValCrosshair({ crosshair_outer: updated });
                              }}
                              className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Movement Error</label>
                            <select
                              value={parsed.outerMovementError ? "On" : "Off"}
                              onChange={(e) => updateValCrosshair({ outer_movement_error: e.target.value === "On" })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="Off">Off</option>
                              <option value="On">On</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Firing Error</label>
                            <select
                              value={parsed.outerFiringError ? "On" : "Off"}
                              onChange={(e) => updateValCrosshair({ outer_firing_error: e.target.value === "On" })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                            >
                              <option value="Off">Off</option>
                              <option value="On">On</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CS2 settings input sub-block */}
        {playsCS2 && (
          <div className="border border-amber-500/10 bg-amber-500/[0.01] p-5 rounded-xl space-y-5">
            <h3 className="text-xs font-extrabold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              CS2 settings configuration
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">In-Game Role</label>
                <input
                  type="text"
                  value={csRole}
                  onChange={(e) => setCsRole(e.target.value)}
                  placeholder="e.g. Awper"
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Mouse DPI</label>
                <input
                  type="number"
                  value={csDpi}
                  onChange={(e) => setCsDpi(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Sensitivity</label>
                <input
                  type="number"
                  step="0.001"
                  value={csSens}
                  onChange={(e) => setCsSens(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Mouse Hz</label>
                <input
                  type="number"
                  value={csHz}
                  onChange={(e) => setCsHz(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Zoom Sens</label>
                <input
                  type="number"
                  step="0.01"
                  value={csZoomSens}
                  onChange={(e) => setCsZoomSens(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Resolution</label>
                <input
                  type="text"
                  value={csRes}
                  onChange={(e) => setCsRes(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 font-mono uppercase">Aspect Ratio</label>
                <input
                  type="text"
                  value={csAspect}
                  onChange={(e) => setCsAspect(e.target.value)}
                  className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                />
              </div>
            </div>

            {/* CS2 Video Settings block */}
            <div className="mt-6 border-t border-amber-500/10 pt-5 space-y-4">
              <h4 className="text-[11px] font-extrabold text-amber-400/80 font-mono uppercase tracking-wider">Video & Graphics Quality Settings</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Display Mode</label>
                  <select value={csDisplayMode} onChange={(e) => setCsDisplayMode(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer">
                    <option value="Fullscreen">Fullscreen</option>
                    <option value="Windowed">Windowed</option>
                    <option value="Borderless">Borderless</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">NVIDIA Reflex</label>
                  <select value={csNvidiaReflex} onChange={(e) => setCsNvidiaReflex(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer">
                    <option value="Enabled + Boost">Enabled + Boost</option>
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Multithreaded</label>
                  <select value={csMultithreaded} onChange={(e) => setCsMultithreaded(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Shadow Quality</label>
                  <select value={csMaterialQuality} onChange={(e) => setCsMaterialQuality(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer">
                    <option value="Very High">Very High</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Texture Quality</label>
                  <select value={csTextureQuality} onChange={(e) => setCsTextureQuality(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">VSync</label>
                  <select value={csVsync} onChange={(e) => setCsVsync(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Anti-Aliasing Mode</label>
                  <select value={csAntiAliasing} onChange={(e) => setCsAntiAliasing(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer">
                    <option value="8x MSAA">8x MSAA</option>
                    <option value="4x MSAA">4x MSAA</option>
                    <option value="2x MSAA">2x MSAA</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Texture Filtering</label>
                  <select value={csAnisotropic} onChange={(e) => setCsAnisotropic(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer">
                    <option value="Anisotropic 16x">Anisotropic 16x</option>
                    <option value="Anisotropic 8x">Anisotropic 8x</option>
                    <option value="Anisotropic 4x">Anisotropic 4x</option>
                    <option value="Anisotropic 2x">Anisotropic 2x</option>
                    <option value="Trilinear">Trilinear</option>
                    <option value="Bilinear">Bilinear</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CS2 Crosshairs Management (Multiple Crosshairs) */}
            <div className="mt-6 border-t border-amber-500/10 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-extrabold text-amber-400/85 font-mono uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 12h.01" strokeLinecap="round" />
                  </svg>
                  Crosshair Configurations ({csCrosshairs.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const newCh: CS2CrosshairSettings = {
                      id: String(Date.now()),
                      name: `Crosshair ${csCrosshairs.length + 1}`,
                      style: 4,
                      size: 2,
                      gap: -3,
                      thickness: 1,
                      dot: false,
                      outline: false,
                      outline_thickness: 1,
                      color: 1,
                      color_r: 50,
                      color_g: 250,
                      color_b: 50,
                      alpha: 255,
                      use_alpha: true,
                      t_style: false,
                      recoil: false,
                      crosshair_color: 'Green',
                      crosshair_outline: '0',
                      crosshair_dot: '0',
                      crosshair_inner: 'Classic Static',
                      crosshair_thickness: '1'
                    };
                    newCh.crosshair_code = encodeCSGOShareCode(newCh);
                    setCsCrosshairs(prev => [...prev, newCh]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>+</span> Add Another Crosshair
                </button>
              </div>

              <div className="space-y-4">
                {csCrosshairs.map((c, index) => {
                  const parsed = parseCS2CrosshairDetails(c);

                  const updateCsCrosshair = (changes: Partial<CS2CrosshairSettings>) => {
                    setCsCrosshairs(prev => prev.map((item, i) => {
                      if (i !== index) return item;
                      const updated: CS2CrosshairSettings = { ...item, ...changes };
                      // Always regenerate valid share code from updated properties
                      const newCode = encodeCSGOShareCode(updated);
                      return {
                        ...updated,
                        crosshair_code: newCode,
                        crosshair_color: updated.color !== undefined ? CS2_COLOR_PRESETS[updated.color]?.name : updated.crosshair_color,
                        crosshair_outline: updated.outline ? '1' : '0',
                        crosshair_dot: updated.dot ? '1' : '0',
                        crosshair_inner: updated.style !== undefined ? CS2_STYLES[updated.style] : updated.crosshair_inner,
                        crosshair_thickness: updated.thickness !== undefined ? String(updated.thickness) : updated.crosshair_thickness
                      };
                    }));
                  };

                  const handleCopyCommands = () => {
                    const cmds = getCS2ConsoleCommandsString(c);
                    navigator.clipboard.writeText(cmds);
                    setCopiedCsCmdIndex(index);
                    setTimeout(() => setCopiedCsCmdIndex(null), 2000);
                  };

                  const handleCopyCode = () => {
                    if (c.crosshair_code) {
                      navigator.clipboard.writeText(c.crosshair_code);
                      setCopiedCsCodeIndex(index);
                      setTimeout(() => setCopiedCsCodeIndex(null), 2000);
                    }
                  };

                  return (
                    <div key={c.id || index} className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-4 relative group">
                      {/* Crosshair Card Header */}
                      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <input
                            type="text"
                            value={c.name || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCsCrosshairs(prev => prev.map((item, i) => i === index ? { ...item, name: val } : item));
                            }}
                            placeholder="e.g. Primary Crosshair, Dot Crosshair"
                            className="h-8 bg-black/50 border border-zinc-800 rounded-md px-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500/40 w-full"
                          />
                        </div>
                        {csCrosshairs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCsCrosshairs(prev => prev.filter((_, i) => i !== index))}
                            className="text-zinc-500 hover:text-amber-400 text-xs font-mono px-2.5 py-1 rounded hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Remove this crosshair"
                          >
                            ✕ Delete
                          </button>
                        )}
                      </div>

                      {/* Live Canvas Crosshair Simulation */}
                      <div className="w-full max-w-md mx-auto">
                        <CS2CrosshairPreview settings={c} className="mb-0" />
                      </div>

                      {/* Share Code and Actions */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase">
                            CS2 Crosshair Share Code
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const code = encodeCSGOShareCode(c);
                                setCsCrosshairs(prev => prev.map((item, i) => i === index ? { ...item, crosshair_code: code } : item));
                              }}
                              className="text-[9px] font-mono text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                              title="Re-generate code from current settings"
                            >
                              <span>⚡ Generate Code</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCopyCommands}
                              className="text-[9px] font-mono text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10"
                              title="Copy cl_crosshair console commands to clipboard"
                            >
                              <span>{copiedCsCmdIndex === index ? '✓ Commands Copied!' : '📋 Copy Commands'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCopyCode}
                              className="text-[9px] font-mono text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10"
                              title="Copy share code"
                            >
                              <span>{copiedCsCodeIndex === index ? '✓ Code Copied!' : '📋 Copy Code'}</span>
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={c.crosshair_code || ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val.startsWith('CSGO-')) {
                              const decoded = decodeCSGOShareCode(val);
                              if (decoded) {
                                setCsCrosshairs(prev => prev.map((item, i) => i === index ? {
                                  ...item,
                                  ...decoded,
                                  crosshair_code: val,
                                  crosshair_color: decoded.color !== undefined ? CS2_COLOR_PRESETS[decoded.color]?.name : item.crosshair_color,
                                  crosshair_outline: decoded.outline ? '1' : '0',
                                  crosshair_dot: decoded.dot ? '1' : '0',
                                  crosshair_inner: decoded.style !== undefined ? CS2_STYLES[decoded.style] : item.crosshair_inner,
                                  crosshair_thickness: decoded.thickness !== undefined ? String(decoded.thickness) : item.crosshair_thickness
                                } : item));
                                return;
                              }
                            }
                            setCsCrosshairs(prev => prev.map((item, i) => i === index ? { ...item, crosshair_code: e.target.value } : item));
                          }}
                          placeholder="CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
                          className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-3 text-xs text-amber-300 focus:outline-none focus:border-amber-500/40 transition-all font-mono placeholder:text-zinc-600 select-all"
                        />
                      </div>

                      {/* Main Settings Form Controls */}
                      <div className="space-y-3 pt-2">
                        {/* Row 1: Style & Color */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Crosshair Style</label>
                            <select
                              value={parsed.style}
                              onChange={(e) => updateCsCrosshair({ style: parseInt(e.target.value, 10) })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
                            >
                              <option value={0}>0 (Default)</option>
                              <option value={1}>1 (Default Static)</option>
                              <option value={2}>2 (Classic)</option>
                              <option value={3}>3 (Classic Dynamic)</option>
                              <option value={4}>4 (Classic Static)</option>
                              <option value={5}>5 (Legacy Dynamic)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Color</label>
                            <select
                              value={parsed.color}
                              onChange={(e) => updateCsCrosshair({ color: parseInt(e.target.value, 10) })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
                            >
                              <option value={1}>Green</option>
                              <option value={2}>Yellow</option>
                              <option value={3}>Blue</option>
                              <option value={4}>Cyan</option>
                              <option value={0}>Red</option>
                              <option value={5}>Custom RGB</option>
                            </select>
                          </div>

                          {/* Custom RGB Inputs */}
                          {parsed.color === 5 && (
                            <>
                              <div className="space-y-1 col-span-2 grid grid-cols-3 gap-1.5">
                                <div>
                                  <label className="text-[8px] font-bold text-red-400 font-mono uppercase">R</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={parsed.color_r}
                                    onChange={(e) => updateCsCrosshair({ color_r: Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0)) })}
                                    className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-green-400 font-mono uppercase">G</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={parsed.color_g}
                                    onChange={(e) => updateCsCrosshair({ color_g: Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0)) })}
                                    className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-blue-400 font-mono uppercase">B</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={parsed.color_b}
                                    onChange={(e) => updateCsCrosshair({ color_b: Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0)) })}
                                    className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Alpha (Opacity)</label>
                            <input
                              type="number"
                              min={0}
                              max={255}
                              value={parsed.alpha}
                              onChange={(e) => updateCsCrosshair({ alpha: Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0)) })}
                              className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Sniper Width</label>
                            <input
                              type="number"
                              min={1}
                              max={5}
                              value={parsed.sniper_width ?? 1}
                              onChange={(e) => updateCsCrosshair({ sniper_width: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                              className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                            />
                          </div>
                        </div>

                        {/* Row 2: Dimensions (Size, Gap, Thickness) */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Size (Length)</label>
                            <input
                              type="number"
                              step="0.1"
                              min={0}
                              value={parsed.size}
                              onChange={(e) => updateCsCrosshair({ size: parseFloat(e.target.value) || 0 })}
                              className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Gap (Spacing)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={parsed.gap}
                              onChange={(e) => updateCsCrosshair({ gap: parseFloat(e.target.value) || 0 })}
                              className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Thickness</label>
                            <input
                              type="number"
                              step="0.1"
                              min={0.1}
                              value={parsed.thickness}
                              onChange={(e) => updateCsCrosshair({ thickness: parseFloat(e.target.value) || 0.1 })}
                              className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                            />
                          </div>
                        </div>

                        {/* Row 3: Toggles (Dot, Outline, T-Style, Follow Recoil) */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Center Dot</label>
                            <select
                              value={parsed.dot ? '1' : '0'}
                              onChange={(e) => updateCsCrosshair({ dot: e.target.value === '1' })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
                            >
                              <option value="0">Off</option>
                              <option value="1">On</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Outline</label>
                            <select
                              value={parsed.outline ? '1' : '0'}
                              onChange={(e) => updateCsCrosshair({ outline: e.target.value === '1' })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
                            >
                              <option value="0">Off</option>
                              <option value="1">On</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Outline Thickness</label>
                            <select
                              value={parsed.outline_thickness}
                              disabled={!parsed.outline}
                              onChange={(e) => updateCsCrosshair({ outline_thickness: parseFloat(e.target.value) || 1 })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">T-Style (No Top)</label>
                            <select
                              value={parsed.t_style ? '1' : '0'}
                              onChange={(e) => updateCsCrosshair({ t_style: e.target.value === '1' })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
                            >
                              <option value="0">Off</option>
                              <option value="1">On</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-400 font-mono uppercase">Follow Recoil</label>
                            <select
                              value={parsed.recoil ? '1' : '0'}
                              onChange={(e) => updateCsCrosshair({ recoil: e.target.value === '1' })}
                              className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
                            >
                              <option value="0">Off</option>
                              <option value="1">On (CS2)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Block 3: Select Player Gears */}
      <div className="bg-[#12121A]/70 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-850 pb-3 flex items-center gap-2">
          <span className="text-accent">3.</span> Select Player Gears & Hardware
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <GearSearchSelect
            label="Mouse"
            options={mice}
            selectedValue={selectedMouseId}
            onChange={setSelectedMouseId}
            placeholder="Select mouse..."
          />

          <GearSearchSelect
            label="Keyboard"
            options={keyboards}
            selectedValue={selectedKeyboardId}
            onChange={setSelectedKeyboardId}
            placeholder="Select keyboard..."
          />

          <GearSearchSelect
            label="Mousepad"
            options={mousepads}
            selectedValue={selectedMousepadId}
            onChange={setSelectedMousepadId}
            placeholder="Select mousepad..."
          />

          <GearSearchSelect
            label="Headset"
            options={headsets}
            selectedValue={selectedHeadsetId}
            onChange={setSelectedHeadsetId}
            placeholder="Select headset..."
          />

          <GearSearchSelect
            label="Monitor"
            options={monitors}
            selectedValue={selectedMonitorId}
            onChange={setSelectedMonitorId}
            placeholder="Select monitor..."
          />

          <GearSearchSelect
            label="GPU"
            options={gpus}
            selectedValue={selectedGpuId}
            onChange={setSelectedGpuId}
            placeholder="Select GPU..."
          />

          <div className="sm:col-span-2">
            <GearSearchSelect
              label="CPU"
              options={cpus}
              selectedValue={selectedCpuId}
              onChange={setSelectedCpuId}
              placeholder="Select CPU..."
            />
          </div>
        </div>
      </div>

      {/* Form Submission Action buttons */}
      <div className="flex items-center gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.push('/admin/players')}
          className="px-6 h-11 border border-zinc-800 hover:border-zinc-700 bg-black/20 hover:bg-zinc-800/50 rounded-xl text-xs font-bold font-sans uppercase tracking-wider text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="px-8 h-11 bg-accent text-accent-fg hover:bg-accent/90 disabled:opacity-50 text-xs font-bold rounded-xl tracking-wider font-sans uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] cursor-pointer"
        >
          {submitting ? 'Saving changes...' : 'Save Player Profile'}
        </button>
      </div>

    </form>
  );
}
