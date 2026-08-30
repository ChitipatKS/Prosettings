'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import PlayerProfileClient from '@/components/PlayerProfileClient';
import TeamLogoImg from '@/components/TeamLogoImg';

type Player = {
  id: number;
  username: string;
  Full_name?: string | null;
  full_name?: string | null;
  real_name?: string | null;
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

function calculateAge(birthDateStr?: string | null): number | null {
  if (!birthDateStr) return null;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatBirthDate(birthDateStr?: string | null): string {
  if (!birthDateStr) return '';
  const d = new Date(birthDateStr);
  if (isNaN(d.getTime())) return birthDateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatSocialUrl(url: string, platform: 'twitter' | 'twitch' | 'instagram' | 'youtube' | 'tiktok' | 'discord' | 'facebook'): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, '');
  switch (platform) {
    case 'twitter':
      return `https://x.com/${clean}`;
    case 'twitch':
      return `https://twitch.tv/${clean}`;
    case 'instagram':
      return `https://instagram.com/${clean}`;
    case 'youtube':
      return clean.startsWith('UC') ? `https://youtube.com/channel/${clean}` : `https://youtube.com/@${clean}`;
    case 'tiktok':
      return `https://tiktok.com/@${clean}`;
    case 'facebook':
      return `https://facebook.com/${clean}`;
    case 'discord':
      return `https://discord.com/users/${clean}`;
    default:
      return `https://${trimmed}`;
  }
}

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
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-zinc-500 italic font-mono">
                No matching gears found
              </div>
            ) : (
              filteredOptions.map((product) => {
                const isSelected = product.id.toString() === selectedValue;
                return (
                  <div
                    key={product.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(product.id.toString());
                      setSearchQuery(product.name);
                      setIsOpen(false);
                      setIsUserTyping(false);
                    }}
                    className={`px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-accent/15 text-accent font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <span>{product.name}</span>
                    {product.estimated_price_thb && (
                      <span className="text-[10px] text-zinc-500 font-sans">
                        ฿{Number(product.estimated_price_thb).toLocaleString()}
                      </span>
                    )}
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
  placeholder = "Search country..."
}: {
  label: string;
  options: { code: string; name: string }[];
  selectedValue: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = options.find(c => c.code === selectedValue);

  useEffect(() => {
    if (selectedCountry) {
      setSearchQuery(`${selectedCountry.name} (${selectedCountry.code})`);
    } else if (!selectedValue) {
      setSearchQuery('');
    }
  }, [selectedCountry, selectedValue]);

  const displayOptions = searchQuery.trim().length > 0 && !selectedCountry
    ? options.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

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
            setIsOpen(true);
            if (e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={() => {
            if (inputRef.current) {
              inputRef.current.select();
            }
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              if (selectedCountry) {
                setSearchQuery(`${selectedCountry.name} (${selectedCountry.code})`);
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
                    className={`px-4 py-2.5 text-xs font-mono cursor-pointer transition-colors ${
                      isSelected
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
  const [copied, setCopied] = useState(false);

  // Form profile states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [nationality, setNationality] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [description, setDescription] = useState('');
  const [profileImgUrl, setProfileImgUrl] = useState('');
  const [team, setTeam] = useState('Community Member');
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
  const [valEnemyHighlight, setValEnemyHighlight] = useState('Red (Default)');
  const [valCrosshairCode, setValCrosshairCode] = useState('');
  const [valRapidTrigger, setValRapidTrigger] = useState('');
  const [valActuationPoint, setValActuationPoint] = useState('');
  const [valPollingRate, setValPollingRate] = useState('');

  // CS2 settings
  const [csDpi, setCsDpi] = useState('800');
  const [csSens, setCsSens] = useState('1.0');
  const [csHz, setCsHz] = useState('1000');
  const [csZoomSens, setCsZoomSens] = useState('1.0');
  const [csRes, setCsRes] = useState('1280x960');
  const [csAspect, setCsAspect] = useState('4:3');

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
  const [twitter, setTwitter] = useState('');
  const [twitch, setTwitch] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [discord, setDiscord] = useState('');
  const [facebook, setFacebook] = useState('');

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
          setFullName(profile.Full_name || profile.full_name || profile.real_name || '');
          setSelectedCountryCode(profile.country_code || '');
          setNationality(profile.nationality || '');
          setBirthDate(profile.birth_date || '');
          setDescription(profile.description || '');
          setProfileImgUrl(profile.profile_img_url || '');

          // Load social links
          const socials = profile.social_links || {};
          setTwitter(socials.twitter || socials.x || '');
          setTwitch(socials.twitch || '');
          setInstagram(socials.instagram || '');
          setYoutube(socials.youtube || '');
          setTiktok(socials.tiktok || '');
          setDiscord(socials.discord || '');
          setFacebook(socials.facebook || '');

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
            setValEnemyHighlight(settings.valorant.settings_data?.enemy_highlight_color || 'Red (Default)');
            setValCrosshairCode(settings.valorant.settings_data?.crosshair_code || '');
            setValRapidTrigger(settings.valorant.settings_data?.rapid_trigger || '');
            setValActuationPoint(settings.valorant.settings_data?.actuation_point || '');
            setValPollingRate(settings.valorant.settings_data?.polling_rate || '');
          }

          // Load cs2 values if exist
          if (settings.cs2) {
            setCsDpi(settings.cs2.mouse_dpi?.toString() || '800');
            setCsSens(settings.cs2.in_game_sens?.toString() || '1.0');
            setCsHz(settings.cs2.mouse_hz?.toString() || '1000');
            setCsZoomSens(settings.cs2.zoom_sens?.toString() || '1.0');
            setCsRes(settings.cs2.resolution || '1280x960');
            setCsAspect(settings.cs2.aspect_ratio || '4:3');
          }

          // Set active gear dropdowns
          const ids = profile.gear_ids || [];
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

          if (!profile.is_profile_created) {
            setIsEditing(true);
          }
        } else {
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
              Full_name,
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
        refresh_rate: null,
        settings_data: {
          enemy_highlight_color: valEnemyHighlight,
          crosshair_code: valCrosshairCode.trim() || undefined,
          rapid_trigger: valRapidTrigger.trim() || undefined,
          actuation_point: valActuationPoint.trim() || undefined,
          polling_rate: valPollingRate.trim() || undefined
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
        refresh_rate: null
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
    const natName = countryObj ? countryObj.name : nationality;

    const socialLinks = {
      twitter: twitter.trim(),
      twitch: twitch.trim(),
      instagram: instagram.trim(),
      youtube: youtube.trim(),
      tiktok: tiktok.trim(),
      discord: discord.trim(),
      facebook: facebook.trim()
    };

    const cleanUsername = username.trim() || email?.split('@')[0] || 'User';

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: cleanUsername,
          Full_name: fullName.trim() || null,
          nationality: natName,
          country_code: selectedCountryCode,
          birth_date: birthDate || null,
          description: description.trim() || null,
          profile_img_url: profileImgUrl.trim() || null,
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
        setNationality(natName);
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

  const handleCopyProfileLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/profile`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveFavorite = async (playerId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) return;

    setRemovingFavoriteIds(prev => [...prev, playerId]);

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

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 py-20 flex flex-col justify-center items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        <span className="text-zinc-500 text-xs font-mono">Loading Profile Dashboard...</span>
      </div>
    );
  }

  const playerMouse = selectedGears.find(g => g.category.toLowerCase() === 'mouse') || null;
  const playerKeyboard = selectedGears.find(g => g.category.toLowerCase() === 'keyboard') || null;
  const playerMonitor = selectedGears.find(g => g.category.toLowerCase() === 'monitor') || null;

  // Build settingsData array for PlayerProfileClient
  const constructedSettingsData: any[] = [];
  if (gamesPlayed.valorant) {
    constructedSettingsData.push({
      id: 1,
      game_role: 'Community Member',
      mouse_dpi: parseFloat(valDpi) || 800,
      mouse_hz: parseInt(valHz, 10) || 1000,
      in_game_sens: parseFloat(valSens) || 0.35,
      edpi: (parseFloat(valDpi) || 800) * (parseFloat(valSens) || 0.35),
      resolution: valRes || '1920x1080',
      aspect_ratio: valAspect || '16:9',
      refresh_rate: null,
      settings_data: {
        scoped_sens: valScopedSens,
        enemy_highlight_color: valEnemyHighlight,
        crosshair_code: valCrosshairCode || undefined,
        rapid_trigger: valRapidTrigger || undefined,
        actuation_point: valActuationPoint || undefined,
        polling_rate: valPollingRate || undefined
      },
      games: {
        id: 2,
        name: 'VALORANT',
        slug: 'valorant'
      }
    });
  }

  if (gamesPlayed.cs2) {
    constructedSettingsData.push({
      id: 2,
      game_role: 'Community Member',
      mouse_dpi: parseFloat(csDpi) || 800,
      mouse_hz: parseInt(csHz, 10) || 1000,
      in_game_sens: parseFloat(csSens) || 1.0,
      edpi: (parseFloat(csDpi) || 800) * (parseFloat(csSens) || 1.0),
      resolution: csRes || '1280x960',
      aspect_ratio: csAspect || '4:3',
      refresh_rate: null,
      settings_data: {
        zoom_sens: csZoomSens
      },
      games: {
        id: 3,
        name: 'CS2',
        slug: 'cs2'
      }
    });
  }

  const profileDataForClient = {
    id: 0,
    username: username || 'User',
    Full_name: fullName,
    real_name: fullName,
    team: team || 'Community Member',
    country_code: selectedCountryCode,
    nationality: nationality,
    profile_img_url: profileImgUrl,
    birth_date: birthDate,
    description: description,
    social_links: {
      twitter,
      twitch,
      instagram,
      youtube,
      tiktok,
      discord,
      facebook
    }
  };

  const gearItems = selectedGears.filter(g => g.product_type === 'gear');
  const hardwareItems = selectedGears.filter(g => g.product_type === 'hardware');

  return (
    <div className="relative flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Ambient orbs */}
      <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent opacity-[0.015] blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[25%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent opacity-[0.015] blur-[150px] pointer-events-none"></div>

      {isEditing ? (
        /* ==================== PROFILE EDITOR FORM ==================== */
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Back button */}
          {isProfileCreated && (
            <div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white transition-colors duration-200 font-mono cursor-pointer"
              >
                ← BACK TO PROFILE VIEW
              </button>
            </div>
          )}

          <div className="border-b border-zinc-800/80 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Edit <span className="text-accent">Gamer Profile</span>
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              Customize your setup, crosshair, sensitivity, and gear to display on your profile.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-8">
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
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. your_gamertag"
                    className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Full Name / Real Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe (Optional)"
                    className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono"
                  />
                </div>

                <CountrySearchSelect
                  label="Nationality / Country"
                  options={countriesList}
                  selectedValue={selectedCountryCode}
                  onChange={setSelectedCountryCode}
                  placeholder="Type to search country..."
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Birth Date</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Profile Image URL</label>
                  <input
                    type="text"
                    value={profileImgUrl}
                    onChange={(e) => setProfileImgUrl(e.target.value)}
                    placeholder="https://... (Direct image link)"
                    className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Bio / Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Share a short bio about your playstyle, favorite roles, or accomplishments..."
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-sans resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Block 2: Game Settings */}
            <div className="bg-card border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono border-b border-zinc-800 pb-3">
                2. Game Specific Settings
              </h2>

              <div className="space-y-6">
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
                        <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Enemy Highlight Color</label>
                        <select value={valEnemyHighlight} onChange={e => setValEnemyHighlight(e.target.value)} className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-accent/50">
                          <option value="Red (Default)">Red (Default)</option>
                          <option value="Purple">Purple</option>
                          <option value="Yellow (Deuteranopia)">Yellow (Deuteranopia)</option>
                          <option value="Yellow (Protanopia)">Yellow (Protanopia)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Crosshair Profile Code</label>
                        <input type="text" value={valCrosshairCode} onChange={e => setValCrosshairCode(e.target.value)} placeholder="0;P;c;5;o;1;d;1..." className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Rapid Trigger / Actuation</label>
                        <input type="text" value={valRapidTrigger} onChange={e => setValRapidTrigger(e.target.value)} placeholder="e.g. 0.1mm" className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
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
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Resolution</label>
                        <input type="text" value={csRes} onChange={e => setCsRes(e.target.value)} placeholder="e.g. 1280x960" className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Aspect Ratio</label>
                        <input type="text" value={csAspect} onChange={e => setCsAspect(e.target.value)} placeholder="e.g. 4:3" className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white" />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Twitter / X</label>
                  <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@handle or URL" className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Twitch</label>
                  <input type="text" value={twitch} onChange={e => setTwitch(e.target.value)} placeholder="twitch_username" className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Instagram</label>
                  <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="instagram_handle" className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">YouTube</label>
                  <input type="text" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="channel URL or @handle" className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">TikTok</label>
                  <input type="text" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@tiktok_handle" className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Discord Username</label>
                  <input type="text" value={discord} onChange={e => setDiscord(e.target.value)} placeholder="discord_tag" className="w-full h-11 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-accent/50 transition-all font-mono" />
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
        </div>
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
        /* ==================== CREATED PROFILE VIEW MODE (Matching Player Page) ==================== */
        <div className="space-y-10">
          {/* ================================================ */}
          {/* SECTION 1: PROFILE HEADER (Full Width Banner) */}
          {/* ================================================ */}
          <section className="relative z-10 bg-card backdrop-blur-[8px] border border-border-custom p-6 sm:p-8 rounded-2xl mb-10 hover:border-border-hover transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-32 h-32 md:w-40 md:h-40 min-w-32 min-h-32 md:min-w-40 md:min-h-40 max-w-32 max-h-32 md:max-w-40 md:max-h-40 aspect-square rounded-full bg-[#1A1A24] border border-border-custom flex items-center justify-center font-black text-accent text-4xl md:text-5xl overflow-hidden shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.05)]">
                  {profileImgUrl ? (
                    <img src={profileImgUrl} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    username ? username[0].toUpperCase() : '?'
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display flex items-center gap-3">
                      {username}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg font-sans tracking-wide border bg-zinc-800/40 border-zinc-700/30 text-zinc-300">
                      Community Member
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center text-xs sm:text-sm text-zinc-400 font-sans gap-x-3 gap-y-1.5">
                    {fullName && (
                      <span className="font-semibold text-zinc-200">{fullName}</span>
                    )}
                    {fullName && (nationality || selectedCountryCode || birthDate) && (
                      <span className="text-zinc-700 font-bold">•</span>
                    )}
                    {nationality && (
                      <span className="flex items-center gap-1.5">
                        {selectedCountryCode && (
                          <img
                            src={`https://flagcdn.com/16x12/${selectedCountryCode.toLowerCase()}.png`}
                            alt={selectedCountryCode}
                            className="w-4 h-3 object-cover rounded-[2px]"
                          />
                        )}
                        <span>{nationality}</span>
                      </span>
                    )}
                    {!nationality && selectedCountryCode && (
                      <span className="flex items-center gap-1.5">
                        <img
                          src={`https://flagcdn.com/16x12/${selectedCountryCode.toLowerCase()}.png`}
                          alt={selectedCountryCode}
                          className="w-4 h-3 object-cover rounded-[2px]"
                        />
                        <span>{selectedCountryCode}</span>
                      </span>
                    )}
                    {(nationality || selectedCountryCode) && birthDate && (
                      <span className="text-zinc-700 font-bold">•</span>
                    )}
                    {birthDate && (
                      <span className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>
                          {formatBirthDate(birthDate)}
                          {calculateAge(birthDate) !== null && ` (${calculateAge(birthDate)} years old)`}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Description / Bio */}
                  <div className="border-l-2 border-zinc-700/50 pl-4 py-0.5 max-w-2xl pt-1">
                    <p className="text-xs text-zinc-400 leading-relaxed italic font-sans">
                      {description || "Community gamer profile. Tracking in-game sensitivity, crosshair setup, and hardware peripherals."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social media logos & Actions */}
              <div className="flex flex-wrap items-center gap-3 shrink-0 lg:ml-auto">
                {/* Dynamic Social logos container */}
                {(() => {
                  const twitterLink = twitter;
                  const twitchLink = twitch;
                  const instagramLink = instagram;
                  const youtubeLink = youtube;
                  const tiktokLink = tiktok;
                  const discordLink = discord;

                  const hasAnySocial = Boolean(twitterLink || twitchLink || instagramLink || youtubeLink || tiktokLink || discordLink);
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
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </a>
                      )}

                      {/* TikTok */}
                      {tiktokLink && (
                        <a
                          href={formatSocialUrl(tiktokLink, 'tiktok')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-[#25F4EE] hover:bg-[#25F4EE]/10 rounded-lg transition-all duration-200"
                          title="TikTok"
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </a>
                      )}

                      {/* Discord */}
                      {discordLink && (
                        <div
                          className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-[#5865F2] hover:bg-[#5865F2]/10 rounded-lg transition-all duration-200 cursor-pointer"
                          title={`Discord: ${discordLink}`}
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Edit Profile Button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-accent hover:bg-accent/90 text-black font-bold font-sans rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-accent/20 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span>EDIT PROFILE</span>
                </button>

                {/* Copy profile link */}
                <button
                  onClick={handleCopyProfileLink}
                  className="px-4 py-2 bg-[#12121A]/80 hover:bg-[#1A1A24] border border-border-custom hover:border-accent/40 text-accent font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>{copied ? 'COPIED!' : 'COPY PROFILE LINK'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* ================================================ */}
          {/* SECTION 2: PLAYER PROFILE CLIENT (Settings & Gear) */}
          {/* ================================================ */}
          {constructedSettingsData.length > 0 ? (
            <PlayerProfileClient
              player={profileDataForClient}
              settingsData={constructedSettingsData}
              gears={gearItems}
              hardware={hardwareItems}
              playerMouse={playerMouse}
              playerKeyboard={playerKeyboard}
              playerMonitor={playerMonitor}
              showComments={false}
            />
          ) : (
            <div className="bg-[#12121A]/50 border border-zinc-800 p-8 rounded-2xl text-center space-y-4">
              <h3 className="text-lg font-bold text-white font-display">No Game Settings Configured Yet</h3>
              <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
                You haven&apos;t added your sensitivity or game settings yet. Click &quot;Edit Profile&quot; above to add VALORANT or CS2 settings.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-accent text-accent-fg font-mono text-xs font-bold rounded-xl tracking-wider uppercase cursor-pointer"
              >
                Configure Settings
              </button>
            </div>
          )}

          {/* ================================================ */}
          {/* SECTION 3: FAVORITES PRO PLAYERS (Bookmarks) */}
          {/* ================================================ */}
          <div className="border-t border-zinc-800/80 pt-10">
            <div className="bg-[#12121A]/50 border border-zinc-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-accent font-sans uppercase tracking-widest">Bookmarks</span>
                  <h2 className="text-xl font-extrabold text-white font-display mt-1">My Favorite Players</h2>
                </div>
                <span className="text-xs text-zinc-500 font-sans font-semibold">
                  <span className="font-mono">{favorites.length}</span> {favorites.length === 1 ? 'Player' : 'Players'} saved
                </span>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-10 bg-black/10 border border-dashed border-zinc-800/80 rounded-xl flex flex-col items-center justify-center space-y-3">
                  <p className="text-xs font-bold text-zinc-500 font-sans italic">No bookmarked players yet.</p>
                  <Link href="/players" className="px-4 py-2 bg-accent/5 hover:bg-accent/10 text-accent border border-accent/15 rounded-lg text-[9px] font-bold font-sans uppercase tracking-wider transition-colors duration-200">
                    Browse Players
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {favorites.map((favPlayer) => {
                    const isRemoving = removingFavoriteIds.includes(favPlayer.id);
                    return (
                      <Link
                        key={favPlayer.id}
                        href={`/players/${favPlayer.username}`}
                        className={`bg-black/20 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between hover:border-accent/40 hover:bg-[#1A1A24]/30 group transition-all duration-[600ms] ease-out ${
                          isRemoving ? 'opacity-0 scale-95 pointer-events-none' : ''
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
                            {favPlayer.profile_img_url ? (
                              <img
                                src={favPlayer.profile_img_url}
                                alt={favPlayer.username}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '';
                                  (e.target as HTMLImageElement).parentElement!.innerText = favPlayer.username[0].toUpperCase();
                                }}
                              />
                            ) : (
                              favPlayer.username[0].toUpperCase()
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs group-hover:text-accent font-display transition-colors">
                                {favPlayer.username}
                              </span>
                              {favPlayer.country_code && (
                                <span className="text-[8px] text-zinc-500 font-sans font-semibold">
                                  {favPlayer.country_code}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-sans line-clamp-1">
                              {favPlayer.team || 'Free Agent'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleRemoveFavorite(favPlayer.id, e)}
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
