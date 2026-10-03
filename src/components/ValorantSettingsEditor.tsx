'use client';

import React from 'react';
import CrosshairPreview, {
  parseValorantCrosshairToFields,
  getCrosshairExportCode,
  parseCrosshairDetails,
  encodeValorantCrosshair,
  COLOR_MAP
} from '@/components/CrosshairPreview';

export type ValorantCrosshairItem = {
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
};

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
            className="text-[11px] font-mono text-red-400 hover:text-red-300 underline cursor-pointer"
          >
            Re-upload Config Folder
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
              <input
                type="text"
                value={valRole || ''}
                onChange={e => setValRole(e.target.value)}
                placeholder="e.g. Duelist, Initiator"
                className="w-full h-9 bg-black/40 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-red-500/40"
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
      <div className="border-t border-red-500/10 pt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-[11px] font-extrabold text-red-400/85 font-mono uppercase tracking-wider flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 12h.01" strokeLinecap="round" />
              </svg>
              Crosshair Configurations ({valCrosshairs.length})
            </h4>

            {valCrosshairs.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono font-medium">Select Profile:</span>
                <div className="relative">
                  <select
                    value={safeIndex}
                    onChange={(e) => setSelectedCrosshairIndex(Number(e.target.value))}
                    className="h-8 bg-[#0F0F15] border border-red-500/30 hover:border-red-500/50 rounded-lg pl-3 pr-8 text-xs font-mono text-white focus:outline-none focus:border-red-500/60 cursor-pointer appearance-none shadow-sm font-semibold"
                  >
                    {valCrosshairs.map((ch, idx) => (
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
              setSelectedCrosshairIndex(valCrosshairs.length);
            }}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>+</span> Add Another Crosshair
          </button>
        </div>

        <div className="space-y-4">
          {valCrosshairs.length === 0 ? (
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
                  setValCrosshairs([newCh]);
                  setSelectedCrosshairIndex(0);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>+</span> Add Crosshair Profile
              </button>
            </div>
          ) : (() => {
            const c = valCrosshairs[safeIndex] || valCrosshairs[0];
            const index = safeIndex;
            const parsed = parseCrosshairDetails(c);

            const updateParsed = (updater: (prev: ReturnType<typeof parseCrosshairDetails>) => void) => {
              const next = { ...parsed };
              updater(next);
              const newCode = encodeValorantCrosshair(next);
              const newFields = parseValorantCrosshairToFields(newCode);
              setValCrosshairs(prev => prev.map((item, i) => i === index ? {
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
                        setValCrosshairs(prev => prev.map((item, i) => i === index ? { ...item, name: val } : item));
                      }}
                      placeholder="e.g. Primary Crosshair, Dot Crosshair"
                      className="h-8 bg-black/50 border border-zinc-800 rounded-md px-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-500/40 w-full"
                    />
                  </div>
                  {valCrosshairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setValCrosshairs(prev => prev.filter((_, i) => i !== index));
                        setSelectedCrosshairIndex(prev => Math.max(0, prev - 1));
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
    </div>
  );
}
