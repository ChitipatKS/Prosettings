'use client';

import React, { useRef, useEffect } from 'react';

export type CS2CrosshairSettings = {
  id?: string;
  name?: string | null;
  crosshair_code?: string | null;
  style?: number;                 // 0: Default, 1: Default Static, 2: Classic, 3: Classic Dynamic, 4: Classic Static, 5: Legacy Dynamic
  size?: number;                  // cl_crosshairsize
  gap?: number;                   // cl_crosshairgap
  thickness?: number;             // cl_crosshairthickness
  dot?: boolean;                  // cl_crosshairdot
  outline?: boolean;              // cl_crosshair_drawoutline
  outline_thickness?: number;     // cl_crosshair_outlinethickness (0-3)
  color?: number;                 // cl_crosshaircolor (0: Red, 1: Green, 2: Yellow, 3: Blue, 4: Cyan, 5: Custom)
  color_r?: number;               // cl_crosshaircolor_r (0-255)
  color_g?: number;               // cl_crosshaircolor_g (0-255)
  color_b?: number;               // cl_crosshaircolor_b (0-255)
  alpha?: number;                 // cl_crosshairalpha (0-255)
  use_alpha?: boolean;            // cl_crosshairusealpha
  t_style?: boolean;              // cl_crosshair_t
  recoil?: boolean;               // cl_crosshair_recoil (CS2 exclusive)
  sniper_width?: number;          // cl_crosshair_sniper_width
  gap_use_weapon_value?: boolean; // cl_crosshairgap_useweaponvalue
  fixed_gap?: number;             // cl_fixedcrosshairgap
  dynamic_splitdist?: number;     // cl_crosshair_dynamic_splitdist
  dynamic_splitalpha_innermod?: number;
  dynamic_splitalpha_outermod?: number;
  dynamic_maxdist_split_ratio?: number;

  // Fallback / legacy field names
  crosshair_color?: string | null;
  crosshair_outline?: string | null;
  crosshair_dot?: string | null;
  crosshair_inner?: string | null;
  crosshair_outer?: string | null;
  crosshair_thickness?: string | null;
};

type Props = {
  settings?: CS2CrosshairSettings | null;
  crosshairs?: CS2CrosshairSettings[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
};

// 58-character dictionary used by CS:GO & CS2 share codes
const DICTIONARY = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789';
const DICTIONARY_LENGTH = BigInt(DICTIONARY.length);
const CODE_PATTERN = /^CSGO(-[ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789]{5}){5}$/;

export const CS2_COLOR_PRESETS: Record<number, { name: string; hex: string; r: number; g: number; b: number }> = {
  0: { name: 'Red', hex: '#FA3232', r: 250, g: 50, b: 50 },
  1: { name: 'Green', hex: '#32FA32', r: 50, g: 250, b: 50 },
  2: { name: 'Yellow', hex: '#FAFA32', r: 250, g: 250, b: 50 },
  3: { name: 'Blue', hex: '#3232FA', r: 50, g: 50, b: 250 },
  4: { name: 'Cyan', hex: '#32FAFA', r: 50, g: 250, b: 250 },
  5: { name: 'Custom', hex: '#FFFFFF', r: 255, g: 255, b: 255 }
};

export const CS2_STYLES: Record<number, string> = {
  0: 'Default',
  1: 'Default Static',
  2: 'Classic',
  3: 'Classic Dynamic',
  4: 'Classic Static',
  5: 'Legacy Dynamic'
};

function signedByte(x: number): number {
  return (x ^ 0x80) - 0x80;
}

/**
 * Decodes a CSGO/CS2 crosshair share code (e.g. CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx)
 */
export function decodeCSGOShareCode(code: string): Partial<CS2CrosshairSettings> | null {
  const trimmed = code.trim();
  if (!CODE_PATTERN.test(trimmed)) {
    return null;
  }

  try {
    const chars = trimmed.replace(/^CSGO-/, '').replace(/-/g, '');
    let num = BigInt(0);
    for (let i = chars.length - 1; i >= 0; i--) {
      const idx = DICTIONARY.indexOf(chars[i]);
      if (idx === -1) return null;
      num = num * DICTIONARY_LENGTH + BigInt(idx);
    }

    const hex = num.toString(16).padStart(36, '0');
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    if (bytes.length < 18) return null;

    // Checksum verification
    const expectedChecksum = bytes.slice(1).reduce((acc, b) => acc + b, 0) & 0xff;
    if (bytes[0] !== expectedChecksum) {
      return null;
    }

    const gap = signedByte(bytes[2]) / 10;
    const outlineThickness = bytes[3] / 2;
    const red = bytes[4];
    const green = bytes[5];
    const blue = bytes[6];
    const alpha = bytes[7];
    const dynamicSplitdist = bytes[8] & 0x7f;
    const recoil = ((bytes[8] >> 4) & 8) === 8;
    const fixedGap = signedByte(bytes[9]) / 10;
    const color = bytes[10] & 7;
    const drawOutline = (bytes[10] & 8) === 8;
    const dynamicSplitalphaInnermod = (bytes[10] >> 4) / 10;
    const dynamicSplitalphaOutermod = (bytes[11] & 0xf) / 10;
    const dynamicMaxdistSplitRatio = (bytes[11] >> 4) / 10;
    const thickness = bytes[12] / 10;
    const style = (bytes[13] & 0xf) >> 1;
    const dot = ((bytes[13] >> 4) & 1) === 1;
    const gapUseWeaponValue = ((bytes[13] >> 4) & 2) === 2;
    const useAlpha = ((bytes[13] >> 4) & 4) === 4;
    const tStyle = ((bytes[13] >> 4) & 8) === 8;
    const size = (((bytes[15] & 0x1f) << 8) + bytes[14]) / 10;

    return {
      crosshair_code: trimmed,
      gap,
      outline_thickness: outlineThickness,
      outline: drawOutline,
      color,
      color_r: red,
      color_g: green,
      color_b: blue,
      alpha,
      use_alpha: useAlpha,
      dynamic_splitdist: dynamicSplitdist,
      recoil,
      fixed_gap: fixedGap,
      dynamic_splitalpha_innermod: dynamicSplitalphaInnermod,
      dynamic_splitalpha_outermod: dynamicSplitalphaOutermod,
      dynamic_maxdist_split_ratio: dynamicMaxdistSplitRatio,
      thickness,
      style,
      dot,
      gap_use_weapon_value: gapUseWeaponValue,
      t_style: tStyle,
      size
    };
  } catch {
    return null;
  }
}

/**
 * Encodes CS2 crosshair settings into a valid CSGO-xxxxx share code
 */
export function encodeCSGOShareCode(settings: CS2CrosshairSettings): string {
  const gap = settings.gap ?? -3;
  const outlineThickness = settings.outline_thickness ?? 1;
  const color = settings.color ?? 1;
  const red = color === 5 ? (settings.color_r ?? 255) : (CS2_COLOR_PRESETS[color]?.r ?? 50);
  const green = color === 5 ? (settings.color_g ?? 255) : (CS2_COLOR_PRESETS[color]?.g ?? 250);
  const blue = color === 5 ? (settings.color_b ?? 255) : (CS2_COLOR_PRESETS[color]?.b ?? 50);
  const alpha = settings.alpha ?? 255;
  const dynamicSplitdist = settings.dynamic_splitdist ?? 7;
  const recoil = Boolean(settings.recoil);
  const fixedGap = settings.fixed_gap ?? gap;
  const drawOutline = Boolean(settings.outline);
  const dynamicSplitalphaInnermod = settings.dynamic_splitalpha_innermod ?? 1;
  const dynamicSplitalphaOutermod = settings.dynamic_splitalpha_outermod ?? 0.5;
  const dynamicMaxdistSplitRatio = settings.dynamic_maxdist_split_ratio ?? 0.3;
  const thickness = settings.thickness ?? 1;
  const style = settings.style ?? 4;
  const dot = Boolean(settings.dot);
  const gapUseWeaponValue = Boolean(settings.gap_use_weapon_value);
  const useAlpha = settings.use_alpha !== false;
  const tStyle = Boolean(settings.t_style);
  const size = settings.size ?? 2;

  const bytes = new Array(18).fill(0);
  bytes[1] = 1;
  bytes[2] = Math.round(gap * 10) & 0xff;
  bytes[3] = Math.round(outlineThickness * 2) & 0xff;
  bytes[4] = Math.max(0, Math.min(255, Math.round(red)));
  bytes[5] = Math.max(0, Math.min(255, Math.round(green)));
  bytes[6] = Math.max(0, Math.min(255, Math.round(blue)));
  bytes[7] = Math.max(0, Math.min(255, Math.round(alpha)));
  bytes[8] = (dynamicSplitdist & 0x7f) | ((recoil ? 1 : 0) << 7);
  bytes[9] = Math.round(fixedGap * 10) & 0xff;
  bytes[10] = (color & 7) | ((drawOutline ? 1 : 0) << 3) | ((Math.round(dynamicSplitalphaInnermod * 10) & 0xf) << 4);
  bytes[11] = (Math.round(dynamicSplitalphaOutermod * 10) & 0xf) | ((Math.round(dynamicMaxdistSplitRatio * 10) & 0xf) << 4);
  bytes[12] = Math.round(thickness * 10) & 0xff;
  bytes[13] = ((style & 0x7) << 1) |
              ((dot ? 1 : 0) << 4) |
              ((gapUseWeaponValue ? 1 : 0) << 5) |
              ((useAlpha ? 1 : 0) << 6) |
              ((tStyle ? 1 : 0) << 7);
  const size10 = Math.round(size * 10);
  bytes[14] = size10 & 0xff;
  bytes[15] = (size10 >> 8) & 0x1f;
  bytes[16] = 0;
  bytes[17] = 0;

  // Checksum
  bytes[0] = bytes.slice(1).reduce((acc, b) => acc + b, 0) & 0xff;

  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  let num = BigInt('0x' + hex);
  let code = '';
  for (let i = 0; i < 25; i++) {
    const rem = Number(num % DICTIONARY_LENGTH);
    num = num / DICTIONARY_LENGTH;
    code += DICTIONARY[rem];
  }

  return `CSGO-${code.slice(0, 5)}-${code.slice(5, 10)}-${code.slice(10, 15)}-${code.slice(15, 20)}-${code.slice(20, 25)}`;
}

/**
 * Normalizes any CS2 crosshair object into standardized numerical/visual fields.
 */
export function parseCS2CrosshairDetails(settings?: CS2CrosshairSettings | null): Required<CS2CrosshairSettings> {
  const defaults: Required<CS2CrosshairSettings> = {
    id: '1',
    name: 'Primary Crosshair',
    crosshair_code: 'CSGO-xOXnV-jZP3R-9eAyU-8Kewr-UupcG',
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
    sniper_width: 1,
    gap_use_weapon_value: false,
    fixed_gap: -3,
    dynamic_splitdist: 7,
    dynamic_splitalpha_innermod: 1,
    dynamic_splitalpha_outermod: 0.5,
    dynamic_maxdist_split_ratio: 0.3,
    crosshair_color: 'Green',
    crosshair_outline: '0',
    crosshair_dot: '0',
    crosshair_inner: 'Classic Static',
    crosshair_outer: '',
    crosshair_thickness: '1'
  };

  if (!settings) return defaults;

  const res = { ...defaults, ...settings };

  // If a valid share code is present, decode it first
  if (settings.crosshair_code && settings.crosshair_code.trim().startsWith('CSGO-')) {
    const decoded = decodeCSGOShareCode(settings.crosshair_code);
    if (decoded) {
      Object.assign(res, decoded);
    }
  }

  // Handle explicit overrides from legacy/form string fields if applicable
  if (settings.crosshair_thickness) {
    const t = parseFloat(settings.crosshair_thickness);
    if (!isNaN(t)) res.thickness = t;
  }
  if (settings.crosshair_dot) {
    res.dot = settings.crosshair_dot === '1' || settings.crosshair_dot.toLowerCase() === 'on';
  }
  if (settings.crosshair_outline) {
    res.outline = settings.crosshair_outline === '1' || settings.crosshair_outline.toLowerCase() === 'on';
  }
  if (settings.crosshair_color) {
    const cName = settings.crosshair_color.toLowerCase();
    for (const [k, v] of Object.entries(CS2_COLOR_PRESETS)) {
      if (v.name.toLowerCase() === cName) {
        res.color = Number(k);
        break;
      }
    }
  }

  return res;
}

/**
 * Returns color hex string for canvas or UI badge
 */
export function getCS2ColorHex(settings: CS2CrosshairSettings): string {
  const colorIndex = settings.color ?? 1;
  if (colorIndex === 5) {
    const r = Math.max(0, Math.min(255, settings.color_r ?? 255));
    const g = Math.max(0, Math.min(255, settings.color_g ?? 255));
    const b = Math.max(0, Math.min(255, settings.color_b ?? 255));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return CS2_COLOR_PRESETS[colorIndex]?.hex || '#32FA32';
}

/**
 * Generates an array of CS2 console commands
 */
export function getCS2ConsoleCommands(settings: CS2CrosshairSettings): string[] {
  const p = parseCS2CrosshairDetails(settings);
  const color = p.color;
  const red = color === 5 ? p.color_r : (CS2_COLOR_PRESETS[color]?.r ?? 50);
  const green = color === 5 ? p.color_g : (CS2_COLOR_PRESETS[color]?.g ?? 250);
  const blue = color === 5 ? p.color_b : (CS2_COLOR_PRESETS[color]?.b ?? 50);

  return [
    `cl_crosshairstyle ${p.style}`,
    `cl_crosshairsize ${p.size}`,
    `cl_crosshairgap ${p.gap}`,
    `cl_crosshairthickness ${p.thickness}`,
    `cl_crosshaircolor ${p.color}`,
    ...(p.color === 5 ? [
      `cl_crosshaircolor_r ${red}`,
      `cl_crosshaircolor_g ${green}`,
      `cl_crosshaircolor_b ${blue}`
    ] : []),
    `cl_crosshairdot ${p.dot ? 1 : 0}`,
    `cl_crosshair_drawoutline ${p.outline ? 1 : 0}`,
    `cl_crosshair_outlinethickness ${p.outline_thickness}`,
    `cl_crosshairalpha ${p.alpha}`,
    `cl_crosshairusealpha ${p.use_alpha ? 1 : 0}`,
    `cl_crosshair_t ${p.t_style ? 1 : 0}`,
    `cl_crosshair_recoil ${p.recoil ? 'true' : 'false'}`,
    `cl_crosshairgap_useweaponvalue ${p.gap_use_weapon_value ? 'true' : 'false'}`
  ];
}

export function getCS2ConsoleCommandsString(settings: CS2CrosshairSettings): string {
  return getCS2ConsoleCommands(settings).join('; ');
}

export default function CS2CrosshairPreview({
  settings,
  crosshairs,
  currentIndex = 0,
  onIndexChange,
  className = ''
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeSettings = crosshairs && crosshairs.length > 0 ? crosshairs[currentIndex] : settings;
  const parsed = parseCS2CrosshairDetails(activeSettings);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const roundToEven = (x: number): number => {
      const floor = Math.floor(x);
      const diff = x - floor;
      if (Math.abs(diff - 0.5) < 1e-9) {
        return (floor % 2 === 0) ? floor : floor + 1;
      }
      return Math.round(x);
    };

    const render = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width <= 0 || height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Center coordinates
      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);

      // Counter-Strike 2 Engine Crosshair Calculations
      // Real In-Game Scale (1080p HUD scale, yresScale = 1080 / 480 = 2.25)
      const referenceHeight = 1080;
      const yresScale = referenceHeight / 480;

      const engineSize = roundToEven((parsed.size ?? 1) * yresScale);
      const engineThickness = Math.max(1, roundToEven((parsed.thickness ?? 1) * yresScale));
      const outlineThickness = parsed.outline ? Math.max(1, Math.round(parsed.outline_thickness ?? 1)) : 0;

      const barSize = Math.max(1, engineSize);
      const barThickness = Math.max(1, engineThickness);
      const halfThick = Math.trunc(barThickness / 2);

      // In Source / CS2, baseDistanceGoal = 4
      // When gap = -4, crosshairDistance = 0 (arms meet right at center)
      // When gap = 0, crosshairDistance = 4 (default center spacing)
      const baseDistanceGoal = 4;
      const rawGap = Number(parsed.gap ?? 0);
      const crosshairDistance = Math.max(-halfThick, Math.trunc(baseDistanceGoal + rawGap));
      const ot = outlineThickness;

      const innerLeft = cx - crosshairDistance - halfThick;
      const innerRight = innerLeft + 2 * crosshairDistance + barThickness;
      const innerTop = cy - crosshairDistance - halfThick;
      const innerBottom = innerTop + 2 * crosshairDistance + barThickness;

      const hy0 = cy - halfThick;
      const vx0 = cx - halfThick;

      type Rect = { x: number; y: number; w: number; h: number };
      const lineRects: Rect[] = [];
      const outlineRects: Rect[] = [];
      let dotRect: Rect | null = null;

      // Left Arm
      lineRects.push({
        x: innerLeft - barSize,
        y: hy0,
        w: barSize,
        h: barThickness
      });

      // Right Arm
      lineRects.push({
        x: innerRight,
        y: hy0,
        w: barSize,
        h: barThickness
      });

      // Top Arm (omitted if cl_crosshair_t is true)
      if (!parsed.t_style) {
        lineRects.push({
          x: vx0,
          y: innerTop - barSize,
          w: barThickness,
          h: barSize
        });
      }

      // Bottom Arm
      lineRects.push({
        x: vx0,
        y: innerBottom,
        w: barThickness,
        h: barSize
      });

      // Center Dot
      if (parsed.dot) {
        dotRect = {
          x: vx0,
          y: hy0,
          w: barThickness,
          h: barThickness
        };
      }

      // Generate outline bounds
      if (ot > 0) {
        for (const r of lineRects) {
          outlineRects.push({
            x: r.x - ot,
            y: r.y - ot,
            w: r.w + 2 * ot,
            h: r.h + 2 * ot
          });
        }
        if (dotRect) {
          outlineRects.push({
            x: dotRect.x - ot,
            y: dotRect.y - ot,
            w: dotRect.w + 2 * ot,
            h: dotRect.h + 2 * ot
          });
        }
      }

      // Resolving crosshair color
      let crosshairColor = '#32FA32';
      if (parsed.color === 5) {
        crosshairColor = `rgb(${parsed.color_r}, ${parsed.color_g}, ${parsed.color_b})`;
      } else if (CS2_COLOR_PRESETS[parsed.color]) {
        crosshairColor = CS2_COLOR_PRESETS[parsed.color].hex;
      }

      // Alpha
      const alpha = parsed.use_alpha ? Math.max(0, Math.min(1, parsed.alpha / 255)) : 1.0;

      // Layer 1: Outlines (Pure black)
      if (parsed.outline && outlineRects.length > 0) {
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = alpha;
        for (const r of outlineRects) {
          ctx.fillRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));
        }
      }

      // Layer 2: Main Crosshair Arms
      if (lineRects.length > 0) {
        ctx.fillStyle = crosshairColor;
        ctx.globalAlpha = alpha;
        for (const r of lineRects) {
          ctx.fillRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));
        }
      }

      // Layer 3: Center Dot
      if (dotRect) {
        ctx.fillStyle = crosshairColor;
        ctx.globalAlpha = alpha;
        ctx.fillRect(Math.round(dotRect.x), Math.round(dotRect.y), Math.round(dotRect.w), Math.round(dotRect.h));
      }

      ctx.restore();
    };

    render();

    const ro = new ResizeObserver(() => render());
    ro.observe(container);
    return () => ro.disconnect();
  }, [parsed]);

  return (
    <div
      ref={containerRef}
      className={`relative border border-border-custom rounded-xl overflow-hidden mb-4 select-none group bg-[#0A0D14] flex items-center justify-center shadow-inner ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Subtle center alignment guide */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.04]" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.04]" />
      </div>

      {/* HTML5 Canvas Crosshair */}
      <canvas
        ref={canvasRef}
        className="block pointer-events-none"
      />

      {/* Navigation Arrows for Multiple Crosshairs */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-20 shadow-md"
            title="Previous crosshair"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
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
    </div>
  );
}
