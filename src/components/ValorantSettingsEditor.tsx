'use client';

import React from 'react';
import ValorantCrosshairsEditor, { ValorantCrosshairItem } from '@/components/ValorantCrosshairsEditor';
import ValorantKeybindsEditor from '@/components/ValorantKeybindsEditor';
import ValorantRoleSelect from '@/components/ValorantRoleSelect';

export type { ValorantCrosshairItem };

export type ValorantSettingsEditorProps = {
  // Basic Settings
  valRole?: string;
  setValRole?: (val: string) => void;
  valDpi: string;
  setValDpi: (val: string) => void;
  valSens: string;
  setValSens: (val: string) => void;
  valHz: string;
  setValHz: (val: string) => void;
  valScopedSens: string;
  setValScopedSens: (val: string) => void;
  valRes: string;
  setValRes: (val: string) => void;
  valAspect: string;
  setValAspect: (val: string) => void;
  valEnemyHighlight: string;
  setValEnemyHighlight: (val: string) => void;
  valRapidTrigger?: string;
  setValRapidTrigger?: (val: string) => void;

  // Video & Graphics Quality
  valDisplayMode: string;
  setValDisplayMode: (val: string) => void;
  valNvidiaReflex: string;
  setValNvidiaReflex: (val: string) => void;
  valMultithreaded: string;
  setValMultithreaded: (val: string) => void;
  valMaterialQuality: string;
  setValMaterialQuality: (val: string) => void;
  valTextureQuality: string;
  setValTextureQuality: (val: string) => void;
  valDetailQuality: string;
  setValDetailQuality: (val: string) => void;
  valUiQuality: string;
  setValUiQuality: (val: string) => void;
  valVignette: string;
  setValVignette: (val: string) => void;
  valVsync: string;
  setValVsync: (val: string) => void;
  valAntiAliasing: string;
  setValAntiAliasing: (val: string) => void;
  valAnisotropic: string;
  setValAnisotropic: (val: string) => void;
  valImproveClarity: string;
  setValImproveClarity: (val: string) => void;
  valBloom: string;
  setValBloom: (val: string) => void;
  valDistortion: string;
  setValDistortion: (val: string) => void;
  valCastShadows: string;
  setValCastShadows: (val: string) => void;

  // Minimap Settings
  valMapRotate: string;
  setValMapRotate: (val: string) => void;
  valMapFixedOrientation: string;
  setValMapFixedOrientation: (val: string) => void;
  valMapKeepCentered: string;
  setValMapKeepCentered: (val: string) => void;
  valMapMinimapSize: string;
  setValMapMinimapSize: (val: string) => void;
  valMapMinimapZoom: string;
  setValMapMinimapZoom: (val: string) => void;
  valMapVisionCones: string;
  setValMapVisionCones: (val: string) => void;

  // Crosshairs
  valCrosshairs: ValorantCrosshairItem[];
  setValCrosshairs: React.Dispatch<React.SetStateAction<ValorantCrosshairItem[]>>;

  // Controls / Keybinds
  valKeybinds?: Record<string, Record<string, string>>;
  setValKeybinds?: (keybinds: Record<string, Record<string, string>>) => void;

  // Extras
  onReuploadConfig?: () => void;
  configLinkedBadge?: React.ReactNode;
};

export default function ValorantSettingsEditor({
  valRole,
  setValRole,
  valDpi,
  setValDpi,
  valSens,
  setValSens,
  valHz,
  setValHz,
  valScopedSens,
  setValScopedSens,
  valRes,
  setValRes,
  valAspect,
  setValAspect,
  valEnemyHighlight,
  setValEnemyHighlight,
  valRapidTrigger,
  setValRapidTrigger,

  valDisplayMode,
  setValDisplayMode,
  valNvidiaReflex,
  setValNvidiaReflex,
  valMultithreaded,
  setValMultithreaded,
  valMaterialQuality,
  setValMaterialQuality,
  valTextureQuality,
  setValTextureQuality,
  valDetailQuality,
  setValDetailQuality,
  valUiQuality,
  setValUiQuality,
  valVignette,
  setValVignette,
  valVsync,
  setValVsync,
  valAntiAliasing,
  setValAntiAliasing,
  valAnisotropic,
  setValAnisotropic,
  valImproveClarity,
  setValImproveClarity,
  valBloom,
  setValBloom,
  valDistortion,
  setValDistortion,
  valCastShadows,
  setValCastShadows,

  valMapRotate,
  setValMapRotate,
  valMapFixedOrientation,
  setValMapFixedOrientation,
  valMapKeepCentered,
  setValMapKeepCentered,
  valMapMinimapSize,
  setValMapMinimapSize,
  valMapMinimapZoom,
  setValMapMinimapZoom,
  valMapVisionCones,
  setValMapVisionCones,

  valCrosshairs,
  setValCrosshairs,

  valKeybinds,
  setValKeybinds,

  onReuploadConfig,
  configLinkedBadge
}: ValorantSettingsEditorProps) {
  const eDpi = ((parseFloat(valDpi) || 0) * (parseFloat(valSens) || 0)).toFixed(2);
  const [selectedCrosshairIndex, setSelectedCrosshairIndex] = React.useState<number>(0);
  const safeIndex = valCrosshairs.length > 0 ? Math.min(Math.max(0, selectedCrosshairIndex), valCrosshairs.length - 1) : 0;

  return (
    <div className="border border-red-500/20 bg-red-500/[0.01] p-6 rounded-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/20 pb-3">
        <h3 className="text-xs font-bold text-red-400 font-mono flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
          VALORANT SETTINGS CONFIGURATION
        </h3>
        {onReuploadConfig && (
          <button
            type="button"
            onClick={onReuploadConfig}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold font-sans transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Upload VALORANT Config</span>
          </button>
        )}
      </div>

      {/* Linked badge */}
      {configLinkedBadge}

      {/* 1. Basic Mouse & Display Settings */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {setValRole && (
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">In-Game Role</label>
              <ValorantRoleSelect
                value={valRole}
                onChange={setValRole}
                placeholder="Select Role (Optional)"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Mouse DPI</label>
            <input
              type="number"
              value={valDpi}
              onChange={e => setValDpi(e.target.value)}
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Sensitivity</label>
            <input
              type="number"
              step="0.001"
              value={valSens}
              onChange={e => setValSens(e.target.value)}
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Mouse Hz</label>
            <input
              type="number"
              value={valHz}
              onChange={e => setValHz(e.target.value)}
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Scoped Sens</label>
            <input
              type="number"
              step="0.1"
              value={valScopedSens}
              onChange={e => setValScopedSens(e.target.value)}
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Resolution</label>
            <input
              type="text"
              value={valRes}
              onChange={e => setValRes(e.target.value)}
              placeholder="e.g. 1920x1080"
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Aspect Ratio</label>
            <input
              type="text"
              value={valAspect}
              onChange={e => setValAspect(e.target.value)}
              placeholder="e.g. 16:9"
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Enemy Highlight Color</label>
            <select
              value={valEnemyHighlight}
              onChange={e => setValEnemyHighlight(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40 cursor-pointer"
            >
              <option value="Red (Default)">Red (Default)</option>
              <option value="Purple">Purple</option>
              <option value="Yellow (Deuteranopia)">Yellow (Deuteranopia)</option>
              <option value="Yellow (Protanopia)">Yellow (Protanopia)</option>
            </select>
          </div>
        </div>

        {setValRapidTrigger && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-500 font-mono font-semibold uppercase">Rapid Trigger / Actuation Point</label>
              <input
                type="text"
                value={valRapidTrigger || ''}
                onChange={e => setValRapidTrigger(e.target.value)}
                placeholder="e.g. 0.1mm"
                className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40"
              />
            </div>
          </div>
        )}

        <div className="text-[10px] text-zinc-500 font-mono">
          Calculated VALORANT eDPI: <span className="text-red-400 font-bold">{eDpi}</span>
        </div>
      </div>

      {/* 2. VIDEO & GRAPHICS QUALITY SETTINGS */}
      <div className="border-t border-red-500/10 pt-5 space-y-4">
        <h4 className="text-[11px] font-extrabold text-red-400/85 font-mono uppercase tracking-wider">
          Video & Graphics Quality Settings
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Display Mode</label>
            <select
              value={valDisplayMode}
              onChange={e => setValDisplayMode(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="Fullscreen">Fullscreen</option>
              <option value="Windowed Fullscreen">Windowed Fullscreen</option>
              <option value="Windowed">Windowed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">NVIDIA Reflex</label>
            <select
              value={valNvidiaReflex}
              onChange={e => setValNvidiaReflex(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On + Boost">On + Boost</option>
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Multi-Threaded</label>
            <select
              value={valMultithreaded}
              onChange={e => setValMultithreaded(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Material Quality</label>
            <select
              value={valMaterialQuality}
              onChange={e => setValMaterialQuality(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Texture Quality</label>
            <select
              value={valTextureQuality}
              onChange={e => setValTextureQuality(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Detail Quality</label>
            <select
              value={valDetailQuality}
              onChange={e => setValDetailQuality(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">UI Quality</label>
            <select
              value={valUiQuality}
              onChange={e => setValUiQuality(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Vignette</label>
            <select
              value={valVignette}
              onChange={e => setValVignette(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">VSync</label>
            <select
              value={valVsync}
              onChange={e => setValVsync(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Anti-Aliasing</label>
            <select
              value={valAntiAliasing}
              onChange={e => setValAntiAliasing(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="MSAA 4x">MSAA 4x</option>
              <option value="MSAA 2x">MSAA 2x</option>
              <option value="FXAA">FXAA</option>
              <option value="None">None</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Anisotropic</label>
            <select
              value={valAnisotropic}
              onChange={e => setValAnisotropic(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="16x">16x</option>
              <option value="8x">8x</option>
              <option value="4x">4x</option>
              <option value="2x">2x</option>
              <option value="1x">1x</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Improve Clarity</label>
            <select
              value={valImproveClarity}
              onChange={e => setValImproveClarity(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Bloom</label>
            <select
              value={valBloom}
              onChange={e => setValBloom(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Distortion</label>
            <select
              value={valDistortion}
              onChange={e => setValDistortion(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Cast Shadows</label>
            <select
              value={valCastShadows}
              onChange={e => setValCastShadows(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. MINIMAP & MAP SETTINGS */}
      <div className="border-t border-red-500/10 pt-5 space-y-4">
        <h4 className="text-[11px] font-extrabold text-red-400/85 font-mono uppercase tracking-wider">
          Minimap & Map Settings
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Rotate</label>
            <select
              value={valMapRotate}
              onChange={e => setValMapRotate(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="Rotate">Rotate</option>
              <option value="Fixed">Fixed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Fixed Orientation</label>
            <select
              value={valMapFixedOrientation}
              onChange={e => setValMapFixedOrientation(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="Always the same">Always the same</option>
              <option value="Based on side">Based on side</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Keep Player Centered</label>
            <select
              value={valMapKeepCentered}
              onChange={e => setValMapKeepCentered(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Minimap Size</label>
            <input
              type="text"
              value={valMapMinimapSize}
              onChange={e => setValMapMinimapSize(e.target.value)}
              placeholder="e.g. 1.1"
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Minimap Zoom</label>
            <input
              type="text"
              value={valMapMinimapZoom}
              onChange={e => setValMapMinimapZoom(e.target.value)}
              placeholder="e.g. 0.9"
              className="w-full h-9 bg-black/40 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-500 font-mono uppercase">Minimap Vision Cones</label>
            <select
              value={valMapVisionCones}
              onChange={e => setValMapVisionCones(e.target.value)}
              className="w-full h-9 bg-[#0F0F15] border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono cursor-pointer"
            >
              <option value="On">On</option>
              <option value="Off">Off</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. CROSSHAIR CONFIGURATIONS (Multiple Crosshairs) */}
      <ValorantCrosshairsEditor
        crosshairs={valCrosshairs}
        onChange={setValCrosshairs}
        selectedIndex={selectedCrosshairIndex}
        onSelectIndex={setSelectedCrosshairIndex}
      />

      {/* 4. Controls / Keybinds Editor */}
      {valKeybinds && setValKeybinds && (
        <div className="pt-5 border-t border-red-500/20">
          <ValorantKeybindsEditor
            keybinds={valKeybinds}
            onChange={setValKeybinds}
          />
        </div>
      )}
    </div>
  );
}
