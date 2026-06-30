'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import GearCard from '@/components/GearCard';
import StatCard from '@/components/StatCard';

type Player = {
  id: number;
  username: string;
  real_name: string | null;
  team: string | null;
  country_code: string | null;
  profile_img_url: string | null;
  nationality: string | null;
};

type GearProduct = {
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

function GearSearchSelect({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = "Search and select..."
}: {
  label: string;
  options: GearProduct[];
  selectedValue: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find current selected product
  const selectedProduct = options.find(p => p.id.toString() === selectedValue);

  // Synchronize searchQuery with selectedProduct name when not actively typing
  useEffect(() => {
    if (!isUserTyping) {
      if (selectedProduct) {
        setSearchQuery(selectedProduct.name);
      } else {
        setSearchQuery('');
      }
    }
  }, [selectedProduct, isUserTyping]);

  // Filter options based on search query — only when user is actively typing
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
            // Select all text so user can immediately start typing to search
            if (inputRef.current) {
              inputRef.current.select();
            }
            // Don't open dropdown until user types
          }}
          onBlur={() => {
            // Delay closing slightly so onMouseDown can register
            setTimeout(() => {
              setIsOpen(false);
              setIsUserTyping(false);
              // Restore selected product name if exists
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

        {/* Toggle / Indicator Icon */}
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

        {/* Dropdown Options List */}
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

function CountrySearchSelect({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = "Select Country..."
}: {
  label: string;
  options: { code: string; name: string }[];
  selectedValue: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry = options.find(c => c.code === selectedValue);

  useEffect(() => {
    if (selectedCountry) {
      setSearchQuery(`${selectedCountry.name} (${selectedCountry.code})`);
    } else {
      setSearchQuery('');
    }
  }, [selectedCountry]);

  const filteredOptions = searchQuery.trim().length > 0
    ? options.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const displayOptions = filteredOptions;

  return (
    <div className="relative space-y-1.5 w-full">
      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
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

        {isOpen && searchQuery.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-[#0F0F15] border border-zinc-800 rounded-xl shadow-2xl divide-y divide-zinc-900 scrollbar-thin scrollbar-thumb-zinc-800">
            {displayOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 italic font-mono">
                No matching countries found
              </div>
            ) : (
              displayOptions.map((country) => {
                const isSelected = country.code === selectedValue;
                return (
                  <div
                    key={country.code}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(country.code);
                      setSearchQuery(`${country.name} (${country.code})`);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors ${isSelected
                        ? 'bg-accent/15 text-accent font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                      }`}
                  >
                    {country.name} ({country.code})
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

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // View states
  const [isProfileCreated, setIsProfileCreated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form profile states
  const [username, setUsername] = useState('');
  const [team, setTeam] = useState('Community Member');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [countriesList, setCountriesList] = useState<{ code: string; name: string }[]>([]);

  // Games and settings states
  const [gamesPlayed, setGamesPlayed] = useState<{ valorant: boolean; cs2: boolean }>({
    valorant: false,
    cs2: false
  });

  // VALORANT settings
  const [valDpi, setValDpi] = useState('800');
  const [valSens, setValSens] = useState('0.35');
  const [valHz, setValHz] = useState('1000');
  const [valScopedSens, setValScopedSens] = useState('1.0');
  const [valRes, setValRes] = useState('1920x1080');
  const [valAspect, setValAspect] = useState('16:9');
  const [valRefresh, setValRefresh] = useState('240');
  const [valEnemyHighlight, setValEnemyHighlight] = useState('Red (Default)');

  // CS2 settings
  const [csDpi, setCsDpi] = useState('800');
  const [csSens, setCsSens] = useState('1.0');
  const [csHz, setCsHz] = useState('1000');
  const [csZoomSens, setCsZoomSens] = useState('1.0');
  const [csRes, setCsRes] = useState('1280x960');
  const [csAspect, setCsAspect] = useState('4:3');
  const [csRefresh, setCsRefresh] = useState('240');

  // Gear dropdown states
  const [gearOptions, setGearOptions] = useState<{
    mice: GearProduct[];
    keyboards: GearProduct[];
    mousepads: GearProduct[];
    headsets: GearProduct[];
  }>({
    mice: [],
    keyboards: [],
    mousepads: [],
    headsets: []
  });

  const [selectedMouseId, setSelectedMouseId] = useState('');
  const [selectedKeyboardId, setSelectedKeyboardId] = useState('');
  const [selectedMousepadId, setSelectedMousepadId] = useState('');
  const [selectedHeadsetId, setSelectedHeadsetId] = useState('');

  // Selected gear details for display
  const [selectedGears, setSelectedGears] = useState<GearProduct[]>([]);

  // Social Links
  const [discord, setDiscord] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitch, setTwitch] = useState('');
  const [youtube, setYoutube] = useState('');

  // Favorite pro players list
  const [favorites, setFavorites] = useState<Player[]>([]);
  const [removingFavoriteIds, setRemovingFavoriteIds] = useState<number[]>([]);

  const router = useRouter();

  useEffect(() => {
    const initPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/login?redirect=/profile');
          return;
        }

        const user = session.user;
        setUserId(user.id);
        setEmail(user.email ?? null);

        // Fetch lists
        const countriesRes = await fetch('/api/countries');
        if (countriesRes.ok) {
          const data = await countriesRes.json();
          setCountriesList(data.countries || []);
        }

        // Fetch gears categorised
        const categories = ['mouse', 'keyboard', 'mousepad', 'headset'];
        const gearResults: any = {};
        for (const cat of categories) {
          const res = await fetch(`/api/gears?category=${cat}&limit=1000`);
          if (res.ok) {
            const data = await res.json();
            gearResults[cat] = data.products || [];
          }
        }
        setGearOptions({
          mice: gearResults['mouse'] || [],
          keyboards: gearResults['keyboard'] || [],
          mousepads: gearResults['mousepad'] || [],
          headsets: gearResults['headset'] || []
        });

        // Load profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setIsProfileCreated(profile.is_profile_created);
          setUsername(profile.username || '');
          setTeam(profile.team || 'Community Member');
          setSelectedCountryCode(profile.country_code || '');

          // Load social links
          const socials = profile.social_links || {};
          setDiscord(socials.discord || '');
          setFacebook(socials.facebook || '');
          setInstagram(socials.instagram || '');
          setTwitch(socials.twitch || '');
          setYoutube(socials.youtube || '');

          // Load games played
          const settings = profile.game_settings || {};
          setGamesPlayed({
            valorant: !!settings.valorant,
            cs2: !!settings.cs2
          });

          // Load valorant values if exist
          if (settings.valorant) {
            setValDpi(settings.valorant.mouse_dpi?.toString() || '800');
            setValSens(settings.valorant.in_game_sens?.toString() || '0.35');
            setValHz(settings.valorant.mouse_hz?.toString() || '1000');
            setValScopedSens(settings.valorant.scoped_sens?.toString() || '1.0');
            setValRes(settings.valorant.resolution || '1920x1080');
            setValAspect(settings.valorant.aspect_ratio || '16:9');
            setValRefresh(settings.valorant.refresh_rate?.toString() || '240');
            setValEnemyHighlight(settings.valorant.settings_data?.enemy_highlight_color || 'Red (Default)');
          }

          // Load cs2 values if exist
          if (settings.cs2) {
            setCsDpi(settings.cs2.mouse_dpi?.toString() || '800');
            setCsSens(settings.cs2.in_game_sens?.toString() || '1.0');
            setCsHz(settings.cs2.mouse_hz?.toString() || '1000');
            setCsZoomSens(settings.cs2.zoom_sens?.toString() || '1.0');
            setCsRes(settings.cs2.resolution || '1280x960');
            setCsAspect(settings.cs2.aspect_ratio || '4:3');
            setCsRefresh(settings.cs2.refresh_rate?.toString() || '240');
          }

          // Set active gear dropdowns
          const ids = profile.gear_ids || [];
          // Pre-populate gear selections
          if (gearResults['mouse'] && ids.length) {
            const m = gearResults['mouse'].find((p: any) => ids.includes(p.id));
            if (m) setSelectedMouseId(m.id.toString());
          }
          if (gearResults['keyboard'] && ids.length) {
            const k = gearResults['keyboard'].find((p: any) => ids.includes(p.id));
            if (k) setSelectedKeyboardId(k.id.toString());
          }
          if (gearResults['mousepad'] && ids.length) {
            const pad = gearResults['mousepad'].find((p: any) => ids.includes(p.id));
            if (pad) setSelectedMousepadId(pad.id.toString());
          }
          if (gearResults['headset'] && ids.length) {
            const h = gearResults['headset'].find((p: any) => ids.includes(p.id));
            if (h) setSelectedHeadsetId(h.id.toString());
          }

          // Load active gear details for display
          if (ids.length > 0) {
            const { data: gearsData } = await supabase
              .from('products')
              .select('*')
              .in('id', ids);
            if (gearsData) {
              setSelectedGears(gearsData);
            }
          }

          // If profile is not created yet, default to editing mode
          if (!profile.is_profile_created) {
            setIsEditing(true);
          }
        } else {
          // Default to editing
          setIsEditing(true);
        }

        // Fetch favorites
        const { data: favs } = await supabase
          .from('user_favorites')
          .select(`
            player_id,
            players (
              id,
              username,
              real_name,
              team,
              country_code,
              profile_img_url,
              nationality
            )
          `)
          .eq('user_id', user.id);

        if (favs) {
          setFavorites(
            favs.map((f: any) => f.players).filter((p): p is Player => p !== null)
          );
        }

      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setErrorMsg(null);

    // Build game settings
    const gameSettings: any = {};
    if (gamesPlayed.valorant) {
      gameSettings.valorant = {
        mouse_dpi: parseFloat(valDpi) || 800,
        in_game_sens: parseFloat(valSens) || 0.35,
        mouse_hz: parseInt(valHz, 10) || 1000,
        scoped_sens: parseFloat(valScopedSens) || 1.0,
        resolution: valRes || '1920x1080',
        aspect_ratio: valAspect || '16:9',
        refresh_rate: parseInt(valRefresh, 10) || 240,
        settings_data: {
          enemy_highlight_color: valEnemyHighlight
        }
      };
    }
    if (gamesPlayed.cs2) {
      gameSettings.cs2 = {
        mouse_dpi: parseFloat(csDpi) || 800,
        in_game_sens: parseFloat(csSens) || 1.0,
        mouse_hz: parseInt(csHz, 10) || 1000,
        zoom_sens: parseFloat(csZoomSens) || 1.0,
        resolution: csRes || '1280x960',
        aspect_ratio: csAspect || '4:3',
        refresh_rate: parseInt(csRefresh, 10) || 240
      };
    }

    // Build gear list
    const gearIds = [
      selectedMouseId,
      selectedKeyboardId,
      selectedMousepadId,
      selectedHeadsetId
    ]
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && id > 0);

    // Get nationality name matching selected code
    const countryObj = countriesList.find(c => c.code === selectedCountryCode);
    const nationality = countryObj ? countryObj.name : '';

    const socialLinks = {
      discord: discord.trim(),
      facebook: facebook.trim(),
      instagram: instagram.trim(),
      twitch: twitch.trim(),
      youtube: youtube.trim()
    };

    const cleanUsername = username.trim() || email?.split('@')[0] || 'User';
    const cleanTeam = team.trim() || 'Community Member';

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: cleanUsername,
          team: cleanTeam,
          nationality,
          country_code: selectedCountryCode,
          is_profile_created: true,
          game_settings: gameSettings,
          gear_ids: gearIds,
          social_links: socialLinks,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        setErrorMsg(error.message);
      } else {
        setUsername(cleanUsername);
        setTeam(cleanTeam);
        setIsProfileCreated(true);
        setIsEditing(false);

        // Refresh selected gears list
        if (gearIds.length > 0) {
          const { data: gearsData } = await supabase
            .from('products')
            .select('*')
            .in('id', gearIds);
          if (gearsData) {
            setSelectedGears(gearsData);
          }
        } else {
          setSelectedGears([]);
        }

        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFavorite = async (playerId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) return;

    // Start transition
    setRemovingFavoriteIds(prev => [...prev, playerId]);

    // Wait 600ms for animation to finish before database deletion and updating list state
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('player_id', playerId);

        if (!error) {
          setFavorites(prev => prev.filter(p => p.id !== playerId));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setRemovingFavoriteIds(prev => prev.filter(id => id !== playerId));
      }
    }, 600);
  };

  const getGameBadgeClass = (slug: string) => {
    if (slug === 'valorant') {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    return 'bg-amber-500/10 text-amber-400 border border-accent/20';
  };

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 py-20 flex flex-col justify-center items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        <span className="text-zinc-500 text-xs font-mono">Loading Profile Dashboard...</span>
      </div>
    );
  }

  const playerMouse = selectedGears.find(g => g.category.toLowerCase() === 'mouse');
  const playerKeyboard = selectedGears.find(g => g.category.toLowerCase() === 'keyboard');
  
  // ในหน้า Profile Dashboard ปัจจุบันยังไม่มีช่องกรอกเซ็ตติ้งคีย์บอร์ดโดยเฉพาะ ดังนั้นจะตั้งเป็น false เพื่อให้แสดงผลคีย์บอร์ดที่ My Gear ด้านล่าง
  const hasAnyKeyboardSettings = false;

  const remainingGears = selectedGears.filter(g => {
    if (g.product_type !== 'gear') return false;
    if (g.category.toLowerCase() === 'mouse') return false;
    if (g.category.toLowerCase() === 'keyboard') {
      return !hasAnyKeyboardSettings;
    }
    return true;
  });

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 py-16 flex flex-col space-y-10 animate-in fade-in duration-300">

      {/* Back Link */}
      {isEditing && isProfileCreated && (
        <div>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-mono cursor-pointer"
          >
            ← BACK TO PROFILE
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="border-b border-zinc-800/60 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
            My <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">Profile Dashboard</span>
          </h1>
        </div>
        {!isEditing && isProfileCreated && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-accent hover:text-accent font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            EDIT PROFILE CARD
          </button>
        )}
      </div>

      {isEditing ? (
        /* ==================== PROFILE EDITOR FORM ==================== */
        <form onSubmit={handleSaveProfile} className="space-y-8 max-w-3xl">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono p-4 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Block 1: Basic Information */}
          <div className="bg-card border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-800 pb-3">
              1. Basic Profile Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Username</label>
                <input
                  type="text"
                  value={username}
                  disabled
                  title="Your username is locked and cannot be changed."
                  className="w-full h-11 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 text-xs text-zinc-500 cursor-not-allowed font-mono select-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Team / Organisation</label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  placeholder="e.g. Your team (optional)"
                  className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all"
                />
              </div>

              <CountrySearchSelect
                label="Nationality / Country"
                options={countriesList}
                selectedValue={selectedCountryCode}
                onChange={setSelectedCountryCode}
                placeholder="Type to search country..."
              />
            </div>
          </div>

          {/* Block 2: Game Settings */}
          <div className="bg-card border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-800 pb-3">
              2. Game Specific Settings
            </h2>

            <div className="space-y-6">
              {/* Checkboxes for games */}
              <div className="flex gap-6 items-center">
                <label className="flex items-center gap-2.5 text-xs text-white font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gamesPlayed.valorant}
                    onChange={(e) => setGamesPlayed(prev => ({ ...prev, valorant: e.target.checked }))}
                    className="h-4 w-4 rounded border-zinc-800 text-accent focus:ring-accent accent-accent"
                  />
                  Plays VALORANT
                </label>
                <label className="flex items-center gap-2.5 text-xs text-white font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gamesPlayed.cs2}
                    onChange={(e) => setGamesPlayed(prev => ({ ...prev, cs2: e.target.checked }))}
                    className="h-4 w-4 rounded border-zinc-800 text-accent focus:ring-accent accent-accent"
                  />
                  Plays CS2
                </label>
              </div>

              {/* VALORANT Inputs */}
              {gamesPlayed.valorant && (
                <div className="border border-red-500/20 bg-red-500/[0.01] p-6 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-red-400 font-mono flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    VALORANT Settings
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">DPI</label>
                      <input type="number" value={valDpi} onChange={e => setValDpi(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Sensitivity</label>
                      <input type="number" step="0.001" value={valSens} onChange={e => setValSens(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Scoped Sens</label>
                      <input type="number" step="0.1" value={valScopedSens} onChange={e => setValScopedSens(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Hz</label>
                      <input type="number" value={valHz} onChange={e => setValHz(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Resolution</label>
                      <input type="text" value={valRes} onChange={e => setValRes(e.target.value)} placeholder="e.g. 1920x1080" className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Aspect Ratio</label>
                      <input type="text" value={valAspect} onChange={e => setValAspect(e.target.value)} placeholder="e.g. 16:9" className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Refresh Rate (Hz)</label>
                      <input type="number" value={valRefresh} onChange={e => setValRefresh(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Enemy Highlight Color</label>
                      <select value={valEnemyHighlight} onChange={e => setValEnemyHighlight(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-accent/50">
                        <option value="Red (Default)">Red (Default)</option>
                        <option value="Purple">Purple</option>
                        <option value="Yellow (Deuteranopia)">Yellow (Deuteranopia)</option>
                        <option value="Yellow (Protanopia)">Yellow (Protanopia)</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Calculated VALORANT eDPI: <span className="text-red-400 font-bold">{((parseFloat(valDpi) || 0) * (parseFloat(valSens) || 0)).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* CS2 Inputs */}
              {gamesPlayed.cs2 && (
                <div className="border border-amber-500/20 bg-amber-500/[0.01] p-6 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-amber-400 font-mono flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    CS2 Settings
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">DPI</label>
                      <input type="number" value={csDpi} onChange={e => setCsDpi(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Sensitivity</label>
                      <input type="number" step="0.001" value={csSens} onChange={e => setCsSens(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Zoom Sens</label>
                      <input type="number" step="0.1" value={csZoomSens} onChange={e => setCsZoomSens(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Hz</label>
                      <input type="number" value={csHz} onChange={e => setCsHz(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Resolution</label>
                      <input type="text" value={csRes} onChange={e => setCsRes(e.target.value)} placeholder="e.g. 1280x960" className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Aspect Ratio</label>
                      <input type="text" value={csAspect} onChange={e => setCsAspect(e.target.value)} placeholder="e.g. 4:3" className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Refresh Rate (Hz)</label>
                      <input type="number" value={csRefresh} onChange={e => setCsRefresh(e.target.value)} className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Calculated CS2 eDPI: <span className="text-amber-400 font-bold">{((parseFloat(csDpi) || 0) * (parseFloat(csSens) || 0)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Block 3: Gear Selection */}
          <div className="bg-card border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-800 pb-3">
              3. Select My Gear
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GearSearchSelect
                label="Mouse"
                options={gearOptions.mice}
                selectedValue={selectedMouseId}
                onChange={setSelectedMouseId}
                placeholder="Type to search mouse..."
              />

              <GearSearchSelect
                label="Keyboard"
                options={gearOptions.keyboards}
                selectedValue={selectedKeyboardId}
                onChange={setSelectedKeyboardId}
                placeholder="Type to search keyboard..."
              />

              <GearSearchSelect
                label="Mousepad"
                options={gearOptions.mousepads}
                selectedValue={selectedMousepadId}
                onChange={setSelectedMousepadId}
                placeholder="Type to search mousepad..."
              />

              <GearSearchSelect
                label="Headset"
                options={gearOptions.headsets}
                selectedValue={selectedHeadsetId}
                onChange={setSelectedHeadsetId}
                placeholder="Type to search headset..."
              />
            </div>
          </div>

          {/* Block 4: Social Media Links */}
          <div className="bg-card border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-800 pb-3">
              4. Social Media Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Discord Username</label>
                <input type="text" value={discord} onChange={e => setDiscord(e.target.value)} placeholder="e.g. your_discord_username (optional)" className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Facebook Page/Profile URL</label>
                <input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Instagram Profile URL</label>
                <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Twitch Stream URL</label>
                <input type="text" value={twitch} onChange={e => setTwitch(e.target.value)} placeholder="https://twitch.tv/..." className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
              </div>
              <div className="space-y-1.5 flex-1 md:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">YouTube Channel URL</label>
                <input type="text" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/..." className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-11 bg-accent text-accent-fg hover:bg-accent/90 disabled:opacity-50 text-xs font-bold rounded-xl tracking-wider font-mono transition-all uppercase shadow-[0_0_20px_rgba(245,158,11,0.15)] active:scale-98 cursor-pointer flex-1 md:flex-none md:min-w-[150px]"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {isProfileCreated && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 h-11 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl tracking-wider font-mono transition-all uppercase cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : !isProfileCreated ? (
        /* ==================== UNCREATED PROFILE CALL-TO-ACTION ==================== */
        <div className="bg-[#12121A]/40 border border-dashed border-zinc-800 p-12 rounded-3xl flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto py-16 animate-in fade-in duration-300">
          <div className="h-16 w-16 rounded-full bg-accent/5 border border-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(245,158,11,0.08)]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white font-display">Create Your Custom Gamer Card</h2>
            <p className="text-zinc-400 text-xs font-mono max-w-sm">
              Showcase your setup, sensitivity values, configurations, and social media channels inside a custom card that looks exactly like a pro player profile!
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-accent text-accent-fg hover:bg-accent/90 shadow-[0_0_25px_rgba(245,158,11,0.2)] text-xs font-bold rounded-xl tracking-wider font-mono uppercase transition-all active:scale-98 cursor-pointer"
          >
            CREATE MY PROFILE
          </button>
        </div>
      ) : (
        /* ==================== CREATED PROFILE VIEW MODE ==================== */
        <div className="space-y-12">
          {/* Dashboard Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Column 1: Custom Gamer Card */}
            <div className="lg:col-span-1 flex flex-col items-center space-y-6">
              {/* Pro Player Styled Card */}
              <div className="bg-card border border-zinc-800 rounded-2xl flex flex-col justify-between overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.04)] w-full max-w-[280px] h-[350px] relative">

                {/* 1. Card Image / Placeholder */}
                <div className="relative h-44 bg-[#0F0F15] flex items-center justify-center border-b border-zinc-800/80 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-accent/5 blur-2xl"></div>

                  <span className="text-5xl font-black text-accent/35 font-display select-none">
                    {username ? username[0].toUpperCase() : '?'}
                  </span>

                  {/* Corner Game Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
                    {gamesPlayed.valorant && (
                      <span className="text-[7px] font-bold uppercase tracking-wider py-0.5 px-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-center">
                        VAL
                      </span>
                    )}
                    {gamesPlayed.cs2 && (
                      <span className="text-[7px] font-bold uppercase tracking-wider py-0.5 px-1.5 rounded bg-amber-500/10 text-amber-400 border border-accent/20 font-mono text-center">
                        CS2
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Card Info Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-[#FAFAFA] text-lg font-display line-clamp-1">
                        {username}
                      </h3>
                      {selectedCountryCode && (
                        <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-wider">
                          {selectedCountryCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="block text-center text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono w-full">
                      {team || 'Community Member'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Social Media Link Buttons */}
              <div className="w-full max-w-[280px] bg-card border border-zinc-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Social Networks</h4>
                <div className="flex flex-col gap-2">
                  {discord && (
                    <div className="flex items-center gap-3 p-2 bg-black/35 rounded-xl text-xs font-mono border border-zinc-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5865F2]"></span>
                      <span className="text-zinc-500 text-[10px]">Discord</span>
                      <span className="text-white font-bold">{discord}</span>
                    </div>
                  )}
                  {facebook && (
                    <a href={facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 bg-black/35 hover:bg-zinc-900/60 rounded-xl text-xs font-mono border border-zinc-900 text-left text-zinc-400 hover:text-white transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2]"></span>
                      <span className="text-zinc-500 text-[10px]">Facebook</span>
                    </a>
                  )}
                  {instagram && (
                    <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 bg-black/35 hover:bg-zinc-900/60 rounded-xl text-xs font-mono border border-zinc-900 text-left text-zinc-400 hover:text-white transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E1306C]"></span>
                      <span className="text-zinc-500 text-[10px]">Instagram</span>
                    </a>
                  )}
                  {twitch && (
                    <a href={twitch} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 bg-black/35 hover:bg-zinc-900/60 rounded-xl text-xs font-mono border border-zinc-900 text-left text-zinc-400 hover:text-white transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9146FF]"></span>
                      <span className="text-zinc-500 text-[10px]">Twitch</span>
                    </a>
                  )}
                  {youtube && (
                    <a href={youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 bg-black/35 hover:bg-zinc-900/60 rounded-xl text-xs font-mono border border-zinc-900 text-left text-zinc-400 hover:text-white transition-colors">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF0000]"></span>
                      <span className="text-zinc-500 text-[10px]">YouTube</span>
                    </a>
                  )}
                  {!discord && !facebook && !instagram && !twitch && !youtube && (
                    <span className="text-[10px] text-zinc-600 font-mono italic">No social links added</span>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2 & 3: Configuration & Settings Details */}
            <div className="lg:col-span-2 space-y-8">

              {/* Game Settings Display Block */}
              {gamesPlayed.valorant && (
                <div className="bg-card border border-border-custom p-6 sm:p-8 rounded-2xl space-y-6">
                  <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-border-custom pb-3 font-display">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    VALORANT Game Settings
                  </h2>
                  <div className="flex flex-col gap-6">
                    {/* Mouse Settings Block */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider border-l-2 border-accent pl-2.5">
                        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742c.089-.22.22-.43.39-.61l2.828-2.829a2.5 2.5 0 013.536 3.536l-2.828 2.828a2.5 2.5 0 01-3.536 0l-.39-.39m-.828-2.828l.39-.39a2.5 2.5 0 013.536 0l2.828 2.829a2.5 2.5 0 01-3.536 3.536l-2.828-2.828a2.5 2.5 0 010-3.536Z" />
                        </svg>
                        <span>Mouse Configuration</span>
                      </div>

                      {playerMouse && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/60 border border-border-custom p-4 rounded-xl hover:border-border-hover/80 hover:bg-[#12121A]/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                          <div className="flex items-center gap-3">
                            {playerMouse.image_url ? (
                              <div className="relative w-12 h-12 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0">
                                <img
                                  src={playerMouse.image_url}
                                  alt={playerMouse.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                <span className="text-lg">🖱️</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono">
                                  {playerMouse.name.split(' ')[0]}
                                </span>
                                <span className="text-sm font-bold text-white font-display leading-tight">
                                  {playerMouse.name}
                                </span>
                              </div>
                              {playerMouse.estimated_price_thb && (
                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  Est. Price: ฿{Number(playerMouse.estimated_price_thb).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {playerMouse.shopee_url && (
                              <a href={playerMouse.shopee_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-[#ee4d2d]/10 hover:bg-[#ee4d2d]/25 text-[#ee4d2d] border border-[#ee4d2d]/20 hover:border-[#ee4d2d]/50 transition-all duration-200 font-mono">
                                Shopee
                              </a>
                            )}
                            {playerMouse.lazada_url && (
                              <a href={playerMouse.lazada_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-accent/10 hover:bg-accent/25 text-accent border border-accent/20 hover:border-accent/50 transition-all duration-200 font-mono">
                                Lazada
                              </a>
                            )}
                            {playerMouse.amazon_url && (
                              <a href={playerMouse.amazon_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/12 text-white border border-white/10 hover:border-white/30 transition-all duration-200 font-mono">
                                Amazon
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                        {/* DPI Highlight Card */}
                        <div className="bg-accent/[0.04] border border-accent/20 hover:border-accent/40 hover:bg-accent/[0.08] p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.02)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent/80 font-mono block">DPI</span>
                          <span className="text-base font-extrabold text-accent font-display mt-0.5 hover:scale-105 transition-transform origin-left duration-200">
                            {valDpi || <span className="text-zinc-700 font-mono">—</span>}
                          </span>
                        </div>

                        {/* Sensitivity Highlight Card */}
                        <div className="bg-accent/[0.04] border border-accent/20 hover:border-accent/40 hover:bg-accent/[0.08] p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.02)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent/80 font-mono block">Sensitivity</span>
                          <span className="text-base font-extrabold text-accent font-display mt-0.5 hover:scale-105 transition-transform origin-left duration-200">
                            {valSens !== null && valSens !== '' ? parseFloat(valSens).toFixed(3) : <span className="text-zinc-700 font-mono">—</span>}
                          </span>
                        </div>

                        {/* eDPI Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">eDPI</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">
                            {((parseFloat(valDpi) || 0) * (parseFloat(valSens) || 0)).toFixed(2)}
                          </span>
                        </div>

                        {/* Hz Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Hz</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">{valHz ? `${valHz} Hz` : <span className="text-zinc-700 font-mono">—</span>}</span>
                        </div>

                        {/* Scoped Sensitivity Card */}
                        {valScopedSens && (
                          <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Scoped Sens</span>
                            <span className="text-base font-bold text-white font-display mt-0.5">{valScopedSens}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video Settings Block */}
                    <div className="space-y-4 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider border-l-2 border-accent pl-2.5">
                        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Video Configuration</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        {/* Resolution Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Resolution</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">{valRes || <span className="text-zinc-700 font-mono">—</span>}</span>
                        </div>

                        {/* Aspect Ratio Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Aspect Ratio</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">{valAspect || <span className="text-zinc-700 font-mono">—</span>}</span>
                        </div>

                        {/* Refresh Rate Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Refresh Rate</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">
                            {valRefresh ? `${valRefresh} Hz` : <span className="text-zinc-700 font-mono">—</span>}
                          </span>
                        </div>

                        {/* Enemy Highlight Color Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Enemy Highlight Color</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">
                            {valEnemyHighlight || <span className="text-zinc-700 font-mono">—</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Keyboard Configuration */}
                    {playerKeyboard && hasAnyKeyboardSettings && (
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider border-l-2 border-accent pl-2.5">
                          <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                          </svg>
                          <span>Keyboard Configuration</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/60 border border-border-custom p-4 rounded-xl hover:border-border-hover/80 hover:bg-[#12121A]/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                          <div className="flex items-center gap-3">
                            {playerKeyboard.image_url ? (
                              <div className="relative w-12 h-12 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0">
                                <img
                                  src={playerKeyboard.image_url}
                                  alt={playerKeyboard.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                <span className="text-lg">⌨️</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono">
                                  {playerKeyboard.name.split(' ')[0]}
                                </span>
                                <span className="text-sm font-bold text-white font-display leading-tight">
                                  {playerKeyboard.name}
                                </span>
                              </div>
                              {playerKeyboard.estimated_price_thb && (
                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  Est. Price: ฿{Number(playerKeyboard.estimated_price_thb).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {playerKeyboard.shopee_url && (
                              <a href={playerKeyboard.shopee_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-[#ee4d2d]/10 hover:bg-[#ee4d2d]/25 text-[#ee4d2d] border border-[#ee4d2d]/20 hover:border-[#ee4d2d]/50 transition-all duration-200 font-mono">
                                Shopee
                              </a>
                            )}
                            {playerKeyboard.lazada_url && (
                              <a href={playerKeyboard.lazada_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-accent/10 hover:bg-accent/25 text-accent border border-accent/20 hover:border-accent/50 transition-all duration-200 font-mono">
                                Lazada
                              </a>
                            )}
                            {playerKeyboard.amazon_url && (
                              <a href={playerKeyboard.amazon_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/12 text-white border border-white/10 hover:border-white/30 transition-all duration-200 font-mono">
                                Amazon
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {gamesPlayed.cs2 && (
                <div className="bg-card border border-border-custom p-6 sm:p-8 rounded-2xl space-y-6">
                  <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-border-custom pb-3 font-display">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    CS2 Game Settings
                  </h2>
                  <div className="flex flex-col gap-6">
                    {/* Mouse Settings Block */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider border-l-2 border-accent pl-2.5">
                        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742c.089-.22.22-.43.39-.61l2.828-2.829a2.5 2.5 0 013.536 3.536l-2.828 2.828a2.5 2.5 0 01-3.536 0l-.39-.39m-.828-2.828l.39-.39a2.5 2.5 0 013.536 0l2.828 2.829a2.5 2.5 0 01-3.536 3.536l-2.828-2.828a2.5 2.5 0 010-3.536Z" />
                        </svg>
                        <span>Mouse Configuration</span>
                      </div>

                      {playerMouse && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/60 border border-border-custom p-4 rounded-xl hover:border-border-hover/80 hover:bg-[#12121A]/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                          <div className="flex items-center gap-3">
                            {playerMouse.image_url ? (
                              <div className="relative w-12 h-12 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0">
                                <img
                                  src={playerMouse.image_url}
                                  alt={playerMouse.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                <span className="text-lg">🖱️</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono">
                                  {playerMouse.name.split(' ')[0]}
                                </span>
                                <span className="text-sm font-bold text-white font-display leading-tight">
                                  {playerMouse.name}
                                </span>
                              </div>
                              {playerMouse.estimated_price_thb && (
                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  Est. Price: ฿{Number(playerMouse.estimated_price_thb).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {playerMouse.shopee_url && (
                              <a href={playerMouse.shopee_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-[#ee4d2d]/10 hover:bg-[#ee4d2d]/25 text-[#ee4d2d] border border-[#ee4d2d]/20 hover:border-[#ee4d2d]/50 transition-all duration-200 font-mono">
                                Shopee
                              </a>
                            )}
                            {playerMouse.lazada_url && (
                              <a href={playerMouse.lazada_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-accent/10 hover:bg-accent/25 text-accent border border-accent/20 hover:border-accent/50 transition-all duration-200 font-mono">
                                Lazada
                              </a>
                            )}
                            {playerMouse.amazon_url && (
                              <a href={playerMouse.amazon_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/12 text-white border border-white/10 hover:border-white/30 transition-all duration-200 font-mono">
                                Amazon
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                        {/* DPI Highlight Card */}
                        <div className="bg-accent/[0.04] border border-accent/20 hover:border-accent/40 hover:bg-accent/[0.08] p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.02)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent/80 font-mono block">DPI</span>
                          <span className="text-base font-extrabold text-accent font-display mt-0.5 hover:scale-105 transition-transform origin-left duration-200">
                            {csDpi || <span className="text-zinc-700 font-mono">—</span>}
                          </span>
                        </div>

                        {/* Sensitivity Highlight Card */}
                        <div className="bg-accent/[0.04] border border-accent/20 hover:border-accent/40 hover:bg-accent/[0.08] p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.02)]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent/80 font-mono block">Sensitivity</span>
                          <span className="text-base font-extrabold text-accent font-display mt-0.5 hover:scale-105 transition-transform origin-left duration-200">
                            {csSens !== null && csSens !== '' ? parseFloat(csSens).toFixed(3) : <span className="text-zinc-700 font-mono">—</span>}
                          </span>
                        </div>

                        {/* eDPI Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">eDPI</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">
                            {((parseFloat(csDpi) || 0) * (parseFloat(csSens) || 0)).toFixed(2)}
                          </span>
                        </div>

                        {/* Hz Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Hz</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">{csHz || <span className="text-zinc-700 font-mono">—</span>}</span>
                        </div>

                        {/* Zoom Sensitivity Card */}
                        {csZoomSens && (
                          <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Zoom Sens</span>
                            <span className="text-base font-bold text-white font-display mt-0.5">{csZoomSens}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video Settings Block */}
                    <div className="space-y-4 border-t border-white/5 pt-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider border-l-2 border-accent pl-2.5">
                        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Video Configuration</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        {/* Resolution Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Resolution</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">{csRes || <span className="text-zinc-700 font-mono">—</span>}</span>
                        </div>

                        {/* Aspect Ratio Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Aspect Ratio</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">{csAspect || <span className="text-zinc-700 font-mono">—</span>}</span>
                        </div>

                        {/* Refresh Rate Card */}
                        <div className="bg-[#12121A]/30 border border-border-custom hover:border-border-hover/80 hover:bg-[#12121A]/50 p-3.5 rounded-xl transition-all duration-300 group/card min-h-[76px] flex flex-col justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block group-hover/card:text-zinc-400 transition-colors">Refresh Rate</span>
                          <span className="text-base font-bold text-white font-display mt-0.5">
                            {csRefresh ? `${csRefresh} Hz` : <span className="text-zinc-700 font-mono">—</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Keyboard Configuration */}
                    {playerKeyboard && hasAnyKeyboardSettings && (
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider border-l-2 border-accent pl-2.5">
                          <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                          </svg>
                          <span>Keyboard Configuration</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/60 border border-border-custom p-4 rounded-xl hover:border-border-hover/80 hover:bg-[#12121A]/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                          <div className="flex items-center gap-3">
                            {playerKeyboard.image_url ? (
                              <div className="relative w-12 h-12 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0">
                                <img
                                  src={playerKeyboard.image_url}
                                  alt={playerKeyboard.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                                <span className="text-lg">⌨️</span>
                              </div>
                            )}
                            <div className="flex flex-col">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-mono">
                                  {playerKeyboard.name.split(' ')[0]}
                                </span>
                                <span className="text-sm font-bold text-white font-display leading-tight">
                                  {playerKeyboard.name}
                                </span>
                              </div>
                              {playerKeyboard.estimated_price_thb && (
                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  Est. Price: ฿{Number(playerKeyboard.estimated_price_thb).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {playerKeyboard.shopee_url && (
                              <a href={playerKeyboard.shopee_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-[#ee4d2d]/10 hover:bg-[#ee4d2d]/25 text-[#ee4d2d] border border-[#ee4d2d]/20 hover:border-[#ee4d2d]/50 transition-all duration-200 font-mono">
                                Shopee
                              </a>
                            )}
                            {playerKeyboard.lazada_url && (
                              <a href={playerKeyboard.lazada_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-accent/10 hover:bg-accent/25 text-accent border border-accent/20 hover:border-accent/50 transition-all duration-200 font-mono">
                                Lazada
                              </a>
                            )}
                            {playerKeyboard.amazon_url && (
                              <a href={playerKeyboard.amazon_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/12 text-white border border-white/10 hover:border-white/30 transition-all duration-200 font-mono">
                                Amazon
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Equipment Gears List */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-md font-bold text-white font-display">My Gear</h2>
                  {remainingGears.length === 0 ? (
                    <div className="bg-card border border-zinc-800 p-6 rounded-2xl text-center">
                      <p className="text-xs text-zinc-500 font-mono italic">No gear setup selected yet. Click Edit Profile Card to select gears.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {remainingGears.map((product) => (
                        <GearCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Favorites List section remains at bottom */}
          <div className="border-t border-zinc-850 pt-10">
            <div className="bg-[#12121A]/50 border border-zinc-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-accent font-mono uppercase tracking-widest">Bookmarks</span>
                  <h2 className="text-xl font-extrabold text-white font-display mt-1">My Favorite Players</h2>
                </div>
                <span className="text-xs text-zinc-500 font-mono font-semibold">
                  {favorites.length} {favorites.length === 1 ? 'Player' : 'Players'} saved
                </span>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-10 bg-black/10 border border-dashed border-zinc-800/80 rounded-xl flex flex-col items-center justify-center space-y-3">
                  <p className="text-xs font-bold text-zinc-500 font-mono italic">No bookmarked players yet.</p>
                  <Link href="/players" className="px-4 py-2 bg-accent/5 hover:bg-accent/10 text-accent border border-accent/15 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider transition-colors duration-200">
                    Browse Players
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {favorites.map((player) => {
                    const isRemoving = removingFavoriteIds.includes(player.id);
                    return (
                      <Link
                        key={player.id}
                        href={`/players/${player.username}`}
                        className={`bg-black/20 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between hover:border-accent/40 hover:bg-[#1A1A24]/30 group transition-all duration-[600ms] ease-out ${isRemoving
                            ? 'opacity-0 scale-95 pointer-events-none'
                            : ''
                          }`}
                        style={{
                          maxHeight: isRemoving ? '0px' : '200px',
                          paddingTop: isRemoving ? '0px' : '',
                          paddingBottom: isRemoving ? '0px' : '',
                          marginTop: isRemoving ? '0px' : '',
                          marginBottom: isRemoving ? '0px' : '',
                          borderWidth: isRemoving ? '0px' : '',
                          overflow: isRemoving ? 'hidden' : 'visible',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#1A1A24] border border-zinc-800 flex items-center justify-center font-bold text-accent text-xs overflow-hidden flex-shrink-0">
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
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs group-hover:text-accent font-display transition-colors">
                                {player.username}
                              </span>
                              {player.country_code && (
                                <span className="text-[8px] text-zinc-500 font-mono font-semibold">
                                  {player.country_code}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono line-clamp-1">
                              {player.team || 'Free Agent'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleRemoveFavorite(player.id, e)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-zinc-900/50 hover:bg-accent/15 border border-zinc-800 hover:border-accent/30 text-accent transition-all duration-200 cursor-pointer"
                          title="Remove Favorite"
                        >
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
