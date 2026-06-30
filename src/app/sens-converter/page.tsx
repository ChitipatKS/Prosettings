'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Game = 'cs2' | 'valorant' | 'apex' | 'rainbow6';

const GAME_NAMES: Record<Game, string> = {
  cs2: 'Counter-Strike 2 / Global Offensive',
  valorant: 'VALORANT',
  apex: 'Apex Legends / Overwatch 2',
  rainbow6: 'Rainbow Six Siege',
};

// Conversion factors relative to CS2 sensitivity (yaw = 0.022)
// CS2 to VALORANT = cs * 0.314189
// CS2 to APEX = cs * 1.0 (same yaw 0.022)
// CS2 to R6S = cs * 3.818 // based on standard R6 slider (approx)
const CONVERSION_FACTORS: Record<Game, number> = {
  cs2: 1.0,
  valorant: 0.3142,
  apex: 1.0,
  rainbow6: 3.818,
};

export default function SensConverter() {
  const [fromGame, setFromGame] = useState<Game>('cs2');
  const [toGame, setToGame] = useState<Game>('valorant');
  const [inputValue, setInputValue] = useState<string>('1.0');
  const [convertedValue, setConvertedValue] = useState<number | null>(0.3142);
  const [dpi, setDpi] = useState<string>('800');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) {
      setConvertedValue(null);
      return;
    }

    // Convert to CS2 base first
    const csBase = val / CONVERSION_FACTORS[fromGame];
    // Convert to target game
    const targetVal = csBase * CONVERSION_FACTORS[toGame];
    
    // Round to 3 decimal places
    setConvertedValue(Math.round(targetVal * 1000) / 1000);
  }, [inputValue, fromGame, toGame]);

  const handleCopy = () => {
    if (convertedValue !== null) {
      navigator.clipboard.writeText(convertedValue.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const calculateEdpi = () => {
    const sens = parseFloat(inputValue);
    const dpiNum = parseInt(dpi, 10);
    if (isNaN(sens) || isNaN(dpiNum)) return null;
    return Math.round(sens * dpiNum);
  };

  const calculateTargetEdpi = () => {
    if (convertedValue === null) return null;
    const dpiNum = parseInt(dpi, 10);
    if (isNaN(dpiNum)) return null;
    return Math.round(convertedValue * dpiNum);
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-8 py-16 flex flex-col justify-center space-y-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <Link 
          href="/" 
          className="text-xs font-bold text-zinc-500 hover:text-white transition-colors duration-200 font-mono tracking-wider flex items-center gap-1 justify-center"
        >
          &lt; BACK TO HOME
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
          Mouse <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">Sensitivity Converter</span>
        </h1>
        <p className="text-sm text-zinc-400">
          Convert your in-game sensitivity across popular esports games with exact accuracy.
        </p>
      </div>

      {/* Calculator Card */}
      <div className="bg-card backdrop-blur-[8px] border border-border-custom p-6 sm:p-10 rounded-2xl shadow-2xl relative overflow-visible">
        
        {/* Glow ambient decoration */}
        <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-accent/5 blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-accent/5 blur-[80px] pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Left Column: From */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <label className="block text-xs font-bold font-mono uppercase text-accent tracking-wider">
                Source Game
              </label>
              <select
                value={fromGame}
                onChange={(e) => setFromGame(e.target.value as Game)}
                className="w-full h-12 bg-black/40 border border-border-custom rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-accent/60 transition-all duration-200 cursor-pointer"
              >
                {Object.entries(GAME_NAMES).map(([key, name]) => (
                  <option key={key} value={key} className="bg-[#12121A] text-white">
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold font-mono uppercase text-zinc-400 tracking-wider">
                Sensitivity Value
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter sensitivity..."
                className="w-full h-12 bg-black/40 border border-border-custom rounded-xl px-4 text-sm text-white focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15 transition-all duration-200"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold font-mono uppercase text-zinc-400 tracking-wider">
                Mouse DPI (Optional for eDPI)
              </label>
              <input
                type="number"
                step="50"
                min="100"
                value={dpi}
                onChange={(e) => setDpi(e.target.value)}
                placeholder="e.g. 800"
                className="w-full h-12 bg-black/40 border border-border-custom rounded-xl px-4 text-sm text-white focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15 transition-all duration-200"
              />
            </div>

            {calculateEdpi() !== null && (
              <div className="bg-[#12121A]/80 border border-border-custom/50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-zinc-500 font-mono block">SOURCE eDPI</span>
                <span className="text-sm font-bold text-zinc-300 font-display">{calculateEdpi()}</span>
              </div>
            )}
          </div>

          {/* Divider/Arrow (Hidden on mobile, flexed on desktop) */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#12121A] border border-border-custom rounded-full h-10 w-10 items-center justify-center text-accent z-10">
            <svg className="h-4 w-4 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>

          {/* Right Column: To */}
          <div className="space-y-6 flex flex-col justify-between border-t border-white/5 md:border-t-0 md:border-l md:border-white/5 pt-8 md:pt-0 md:pl-8">
            <div className="space-y-4">
              <label className="block text-xs font-bold font-mono uppercase text-accent tracking-wider">
                Target Game
              </label>
              <select
                value={toGame}
                onChange={(e) => setToGame(e.target.value as Game)}
                className="w-full h-12 bg-black/40 border border-border-custom rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-accent/60 transition-all duration-200 cursor-pointer"
              >
                {Object.entries(GAME_NAMES).map(([key, name]) => (
                  <option key={key} value={key} className="bg-[#12121A] text-white">
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-center min-h-[120px]">
              <span className="block text-xs font-bold font-mono uppercase text-zinc-500 tracking-wider text-center">
                Converted Sensitivity
              </span>
              
              {convertedValue !== null ? (
                <div className="flex flex-col items-center justify-center space-y-2 mt-2">
                  <div className="text-4xl font-extrabold text-white tracking-tight font-display">
                    {convertedValue}
                  </div>
                  
                  <button
                    onClick={handleCopy}
                    className={`h-8 px-4 rounded-xl text-[10px] font-bold uppercase font-mono tracking-wider flex items-center gap-1.5 transition-all duration-200 ${
                      copied 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-white/5 hover:bg-white/10 text-[#FAFAFA] border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        COPIED!
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        COPY VALUE
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-zinc-500 text-xs font-mono text-center mt-4">
                  Please enter a valid sensitivity
                </div>
              )}
            </div>

            {calculateTargetEdpi() !== null && (
              <div className="bg-[#12121A]/80 border border-border-custom/50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-zinc-500 font-mono block">TARGET eDPI</span>
                <span className="text-sm font-bold text-zinc-300 font-display">{calculateTargetEdpi()}</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Informational Box */}
      <div className="bg-black/20 border border-border-custom rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
          <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How mouse sensitivity is calculated
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Most games use different yaw values or scaling models to determine your camera rotation speed. 
          For example, <strong>CS2</strong> and <strong>VALORANT</strong> use a 3.18x difference factor: moving your mouse 
          the exact same distance in VALORANT requires ~0.314x the sensitivity number used in CS2/CS:GO. 
          By standardizing these calculations, you can preserve muscle memory across all titles.
        </p>
      </div>

    </div>
  );
}
