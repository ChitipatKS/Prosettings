'use client';

import React from 'react';
import CS2CrosshairPreview, {
  CS2CrosshairSettings,
  encodeCSGOShareCode,
  decodeCSGOShareCode,
  parseCS2CrosshairDetails,
  getCS2ConsoleCommandsString,
  CS2_COLOR_PRESETS,
  CS2_STYLES
} from '@/components/CS2CrosshairPreview';

export type CS2SettingsEditorProps = {
  csRole?: string;
  setCsRole?: (val: string) => void;
  csDpi: string;
  setCsDpi: (val: string) => void;
  csSens: string;
  setCsSens: (val: string) => void;
  csHz: string;
  setCsHz: (val: string) => void;
  csZoomSens: string;
  setCsZoomSens: (val: string) => void;
  csRes: string;
  setCsRes: (val: string) => void;
  csAspect: string;
  setCsAspect: (val: string) => void;

  csDisplayMode: string;
  setCsDisplayMode: (val: string) => void;
  csNvidiaReflex: string;
  setCsNvidiaReflex: (val: string) => void;
  csMultithreaded: string;
  setCsMultithreaded: (val: string) => void;
  csMaterialQuality: string;
  setCsMaterialQuality: (val: string) => void;
  csTextureQuality: string;
  setCsTextureQuality: (val: string) => void;
  csVsync: string;
  setCsVsync: (val: string) => void;
  csAntiAliasing: string;
  setCsAntiAliasing: (val: string) => void;
  csAnisotropic: string;
  setCsAnisotropic: (val: string) => void;

  csCrosshairs: CS2CrosshairSettings[];
  setCsCrosshairs: React.Dispatch<React.SetStateAction<CS2CrosshairSettings[]>>;
};

export default function CS2SettingsEditor({
  csRole,
  setCsRole,
  csDpi,
  setCsDpi,
  csSens,
  setCsSens,
  csHz,
  setCsHz,
  csZoomSens,
  setCsZoomSens,
  csRes,
  setCsRes,
  csAspect,
  setCsAspect,

  csDisplayMode,
  setCsDisplayMode,
  csNvidiaReflex,
  setCsNvidiaReflex,
  csMultithreaded,
  setCsMultithreaded,
  csMaterialQuality,
  setCsMaterialQuality,
  csTextureQuality,
  setCsTextureQuality,
  csVsync,
  setCsVsync,
  csAntiAliasing,
  setCsAntiAliasing,
  csAnisotropic,
  setCsAnisotropic,

  csCrosshairs,
  setCsCrosshairs
}: CS2SettingsEditorProps) {
  const [selectedCrosshairIndex, setSelectedCrosshairIndex] = React.useState(0);
  const safeIndex = csCrosshairs.length > 0 ? Math.min(selectedCrosshairIndex, csCrosshairs.length - 1) : 0;
  const eDpi = ((parseFloat(csDpi) || 0) * (parseFloat(csSens) || 0)).toFixed(2);

  return (
    <div className="border border-amber-500/20 bg-amber-500/[0.01] p-6 rounded-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
        <h3 className="text-xs font-bold text-amber-400 font-mono flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          CS2 SETTINGS CONFIGURATION
        </h3>
      </div>

      {/* 1. Basic Mouse & Display Settings */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {setCsRole && (
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">In-Game Role</label>
              <input
                type="text"
                value={csRole || ''}
                onChange={e => setCsRole(e.target.value)}
                placeholder="e.g. AWPer, Rifler, Entry"
                className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Mouse DPI</label>
            <input
              type="number"
              value={csDpi}
              onChange={e => setCsDpi(e.target.value)}
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Sensitivity</label>
            <input
              type="number"
              step="0.001"
              value={csSens}
              onChange={e => setCsSens(e.target.value)}
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Mouse Hz</label>
            <input
              type="number"
              value={csHz}
              onChange={e => setCsHz(e.target.value)}
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Zoom Sens</label>
            <input
              type="number"
              step="0.1"
              value={csZoomSens}
              onChange={e => setCsZoomSens(e.target.value)}
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Resolution</label>
            <input
              type="text"
              value={csRes}
              onChange={e => setCsRes(e.target.value)}
              placeholder="e.g. 1280x960"
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Aspect Ratio</label>
            <input
              type="text"
              value={csAspect}
              onChange={e => setCsAspect(e.target.value)}
              placeholder="e.g. 4:3"
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500/40"
            />
          </div>
        </div>

        <div className="text-[10px] text-zinc-500 font-mono">
          Calculated CS2 eDPI: <span className="text-amber-400 font-bold">{eDpi}</span>
        </div>
      </div>

      {/* 2. VIDEO & GRAPHICS QUALITY SETTINGS */}
      <div className="border-t border-amber-500/10 pt-5 space-y-4">
        <h4 className="text-[11px] font-extrabold text-amber-400/85 font-mono uppercase tracking-wider">
          Video & Graphics Quality Settings
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Display Mode</label>
            <select
              value={csDisplayMode}
              onChange={e => setCsDisplayMode(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="Fullscreen">Fullscreen</option>
              <option value="Windowed">Windowed</option>
              <option value="Borderless">Borderless</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">NVIDIA Reflex</label>
            <select
              value={csNvidiaReflex}
              onChange={e => setCsNvidiaReflex(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="Enabled + Boost">Enabled + Boost</option>
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Multithreaded</label>
            <select
              value={csMultithreaded}
              onChange={e => setCsMultithreaded(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Shadow Quality</label>
            <select
              value={csMaterialQuality}
              onChange={e => setCsMaterialQuality(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="Very High">Very High</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Texture Quality</label>
            <select
              value={csTextureQuality}
              onChange={e => setCsTextureQuality(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">VSync</label>
            <select
              value={csVsync}
              onChange={e => setCsVsync(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Anti-Aliasing Mode</label>
            <select
              value={csAntiAliasing}
              onChange={e => setCsAntiAliasing(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="8x MSAA">8x MSAA</option>
              <option value="4x MSAA">4x MSAA</option>
              <option value="2x MSAA">2x MSAA</option>
              <option value="None">None</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Texture Filtering</label>
            <select
              value={csAnisotropic}
              onChange={e => setCsAnisotropic(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono cursor-pointer"
            >
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

      {/* 3. CS2 CROSSHAIR CONFIGURATIONS */}
      <div className="border-t border-amber-500/10 pt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h4 className="text-[11px] font-extrabold text-amber-400/85 font-mono uppercase tracking-wider flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 12h.01" strokeLinecap="round" />
              </svg>
              Crosshair Profiles ({csCrosshairs.length})
            </h4>

            {csCrosshairs.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono font-medium">Select Profile:</span>
                <div className="relative">
                  <select
                    value={safeIndex}
                    onChange={(e) => setSelectedCrosshairIndex(Number(e.target.value))}
                    className="h-8 bg-[#0F0F15] border border-amber-500/30 hover:border-amber-500/50 rounded-lg pl-3 pr-8 text-xs font-mono text-white focus:outline-none focus:border-amber-500/60 cursor-pointer appearance-none shadow-sm font-semibold"
                  >
                    {csCrosshairs.map((ch, idx) => (
                      <option key={ch.id || idx} value={idx}>
                        #{idx + 1}: {ch.name || `Crosshair ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400/70 text-[9px]">
                    ▼
                  </div>
                </div>
              </div>
            )}
          </div>

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
              setSelectedCrosshairIndex(csCrosshairs.length);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>+</span> Add Another Crosshair
          </button>
        </div>

        <div className="space-y-4">
          {csCrosshairs.length === 0 ? (
            <div className="p-8 rounded-xl bg-black/40 border border-dashed border-zinc-800 text-center space-y-3">
              <p className="text-xs text-zinc-500 font-mono">No crosshair profiles configured.</p>
              <button
                type="button"
                onClick={() => {
                  const newCh: CS2CrosshairSettings = {
                    id: String(Date.now()),
                    name: `Crosshair 1`,
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
                  setCsCrosshairs([newCh]);
                  setSelectedCrosshairIndex(0);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>+</span> Add Crosshair Profile
              </button>
            </div>
          ) : (() => {
            const c = csCrosshairs[safeIndex] || csCrosshairs[0];
            const index = safeIndex;
            const parsed = parseCS2CrosshairDetails(c);

            const updateCsCrosshair = (changes: Partial<CS2CrosshairSettings>) => {
              setCsCrosshairs(prev => prev.map((item, i) => {
                if (i !== index) return item;
                const updated: CS2CrosshairSettings = { ...item, ...changes };
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

            return (
              <div key={c.id || index} className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-4 relative group">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={c.name || ''}
                      onChange={e => {
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
                      onClick={() => {
                        setCsCrosshairs(prev => prev.filter((_, i) => i !== index));
                        setSelectedCrosshairIndex(prev => Math.max(0, prev - 1));
                      }}
                      className="text-zinc-500 hover:text-amber-400 text-xs font-mono px-2.5 py-1 rounded hover:bg-amber-500/10 transition-colors cursor-pointer"
                      title="Remove this crosshair"
                    >
                      ✕ Delete
                    </button>
                  )}
                </div>

                {/* Live Canvas Crosshair Simulation */}
                <div className="max-w-xs mx-auto">
                  <CS2CrosshairPreview settings={c} className="mb-0" />
                </div>

                {/* CS2 Crosshair Share Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase">
                      CS2 Crosshair Share Code
                    </label>
                  </div>
                  <input
                    type="text"
                    value={c.crosshair_code || ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val.trim().startsWith('CSGO-')) {
                        const parsedFromCode = decodeCSGOShareCode(val.trim());
                        if (parsedFromCode) {
                          setCsCrosshairs(prev => prev.map((item, i) => i === index ? {
                            ...item,
                            ...parsedFromCode,
                            crosshair_code: val.trim()
                          } : item));
                          return;
                        }
                      }
                      setCsCrosshairs(prev => prev.map((item, i) => i === index ? { ...item, crosshair_code: val } : item));
                    }}
                    placeholder="e.g. CSGO-7O24P-e2eW3-9v4sH-v2wPn-Q3PxF"
                    className="w-full h-8 bg-black/60 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-mono placeholder:text-zinc-700"
                  />
                </div>

                {/* Style, Size, Gap, Thickness, Dot, Outline */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-zinc-800/60">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Style</label>
                    <select
                      value={parsed.style}
                      onChange={e => updateCsCrosshair({ style: parseInt(e.target.value, 10) })}
                      className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono cursor-pointer"
                    >
                      <option value="0">Default</option>
                      <option value="1">Default Static</option>
                      <option value="2">Classic</option>
                      <option value="3">Classic Dynamic</option>
                      <option value="4">Classic Static</option>
                      <option value="5">Legacy Dynamic</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Size</label>
                    <input
                      type="number"
                      step="0.5"
                      value={parsed.size}
                      onChange={e => updateCsCrosshair({ size: parseFloat(e.target.value) || 0 })}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Gap</label>
                    <input
                      type="number"
                      step="0.5"
                      value={parsed.gap}
                      onChange={e => updateCsCrosshair({ gap: parseFloat(e.target.value) || 0 })}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Thickness</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={parsed.thickness}
                      onChange={e => updateCsCrosshair({ thickness: parseFloat(e.target.value) || 0.5 })}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Center Dot</label>
                    <select
                      value={parsed.dot ? "On" : "Off"}
                      onChange={e => updateCsCrosshair({ dot: e.target.value === "On" })}
                      className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono cursor-pointer"
                    >
                      <option value="Off">Off</option>
                      <option value="On">On</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outline</label>
                    <select
                      value={parsed.outline ? "On" : "Off"}
                      onChange={e => updateCsCrosshair({ outline: e.target.value === "On" })}
                      className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-amber-500/40 font-mono cursor-pointer"
                    >
                      <option value="Off">Off</option>
                      <option value="On">On</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
