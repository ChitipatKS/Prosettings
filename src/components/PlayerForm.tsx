'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teamInputRef = useRef<HTMLInputElement>(null);

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
          setRealName(player.real_name || '');
          setTeam(player.team || '');
          setCountryCode(player.country_code || '');
          setBirthDate(player.birth_date || '');
          setDescription(player.description || '');
          setProfileImgUrl(player.profile_img_url || '');

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

      // 1. Insert or Update player info
      if (isEdit && playerId) {
        const { error } = await supabase
          .from('players')
          .update({
            username: username.trim(),
            real_name: realName.trim() || null,
            team: team.trim() || null,
            nationality: nationality || null,
            country_code: countryCode || null,
            birth_date: birthDate || null,
            description: description.trim() || null,
            profile_img_url: profileImgUrl || null
          })
          .eq('id', playerId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('players')
          .insert({
            username: username.trim(),
            real_name: realName.trim() || null,
            team: team.trim() || null,
            nationality: nationality || null,
            country_code: countryCode || null,
            birth_date: birthDate || null,
            description: description.trim() || null,
            profile_img_url: profileImgUrl || null
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
            cast_shadows: valCastShadows
          }
        });
      }

      if (playsCS2) {
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
            anisotropic_filtering: csAnisotropic
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
            <div className="w-24 h-24 rounded-2xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center font-bold text-accent text-3xl overflow-hidden relative shadow-inner group">
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Team Name</label>
              <input
                type="text"
                ref={teamInputRef}
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full h-10 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-accent transition-all font-mono"
              />
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
