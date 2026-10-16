'use client';

import React, { useState } from 'react';
import CrosshairPreview, {
  parseValorantCrosshairToFields,
  getCrosshairExportCode,
  parseCrosshairDetails,
  encodeValorantCrosshair,
  COLOR_MAP
} from '@/components/CrosshairPreview';

export interface ValorantCrosshairItem {
  id: string;
  name: string;
  crosshair_code: string;
  crosshair_color?: string;
  crosshair_outline?: string;
  crosshair_dot?: string;
  crosshair_inner?: string;
  crosshair_outer?: string;
  crosshair_thickness?: string;
  inner_movement_error?: boolean;
  inner_firing_error?: boolean;
  outer_movement_error?: boolean;
  outer_firing_error?: boolean;
  [key: string]: any;
}

export interface ValorantCrosshairsEditorProps {
  crosshairs: ValorantCrosshairItem[];
  onChange: (crosshairs: ValorantCrosshairItem[]) => void;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
}

export default function ValorantCrosshairsEditor({
  crosshairs,
  onChange,
  selectedIndex,
  onSelectIndex
}: ValorantCrosshairsEditorProps) {
  const [internalIndex, setInternalIndex] = useState<number>(0);
  const activeIndex = selectedIndex !== undefined ? selectedIndex : internalIndex;
  const setActiveIndex = onSelectIndex || setInternalIndex;
  const safeIndex = Math.min(activeIndex, Math.max(0, crosshairs.length - 1));

  return (
    <div className="border-t border-red-500/10 pt-5 space-y-4">
      {/* Header with Title, Profile Selector Dropdown, and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="text-[11px] font-extrabold text-red-400/85 font-mono uppercase tracking-wider flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 12h.01" strokeLinecap="round" />
            </svg>
            Crosshair Configurations ({crosshairs.length})
          </h4>

          {crosshairs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono font-medium">Select Profile:</span>
              <div className="relative">
                <select
                  value={safeIndex}
                  onChange={(e) => setActiveIndex(Number(e.target.value))}
                  className="h-8 bg-[#0F0F15] border border-red-500/30 hover:border-red-500/50 rounded-lg pl-3 pr-8 text-xs font-mono text-white focus:outline-none focus:border-red-500/60 cursor-pointer appearance-none shadow-sm font-semibold"
                >
                  {crosshairs.map((ch, idx) => (
                    <option key={ch.id || idx} value={idx}>
                      #{idx + 1}: {ch.name || `Crosshair ${idx + 1}`}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-red-400/70 text-[9px]">
                  ▼
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            const newCh: ValorantCrosshairItem = {
              id: String(Date.now()),
              name: `Crosshair ${crosshairs.length + 1}`,
              crosshair_color: 'Green',
              crosshair_outline: 'Off',
              crosshair_dot: 'Off',
              crosshair_inner: '1 / 4 / 2 / 2',
              crosshair_outer: 'Off',
              crosshair_thickness: '2',
              crosshair_code: ''
            };
            newCh.crosshair_code = getCrosshairExportCode({ ...newCh, crosshair_code: undefined });
            onChange([...crosshairs, newCh]);
            setActiveIndex(crosshairs.length);
          }}
          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <span>+</span> Add Another Crosshair
        </button>
      </div>

      <div className="space-y-4">
        {crosshairs.length === 0 ? (
          <div className="p-8 rounded-xl bg-black/40 border border-dashed border-zinc-800 text-center space-y-3">
            <p className="text-xs text-zinc-500 font-mono">No crosshair profiles configured.</p>
            <button
              type="button"
              onClick={() => {
                const newCh: ValorantCrosshairItem = {
                  id: String(Date.now()),
                  name: `Crosshair 1`,
                  crosshair_color: 'Green',
                  crosshair_outline: 'Off',
                  crosshair_dot: 'Off',
                  crosshair_inner: '1 / 4 / 2 / 2',
                  crosshair_outer: 'Off',
                  crosshair_thickness: '2',
                  crosshair_code: ''
                };
                newCh.crosshair_code = getCrosshairExportCode({ ...newCh, crosshair_code: undefined });
                onChange([newCh]);
                setActiveIndex(0);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>+</span> Add Crosshair Profile
            </button>
          </div>
        ) : (() => {
          const c = crosshairs[safeIndex] || crosshairs[0];
          const index = safeIndex;
          const parsed = parseCrosshairDetails(c);

          const updateParsed = (updater: (prev: ReturnType<typeof parseCrosshairDetails>) => void) => {
            const next = { ...parsed };
            updater(next);
            const newCode = encodeValorantCrosshair(next);
            const newFields = parseValorantCrosshairToFields(newCode);
            onChange(crosshairs.map((item, i) => i === index ? {
              ...item,
              ...newFields,
              crosshair_code: newCode
            } : item));
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
                    value={c.name}
                    onChange={e => {
                      const val = e.target.value;
                      onChange(crosshairs.map((item, i) => i === index ? { ...item, name: val } : item));
                    }}
                    placeholder="e.g. Primary Crosshair, Dot Crosshair"
                    className="h-8 bg-black/50 border border-zinc-800 rounded-md px-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500/40 w-full"
                  />
                </div>
                {crosshairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(crosshairs.filter((_, i) => i !== index));
                      setActiveIndex(Math.max(0, safeIndex - 1));
                    }}
                    className="text-zinc-500 hover:text-red-400 text-xs font-mono px-2.5 py-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove this crosshair"
                  >
                    ✕ Delete
                  </button>
                )}
              </div>

              {/* Live Preview canvas for the crosshair */}
              <div className="max-w-xs mx-auto">
                <CrosshairPreview settings={c} isValorant={true} />
              </div>

              {/* Crosshair Profile Code Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase">
                    Crosshair Profile Code (Export / Import String)
                  </label>
                </div>
                <input
                  type="text"
                  value={c.crosshair_code}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.trim().includes(';')) {
                      const auto = parseValorantCrosshairToFields(val.trim());
                      onChange(crosshairs.map((item, i) => i === index ? {
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
                      onChange(crosshairs.map((item, i) => i === index ? { ...item, crosshair_code: val } : item));
                    }
                  }}
                  placeholder="e.g. 0;P;c;5;o;1;d;1;z;3;f;0;0t;4;0l;2;0o;2;0a;1;0f;0;1b;0"
                  className="w-full h-8 bg-black/60 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono placeholder:text-zinc-700"
                />
              </div>

              {/* Primary / General */}
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
                      onChange={e => {
                        const newName = e.target.value;
                        const hex = COLOR_MAP[newName.toLowerCase()] || '#FFFFFF';
                        updateParsed(p => {
                          p.colorName = newName;
                          p.color = hex;
                        });
                      }}
                      className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                    >
                      <option value="White">White</option>
                      <option value="Green">Green</option>
                      <option value="Yellow Green">Yellow Green</option>
                      <option value="Green Yellow">Green Yellow</option>
                      <option value="Yellow">Yellow</option>
                      <option value="Cyan">Cyan</option>
                      <option value="Pink">Pink</option>
                      <option value="Red">Red</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Crosshair Color (Hex)</label>
                    <input
                      type="text"
                      value={parsed.color}
                      onChange={e => {
                        const hex = e.target.value;
                        updateParsed(p => {
                          p.color = hex;
                          p.colorName = 'Custom';
                        });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Outlines</label>
                    <select
                      value={parsed.hasOutline ? "On" : "Off"}
                      onChange={e => updateParsed(p => { p.hasOutline = e.target.value === "On"; })}
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
                      step="0.1"
                      min="0"
                      max="1"
                      value={parsed.outlineOpacity}
                      onChange={e => {
                        const op = parseFloat(e.target.value);
                        if (!isNaN(op)) updateParsed(p => { p.outlineOpacity = op; p.hasOutline = true; });
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
                      onChange={e => {
                        const thick = parseInt(e.target.value);
                        if (!isNaN(thick)) updateParsed(p => { p.outlineThickness = thick; p.hasOutline = true; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Center Dot</label>
                    <select
                      value={parsed.hasCenterDot ? "On" : "Off"}
                      onChange={e => updateParsed(p => { p.hasCenterDot = e.target.value === "On"; })}
                      className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                    >
                      <option value="Off">Off</option>
                      <option value="On">On</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Center Dot Size</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={parsed.dotSize}
                      onChange={e => {
                        const sz = parseInt(e.target.value);
                        if (!isNaN(sz)) updateParsed(p => { p.dotSize = sz; p.hasCenterDot = true; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Center Dot Opacity</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={parsed.dotOpacity}
                      onChange={e => {
                        const op = parseFloat(e.target.value);
                        if (!isNaN(op)) updateParsed(p => { p.dotOpacity = op; p.hasCenterDot = true; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Inner Lines */}
              <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                <p className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Inner Lines
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Show Inner Lines</label>
                    <select
                      value={parsed.innerShow ? "On" : "Off"}
                      onChange={e => updateParsed(p => { p.innerShow = e.target.value === "On"; })}
                      className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                    >
                      <option value="On">On</option>
                      <option value="Off">Off</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Opacity</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={parsed.innerOpacity}
                      onChange={e => {
                        const op = parseFloat(e.target.value);
                        if (!isNaN(op)) updateParsed(p => { p.innerOpacity = op; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Length</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={parsed.innerLength}
                      onChange={e => {
                        const len = parseFloat(e.target.value);
                        if (!isNaN(len)) updateParsed(p => {
                          p.innerLength = len;
                          if (!p.innerIndependent) p.innerVerticalLength = len;
                        });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Thickness</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={parsed.innerThickness}
                      onChange={e => {
                        const thick = parseFloat(e.target.value);
                        if (!isNaN(thick)) updateParsed(p => { p.innerThickness = thick; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Offset</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={parsed.innerOffset}
                      onChange={e => {
                        const off = parseFloat(e.target.value);
                        if (!isNaN(off)) updateParsed(p => { p.innerOffset = off; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Movement Error</label>
                    <select
                      value={parsed.innerMovementError ? "On" : "Off"}
                      onChange={e => updateParsed(p => { p.innerMovementError = e.target.value === "On"; })}
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
                      onChange={e => updateParsed(p => { p.innerFiringError = e.target.value === "On"; })}
                      className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                    >
                      <option value="Off">Off</option>
                      <option value="On">On</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Outer Lines */}
              <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                <p className="text-[11px] font-bold text-zinc-300 font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                  Outer Lines
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Show Outer Lines</label>
                    <select
                      value={parsed.outerShow ? "On" : "Off"}
                      onChange={e => updateParsed(p => { p.outerShow = e.target.value === "On"; })}
                      className="w-full h-8 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono cursor-pointer"
                    >
                      <option value="Off">Off</option>
                      <option value="On">On</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Opacity</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={parsed.outerOpacity}
                      onChange={e => {
                        const op = parseFloat(e.target.value);
                        if (!isNaN(op)) updateParsed(p => { p.outerOpacity = op; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Length</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={parsed.outerLength}
                      onChange={e => {
                        const len = parseFloat(e.target.value);
                        if (!isNaN(len)) updateParsed(p => {
                          p.outerLength = len;
                          if (!p.outerIndependent) p.outerVerticalLength = len;
                        });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Thickness</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={parsed.outerThickness}
                      onChange={e => {
                        const thick = parseFloat(e.target.value);
                        if (!isNaN(thick)) updateParsed(p => { p.outerThickness = thick; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Offset</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={parsed.outerOffset}
                      onChange={e => {
                        const off = parseFloat(e.target.value);
                        if (!isNaN(off)) updateParsed(p => { p.outerOffset = off; });
                      }}
                      className="w-full h-8 bg-black/40 border border-zinc-800 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-red-500/40 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Movement Error</label>
                    <select
                      value={parsed.outerMovementError ? "On" : "Off"}
                      onChange={e => updateParsed(p => { p.outerMovementError = e.target.value === "On"; })}
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
                      onChange={e => updateParsed(p => { p.outerFiringError = e.target.value === "On"; })}
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
        })()}
      </div>
    </div>
  );
}
