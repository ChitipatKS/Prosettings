'use client';

import React, { useState } from 'react';

export type CrosshairSettings = {
  name?: string | null;
  crosshair_code?: string | null;
  crosshair_color?: string | null;
  crosshair_dot?: string | null;
  crosshair_outline?: string | null;
  crosshair_inner?: string | null;
  crosshair_outer?: string | null;
  crosshair_thickness?: string | null;
};

type Props = {
  settings?: CrosshairSettings | null;
  crosshairs?: CrosshairSettings[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  isValorant?: boolean;
};

// Map color names to CSS colors
const COLOR_MAP: Record<string, string> = {
  'cyan': '#00FFFF',
  'green': '#00FF44',
  'white': '#FFFFFF',
  'yellow': '#FFE600',
  'red': '#FF2222',
  'pink': '#FF3399',
  'magenta': '#FF00FF',
  'blue': '#00A2FF',
  'black': '#000000',
  'custom': '#FFFFFF'
};

// Valorant Color code mapping
const VAL_COLOR_INDEX: Record<string, { hex: string; name: string }> = {
  '0': { hex: '#FFFFFF', name: 'White' },
  '1': { hex: '#00FF44', name: 'Green' },
  '2': { hex: '#88FF00', name: 'Yellow Green' },
  '3': { hex: '#CCFF00', name: 'Green Yellow' },
  '4': { hex: '#FFE600', name: 'Yellow' },
  '5': { hex: '#00FFFF', name: 'Cyan' },
  '6': { hex: '#FF3399', name: 'Pink' },
  '7': { hex: '#FF2222', name: 'Red' },
};

/**
 * Token-based parser for Valorant crosshair string
 */
export function parseValorantCodeMap(code: string): Record<string, string> {
  const map: Record<string, string> = {};
  const tokens = code.split(';').map(t => t.trim()).filter(Boolean);
  
  for (let i = 0; i < tokens.length - 1; i++) {
    const k = tokens[i];
    const v = tokens[i + 1];
    if (/^(c|u|h|d|z|o|t|a|f|s|0b|0t|0l|0v|0g|0o|0a|0m|0f|0s|0e|1b|1t|1l|1v|1g|1o|1a|1m|1f|1s|1e)$/.test(k)) {
      map[k] = v;
    }
  }
  return map;
}

/**
 * Parses crosshair settings (from code string OR individual fields)
 * into unified numerical and visual parameters.
 */
export function parseCrosshairDetails(settings?: CrosshairSettings | null) {
  let color = '#FFFFFF';
  let colorName = 'White';
  let hasCenterDot = false;
  let dotSize = 2;
  let hasOutline = false;
  let outlineThickness = 1;
  let outlineOpacity = 1;
  let innerShow = true;
  let innerLength = 4;
  let innerThickness = 2;
  let innerOffset = 2;
  let innerOpacity = 1;
  let outerShow = false;
  let outerLength = 0;
  let outerThickness = 0;
  let outerOffset = 0;
  let outerOpacity = 1;
  let innerMovementError = false;
  let innerFiringError = false;
  let outerMovementError = false;
  let outerFiringError = false;

  const rawCode = (settings?.crosshair_code || '').trim();

  if (rawCode && rawCode.includes(';')) {
    const valMap = parseValorantCodeMap(rawCode);

    // Color
    if (valMap['c'] !== undefined) {
      const valObj = VAL_COLOR_INDEX[valMap['c']];
      if (valObj) {
        color = valObj.hex;
        colorName = valObj.name;
      }
    } else if (valMap['u']) {
      const hex = valMap['u'].startsWith('#') ? valMap['u'] : `#${valMap['u']}`;
      color = hex.length === 9 ? hex.substring(0, 7) : hex;
      colorName = 'Custom';
    } else {
      color = '#FFFFFF';
      colorName = 'White';
    }

    // Center Dot
    if (valMap['d'] !== undefined) {
      hasCenterDot = valMap['d'] === '1';
    }
    if (valMap['z'] !== undefined) {
      dotSize = parseFloat(valMap['z']) || 2;
    }

    // Outline
    if (valMap['h'] !== undefined) {
      hasOutline = valMap['h'] === '0';
    }
    if (valMap['o'] !== undefined) {
      const oVal = parseFloat(valMap['o']);
      if (!isNaN(oVal)) {
        hasOutline = oVal > 0;
        outlineOpacity = oVal;
      }
    }
    if (valMap['t'] !== undefined) {
      outlineThickness = parseFloat(valMap['t']) || 1;
    }
    if (valMap['a'] !== undefined) {
      outlineOpacity = parseFloat(valMap['a']) || outlineOpacity;
    }

    // Inner lines
    if (valMap['0b'] !== undefined) {
      innerShow = valMap['0b'] === '1';
    } else {
      innerShow = true;
    }
    if (valMap['0l'] !== undefined) {
      innerLength = parseFloat(valMap['0l']) || 0;
    }
    if (valMap['0t'] !== undefined) {
      innerThickness = parseFloat(valMap['0t']) || 1;
    }
    if (valMap['0o'] !== undefined) {
      innerOffset = parseFloat(valMap['0o']) || 0;
    }
    if (valMap['0a'] !== undefined) {
      innerOpacity = parseFloat(valMap['0a']) || 1;
    }
    if (valMap['0m'] !== undefined) innerMovementError = valMap['0m'] === '1';
    if (valMap['0f'] !== undefined) innerFiringError = valMap['0f'] === '1';

    // Outer lines
    if (valMap['1b'] !== undefined) {
      outerShow = valMap['1b'] === '1';
    } else if (valMap['1l'] !== undefined || valMap['1t'] !== undefined || valMap['1o'] !== undefined) {
      outerShow = true;
    }
    if (valMap['1l'] !== undefined) {
      outerLength = parseFloat(valMap['1l']) || 0;
    } else if (outerShow) {
      outerLength = 2;
    }
    if (valMap['1t'] !== undefined) {
      outerThickness = parseFloat(valMap['1t']) || 1;
    } else if (outerShow) {
      outerThickness = 1;
    }
    if (valMap['1o'] !== undefined) {
      outerOffset = parseFloat(valMap['1o']) || 0;
    } else if (outerShow) {
      outerOffset = 3;
    }
    if (valMap['1a'] !== undefined) {
      outerOpacity = parseFloat(valMap['1a']) || 1;
    }
    if (valMap['1m'] !== undefined) outerMovementError = valMap['1m'] === '1';
    if (valMap['1f'] !== undefined) outerFiringError = valMap['1f'] === '1';
  }

  // Allow explicit structured fields to override/refine settings
  if (settings?.crosshair_color) {
    const colorStr = settings.crosshair_color.toLowerCase().trim();
    if (colorStr.startsWith('#')) {
      color = colorStr;
      colorName = 'Custom';
    } else if (COLOR_MAP[colorStr]) {
      color = COLOR_MAP[colorStr];
      colorName = settings.crosshair_color;
    }
  }

  if (settings?.crosshair_dot) {
    const dotStr = settings.crosshair_dot.toLowerCase().trim();
    if (dotStr.includes('off') || dotStr === '0') {
      hasCenterDot = false;
    } else if (dotStr.includes('on') || dotStr === '1' || dotStr === 'true') {
      hasCenterDot = true;
    }
  }

  if (settings?.crosshair_outline) {
    const outlineStr = settings.crosshair_outline.toLowerCase().trim();
    if (outlineStr.includes('off') || outlineStr === '0') {
      hasOutline = false;
    } else if (outlineStr.includes('on') || outlineStr === '1' || outlineStr === 'true') {
      hasOutline = true;
    }
  }

  let hasInnerThickness = false;
  if (settings?.crosshair_inner) {
    const innerStr = settings.crosshair_inner.trim();
    if (innerStr.toLowerCase() === 'off') {
      innerShow = false;
    } else {
      const nums = innerStr.split(/[\/, ]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
      if (nums.length >= 4) {
        innerShow = nums[0] === 1;
        innerLength = nums[1];
        innerThickness = nums[2];
        innerOffset = nums[3];
        hasInnerThickness = true;
      } else if (nums.length >= 3) {
        innerLength = nums[0];
        innerThickness = nums[1];
        innerOffset = nums[2];
        hasInnerThickness = true;
      }
    }
  }

  if (settings?.crosshair_outer) {
    const outerStr = settings.crosshair_outer.trim();
    if (outerStr.toLowerCase() === 'off') {
      outerShow = false;
      outerLength = 0;
    } else {
      const nums = outerStr.split(/[\/, ]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
      if (nums.length >= 4 && nums[0] === 1) {
        outerShow = true;
        outerLength = nums[1];
        outerThickness = nums[2];
        outerOffset = nums[3];
      } else if (nums.length >= 3) {
        outerShow = true;
        outerLength = nums[0];
        outerThickness = nums[1];
        outerOffset = nums[2];
      }
    }
  }

  if (!hasInnerThickness && settings?.crosshair_thickness) {
    const t = parseFloat(settings.crosshair_thickness);
    if (!isNaN(t) && t > 0) innerThickness = t;
  }

  return {
    color,
    colorName,
    hasCenterDot,
    dotSize,
    hasOutline,
    outlineThickness,
    outlineOpacity,
    innerShow,
    innerLength,
    innerThickness,
    innerOffset,
    innerOpacity,
    innerMovementError,
    innerFiringError,
    outerShow,
    outerLength,
    outerThickness,
    outerOffset,
    outerOpacity,
    outerMovementError,
    outerFiringError
  };
}

/**
 * Parses a Valorant crosshair code and returns form field values
 */
export function parseValorantCrosshairToFields(code: string) {
  const parsed = parseCrosshairDetails({ crosshair_code: code });
  let outlineStr = 'Off';
  if (parsed.hasOutline) {
    if (parsed.outlineOpacity !== 1 || parsed.outlineThickness !== 1) {
      outlineStr = `On / ${parsed.outlineOpacity} / ${parsed.outlineThickness}`;
    } else {
      outlineStr = 'On';
    }
  }

  let dotStr = 'Off';
  if (parsed.hasCenterDot) {
    if (parsed.dotSize !== 2) {
      dotStr = `On / 1 / ${parsed.dotSize}`;
    } else {
      dotStr = 'On';
    }
  }

  return {
    crosshair_color: parsed.colorName,
    crosshair_outline: outlineStr,
    crosshair_dot: dotStr,
    crosshair_inner: parsed.innerShow ? `${parsed.innerOpacity} / ${parsed.innerLength} / ${parsed.innerThickness} / ${parsed.innerOffset}` : 'Off',
    crosshair_outer: parsed.outerShow ? `${parsed.outerOpacity} / ${parsed.outerLength} / ${parsed.outerThickness} / ${parsed.outerOffset}` : 'Off',
    crosshair_thickness: String(parsed.innerThickness)
  };
}

/**
 * Generates an exact 1:1 valid Valorant crosshair import code
 */
export function getCrosshairExportCode(settings?: CrosshairSettings | null): string {
  if (!settings) return "0;P;c;5;h;0;f;0;0t;2;0l;4;0o;2;0a;1;0f;0;1b;0";

  if (settings.crosshair_code && settings.crosshair_code.trim().startsWith('CSGO-')) {
    return settings.crosshair_code.trim();
  }

  const parsed = parseCrosshairDetails(settings);

  let cIndex = '0';
  const cLower = parsed.colorName.toLowerCase();
  if (cLower.includes('white')) cIndex = '0';
  else if (cLower.includes('green')) cIndex = '1';
  else if (cLower.includes('yellow')) cIndex = '4';
  else if (cLower.includes('cyan')) cIndex = '5';
  else if (cLower.includes('pink') || cLower.includes('magenta')) cIndex = '6';
  else if (cLower.includes('red')) cIndex = '7';

  const codeParts = [
    '0', 'P',
    'c', cIndex,
    'h', '0',
    'f', '0',
    'o', parsed.hasOutline ? '1' : '0',
    'd', parsed.hasCenterDot ? '1' : '0'
  ];

  if (parsed.hasOutline) {
    codeParts.push('t', String(parsed.outlineThickness));
    codeParts.push('o', String(parsed.outlineOpacity));
  }

  if (parsed.hasCenterDot) {
    codeParts.push('z', String(parsed.dotSize));
  }

  if (parsed.innerShow) {
    codeParts.push(
      '0t', String(parsed.innerThickness),
      '0l', String(parsed.innerLength),
      '0o', String(parsed.innerOffset),
      '0a', String(parsed.innerOpacity || 1),
      '0f', '0'
    );
  } else {
    codeParts.push('0b', '0');
  }

  if (parsed.outerShow && parsed.outerLength > 0) {
    codeParts.push(
      '1b', '1',
      '1t', String(parsed.outerThickness),
      '1l', String(parsed.outerLength),
      '1o', String(parsed.outerOffset),
      '1a', String(parsed.outerOpacity || 1)
    );
  } else {
    codeParts.push('1b', '0');
  }

  return codeParts.join(';');
}

export default function CrosshairPreview({
  settings,
  crosshairs,
  currentIndex = 0,
  onIndexChange,
  isValorant = true
}: Props) {
  const [zoom, setZoom] = useState<number>(1);
  const [bgType, setBgType] = useState<'ascent' | 'grid'>('ascent');

  const activeSettings = crosshairs && crosshairs.length > 0 ? crosshairs[currentIndex] : settings;
  const parsed = parseCrosshairDetails(activeSettings);

  const hasMultiple = crosshairs && crosshairs.length > 1;
  const totalCount = crosshairs?.length || 1;

  const handlePrev = () => {
    if (!onIndexChange || !crosshairs) return;
    onIndexChange((currentIndex - 1 + crosshairs.length) % crosshairs.length);
  };

  const handleNext = () => {
    if (!onIndexChange || !crosshairs) return;
    onIndexChange((currentIndex + 1) % crosshairs.length);
  };

  // Helper to render a rectangle with solid 1px black outline backing
  const renderLineWithOutline = (x: number, y: number, w: number, h: number, key: string) => {
    const ot = parsed.outlineThickness || 1;
    return (
      <React.Fragment key={key}>
        {parsed.hasOutline && (
          <rect
            x={x - ot}
            y={y - ot}
            width={w + 2 * ot}
            height={h + 2 * ot}
            fill="#000000"
            opacity={parsed.outlineOpacity}
          />
        )}
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={parsed.color}
        />
      </React.Fragment>
    );
  };

  return (
    <div className="relative border border-border-custom rounded-xl overflow-hidden mb-4 select-none group" style={{ aspectRatio: '16/9' }}>
      {/* Background Mode: Ascent Stone Wall Image OR Dark Grid */}
      {bgType === 'ascent' ? (
        <div className="absolute inset-0 bg-[#3a3a4e] overflow-hidden">
          <img
            src="/images/crosshair-bg-ascent.png"
            alt="Valorant Ascent Background"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#0d0d14]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
        </div>
      )}

      {/* Target Aim Simulation (True 1:1 Pixel SVG Renderer) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          viewBox="-160 -90 320 180"
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          shapeRendering="crispEdges"
        >
          {/* Center Dot */}
          {parsed.hasCenterDot && renderLineWithOutline(
            -parsed.dotSize / 2,
            -parsed.dotSize / 2,
            parsed.dotSize,
            parsed.dotSize,
            'dot'
          )}

          {/* Inner Lines */}
          {parsed.innerShow && parsed.innerLength > 0 && (
            <g opacity={parsed.innerOpacity}>
              {/* Top Line */}
              {renderLineWithOutline(
                -parsed.innerThickness / 2,
                -(parsed.innerOffset + parsed.innerLength),
                parsed.innerThickness,
                parsed.innerLength,
                'in-top'
              )}
              {/* Bottom Line */}
              {renderLineWithOutline(
                -parsed.innerThickness / 2,
                parsed.innerOffset,
                parsed.innerThickness,
                parsed.innerLength,
                'in-bot'
              )}
              {/* Left Line */}
              {renderLineWithOutline(
                -(parsed.innerOffset + parsed.innerLength),
                -parsed.innerThickness / 2,
                parsed.innerLength,
                parsed.innerThickness,
                'in-left'
              )}
              {/* Right Line */}
              {renderLineWithOutline(
                parsed.innerOffset,
                -parsed.innerThickness / 2,
                parsed.innerLength,
                parsed.innerThickness,
                'in-right'
              )}
            </g>
          )}

          {/* Outer Lines */}
          {parsed.outerShow && parsed.outerLength > 0 && (
            <g opacity={parsed.outerOpacity}>
              {/* Top Outer */}
              {renderLineWithOutline(
                -parsed.outerThickness / 2,
                -(parsed.outerOffset + parsed.outerLength),
                parsed.outerThickness,
                parsed.outerLength,
                'out-top'
              )}
              {/* Bottom Outer */}
              {renderLineWithOutline(
                -parsed.outerThickness / 2,
                parsed.outerOffset,
                parsed.outerThickness,
                parsed.outerLength,
                'out-bot'
              )}
              {/* Left Outer */}
              {renderLineWithOutline(
                -(parsed.outerOffset + parsed.outerLength),
                -parsed.outerThickness / 2,
                parsed.outerLength,
                parsed.outerThickness,
                'out-left'
              )}
              {/* Right Outer */}
              {renderLineWithOutline(
                parsed.outerOffset,
                -parsed.outerThickness / 2,
                parsed.outerLength,
                parsed.outerThickness,
                'out-right'
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Navigation Arrows for Multiple Crosshairs */}
      {hasMultiple && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-20 shadow-md"
            title="Previous crosshair"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-20 shadow-md"
            title="Next crosshair"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Multiple Counter Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-300 bg-black/75 px-2.5 py-0.5 rounded-full border border-white/10 z-20 flex items-center gap-1.5 whitespace-nowrap shadow-sm">
            <span>{currentIndex + 1} / {totalCount}</span>
            {activeSettings?.name && <span className="text-zinc-400">• {activeSettings.name}</span>}
          </div>
        </>
      )}

      {/* Top Overlay Controls: Zoom */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-20 bg-black/60 backdrop-blur-sm rounded-lg p-0.5 border border-white/10">
        <button
          onClick={() => setZoom(prev => Math.max(1, prev - 1))}
          className="w-5 h-5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
          title="Zoom Out"
          disabled={zoom <= 1}
        >
          -
        </button>
        <span className="text-[9px] font-mono text-zinc-300 px-1.5">{zoom.toFixed(1)}x</span>
        <button
          onClick={() => setZoom(prev => Math.min(4, prev + 1))}
          className="w-5 h-5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
          title="Zoom In"
          disabled={zoom >= 4}
        >
          +
        </button>
      </div>
    </div>
  );
}
