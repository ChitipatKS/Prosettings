'use client';

import React, { useState, useRef, useEffect } from 'react';
import { parseValorantConfigFromDrop, ParsedValorantSettings } from '@/lib/valorantConfigParser';
import { renderKeyBadge } from '@/components/PlayerProfileClient';

interface ValorantConfigUploaderProps {
  currentDpi?: string;
  currentHz?: string;
  onApplySettings: (settings: ParsedValorantSettings, dpi: string, hz: string) => void;
  onClose?: () => void;
}

export default function ValorantConfigUploader({
  currentDpi = '800',
  currentHz = '1000',
  onApplySettings,
  onClose,
}: ValorantConfigUploaderProps) {
  const [dpi, setDpi] = useState(currentDpi || '800');
  const [pollingRate, setPollingRate] = useState(currentHz || '1000');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedValorantSettings | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'video' | 'graphics' | 'controls' | 'minimap' | 'crosshair'>('summary');

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    // Prevent default browser behavior (navigating to file/folder) when dragging and dropping anywhere
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && ((e.dataTransfer.items && e.dataTransfer.items.length > 0) || (e.dataTransfer.files && e.dataTransfer.files.length > 0))) {
        await processDropOrFiles(e.dataTransfer, null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [onClose]);

  const configPath = '%LOCALAPPDATA%\\VALORANT\\Saved';

  const copyPathToClipboard = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(configPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processDropOrFiles = async (dataTransfer?: DataTransfer | null, fileList?: FileList | null) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await parseValorantConfigFromDrop(
        dataTransfer ? dataTransfer.items : null,
        fileList
      );
      setParsedData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not parse config files. Please make sure to drag the "Config" folder.');
    } finally {
      setIsProcessing(false);
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await processDropOrFiles(e.dataTransfer, null);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processDropOrFiles(null, e.target.files);
    }
  };

  const handleConfirmApply = () => {
    if (parsedData) {
      onApplySettings(parsedData, dpi, pollingRate);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#12121A] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Top Header / Breadcrumb */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Upload</span>
          <span>&gt;</span>
          <span className="text-white font-bold flex items-center gap-1.5">
            <img src="/images/valorant-logo.png" alt="VALORANT" className="w-3.5 h-3.5 rounded object-cover" />
            VALORANT Config
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-lg font-bold p-1 cursor-pointer transition-colors"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      {/* 3-Step Instructions matching Image 2 */}
      <div className="space-y-2.5 text-xs text-zinc-300 font-sans leading-relaxed">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-mono font-bold">1.</span>
          <span>Press</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white font-mono text-[11px] font-bold shadow-sm">
            ⊞ Win
          </span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white font-mono text-[11px] font-bold shadow-sm">
            R
          </span>
          <span>on your keyboard</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-zinc-500 font-mono font-bold">2.</span>
          <span>Paste</span>
          <span
            onClick={copyPathToClipboard}
            className="px-2.5 py-1 rounded bg-[#2D1B4E]/80 border border-purple-500/40 text-purple-300 font-mono text-[11px] font-semibold cursor-pointer hover:bg-purple-900/60 transition-colors flex items-center gap-1.5 shadow-sm"
            title="Click to copy path"
          >
            <span>{configPath}</span>
            <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copiedPath && <span className="text-[10px] text-green-400 font-bold">Copied!</span>}
          </span>
          <span>and press &quot;OK&quot; / &quot;Enter&quot;</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-mono font-bold">3.</span>
          <span>Drag and drop the</span>
          <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-600/40 text-purple-300 font-mono text-[11px] font-bold flex items-center gap-1">
            📁 Config
          </span>
          <span>folder anywhere on the box below</span>
        </div>
      </div>

      {/* Dashed Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => folderInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : parsedData
            ? 'border-green-500/50 bg-green-500/5 hover:border-green-500/70'
            : 'border-zinc-700/80 hover:border-zinc-500 bg-black/40 hover:bg-black/60'
        }`}
      >
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore: webkitdirectory and directory are non-standard attributes supported by Chromium/Firefox
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={filesInputRef}
          type="file"
          multiple
          accept=".ini,.json,.zip"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="space-y-2 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
            <p className="text-xs font-mono text-zinc-300">Reading and analyzing VALORANT Config...</p>
          </div>
        ) : parsedData ? (
          <div className="space-y-2 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl font-bold border border-green-500/30">
              ✓
            </div>
            <p className="text-sm font-bold text-white font-sans">
              VALORANT Config Imported Successfully!
            </p>
            <p className="text-xs font-mono text-zinc-400">
              Active Crosshair: <span className="text-accent font-bold">{parsedData.activeCrosshairProfileName}</span> • Sens: <span className="text-accent font-bold">{parsedData.mouseSensitivity}</span> • Res: <span className="text-accent font-bold">{parsedData.resolution}</span> • Highlight: <span className="text-accent font-bold">{parsedData.enemyHighlightColor}</span>
            </p>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 underline">
              (Click to upload a different Config folder or .zip)
            </span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-400 font-sans">
              <span>Drag and drop the</span>
              <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-600/40 text-purple-300 font-mono text-[11px] font-bold flex items-center gap-1">
                📁 Config
              </span>
              <span>folder, any folder from PC, or</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 font-mono text-[11px] font-bold">
                .zip
              </span>
              <span>here</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                📁 Browse Folder
              </button>
              <span className="text-xs text-zinc-500 font-mono">or</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  filesInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 text-zinc-300 text-xs font-mono font-medium transition-colors cursor-pointer"
              >
                📄 Select Files (.ini / .zip)
              </button>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono p-4 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="whitespace-pre-line leading-relaxed">{error}</span>
        </div>
      )}

      {/* Manual Hardware Inputs (DPI & Polling rate) matching Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            DPI
          </label>
          <input
            type="number"
            value={dpi}
            onChange={(e) => setDpi(e.target.value)}
            placeholder="e.g. 800"
            className="w-full h-10 bg-black/40 border border-zinc-800 rounded-xl px-4 text-xs font-mono text-white focus:outline-none focus:border-accent transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Polling rate
          </label>
          <select
            value={pollingRate}
            onChange={(e) => setPollingRate(e.target.value)}
            className="w-full h-10 bg-[#0F0F15] border border-zinc-800 rounded-xl px-4 text-xs font-mono text-white focus:outline-none focus:border-accent transition-all cursor-pointer"
          >
            <option value="125">125 Hz</option>
            <option value="250">250 Hz</option>
            <option value="500">500 Hz</option>
            <option value="1000">1000 Hz</option>
            <option value="2000">2000 Hz</option>
            <option value="4000">4000 Hz</option>
            <option value="8000">8000 Hz</option>
          </select>
        </div>
      </div>

      {/* Parsed Results Preview & Inspector Tabs */}
      {parsedData && (
        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-sans flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Detected Settings Preview
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              eDPI: <strong className="text-accent font-mono">{((parseFloat(dpi) || 800) * parsedData.mouseSensitivity).toFixed(2)}</strong>
            </span>
          </div>

          {/* Account Selector if multiple profiles/accounts found */}
          {parsedData.availableAccounts && parsedData.availableAccounts.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-accent shrink-0">Account:</span>
                <select
                  value={parsedData.accountFolder}
                  onChange={(e) => {
                    const chosen = parsedData.availableAccounts?.find(a => a.accountId === e.target.value);
                    if (chosen) {
                      setParsedData({
                        ...chosen.settings,
                        availableAccounts: parsedData.availableAccounts
                      });
                    }
                  }}
                  className="w-full max-w-md bg-black/60 border border-zinc-700 hover:border-zinc-500 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-accent cursor-pointer truncate"
                >
                  {parsedData.availableAccounts.map(acc => (
                    <option key={acc.accountId} value={acc.accountId}>
                      {acc.accountId} ({acc.crosshairCount} Crosshairs • Active: &quot;{acc.activeCrosshairProfileName}&quot;)
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                {parsedData.availableAccounts.length} accounts found
              </span>
            </div>
          )}

          {/* Navigation Pills for Settings Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-black/40 border border-zinc-800/80 rounded-xl">
            {(['summary', 'video', 'graphics', 'controls', 'minimap', 'crosshair'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-accent text-accent-fg shadow'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'summary' && 'Quick Overview'}
                {tab === 'video' && 'Video - General'}
                {tab === 'graphics' && 'Graphics Quality'}
                {tab === 'controls' && 'Controls / Binds'}
                {tab === 'minimap' && 'Minimap'}
                {tab === 'crosshair' && 'Crosshairs'}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="bg-black/50 border border-zinc-850 rounded-xl p-4 text-xs font-sans space-y-3 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            {activeTab === 'summary' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-[#12121A] border border-zinc-800 rounded-lg">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase">In-Game Sensitivity</div>
                  <div className="text-sm font-bold text-white font-mono">{parsedData.mouseSensitivity}</div>
                </div>
                <div className="p-2.5 bg-[#12121A] border border-zinc-800 rounded-lg">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase">Scoped Sens</div>
                  <div className="text-sm font-bold text-white font-mono">{parsedData.scopedSens}</div>
                </div>
                <div className="p-2.5 bg-[#12121A] border border-zinc-800 rounded-lg">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase">Resolution</div>
                  <div className="text-sm font-bold text-white font-mono">{parsedData.resolution} ({parsedData.aspectRatio})</div>
                </div>
                <div className="p-2.5 bg-[#12121A] border border-zinc-800 rounded-lg">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase">Display Mode</div>
                  <div className="text-sm font-bold text-white font-mono">{parsedData.displayMode}</div>
                </div>
                <div className="p-2.5 bg-[#12121A] border border-zinc-800 rounded-lg">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase">NVIDIA Reflex</div>
                  <div className="text-sm font-bold text-white font-mono">{parsedData.nvidiaReflex}</div>
                </div>
                <div className="p-2.5 bg-[#12121A] border border-zinc-800 rounded-lg">
                  <div className="text-[9px] text-zinc-500 font-mono uppercase">Active Crosshair</div>
                  <div className="text-sm font-bold text-accent font-sans truncate">{parsedData.activeCrosshairProfileName}</div>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-1.5 divide-y divide-zinc-900 font-mono">
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Display Mode</span><span className="text-white font-bold">{parsedData.displayMode}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Resolution</span><span className="text-white font-bold">{parsedData.resolution}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Aspect Ratio</span><span className="text-white font-bold">{parsedData.aspectRatio}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">VSync</span><span className="text-white font-bold">{parsedData.vsync}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">FPS Limit</span><span className="text-white font-bold">{parsedData.frameRateLimit}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">NVIDIA Reflex</span><span className="text-white font-bold">{parsedData.nvidiaReflex}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Enemy Highlight</span><span className="text-white font-bold">{parsedData.enemyHighlightColor}</span></div>
              </div>
            )}

            {activeTab === 'graphics' && (
              <div className="space-y-1.5 divide-y divide-zinc-900 font-mono">
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Material Quality</span><span className="text-white font-bold">{parsedData.materialQuality}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Texture Quality</span><span className="text-white font-bold">{parsedData.textureQuality}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Detail Quality</span><span className="text-white font-bold">{parsedData.detailQuality}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">UI Quality</span><span className="text-white font-bold">{parsedData.uiQuality}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Vignette</span><span className="text-white font-bold">{parsedData.vignette}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Anti-Aliasing</span><span className="text-white font-bold">{parsedData.antiAliasing}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Anisotropic Filtering</span><span className="text-white font-bold">{parsedData.anisotropicFiltering}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Bloom</span><span className="text-white font-bold">{parsedData.bloom}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Distortion</span><span className="text-white font-bold">{parsedData.distortion}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Cast Shadows</span><span className="text-white font-bold">{parsedData.castShadows}</span></div>
              </div>
            )}

            {activeTab === 'controls' && (
              <div className="space-y-3 font-sans">
                {Object.entries(parsedData.keybinds).map(([category, binds]) => (
                  <div key={category} className="space-y-1">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">{category}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Object.entries(binds || {}).map(([action, keyName]) => (
                        <div key={action} className="flex items-center justify-between p-1.5 rounded bg-zinc-900/60 border border-zinc-800">
                          <span className="text-[11px] text-zinc-400 font-sans">{action}</span>
                          {renderKeyBadge(action, keyName)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'minimap' && (
              <div className="space-y-1.5 divide-y divide-zinc-900 font-mono">
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Rotate</span><span className="text-white font-bold">{parsedData.minimapRotate}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Fixed Orientation</span><span className="text-white font-bold">{parsedData.minimapFixedOrientation}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Keep Player Centered</span><span className="text-white font-bold">{parsedData.minimapKeepCentered}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Minimap Size</span><span className="text-white font-bold">{parsedData.minimapSize}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Minimap Zoom</span><span className="text-white font-bold">{parsedData.minimapZoom}</span></div>
                <div className="flex justify-between py-1"><span className="text-zinc-400 font-sans">Minimap Vision Cones</span><span className="text-white font-bold">{parsedData.minimapVisionCones}</span></div>
              </div>
            )}

            {activeTab === 'crosshair' && (
              <div className="space-y-3 font-sans">
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent font-sans">
                      Active: {parsedData.activeCrosshairProfileName}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {parsedData.crosshairProfiles.length} profiles saved
                    </span>
                  </div>
                  {parsedData.crosshairCode && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={parsedData.crosshairCode}
                        className="flex-1 h-8 bg-black/60 border border-zinc-800 rounded-lg px-2.5 text-[11px] font-mono text-zinc-300"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(parsedData.crosshairCode)}
                        className="px-3 h-8 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>

                {parsedData.crosshairProfiles.length > 1 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Other Profiles in Config:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedData.crosshairProfiles.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setParsedData({
                              ...parsedData,
                              activeCrosshairProfileName: p.name,
                              crosshairCode: p.code
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                            parsedData.activeCrosshairProfileName === p.name
                              ? 'bg-accent/20 text-accent border-accent/40 font-bold'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button: Apply to Profile */}
          <div className="flex justify-end gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirmApply}
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-amber-400 text-black font-mono font-bold text-xs shadow-lg hover:shadow-accent/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Apply to Profile</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
