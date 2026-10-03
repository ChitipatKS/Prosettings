'use client';

import React, { useState, useRef, useEffect } from 'react';

export type CrosshairSettings = {
  name?: string | null;
  crosshair_code?: string | null;
  crosshair_color?: string | null;
  crosshair_dot?: string | null;
  crosshair_outline?: string | null;
  crosshair_inner?: string | null;
  crosshair_outer?: string | null;
  crosshair_thickness?: string | null;
  inner_movement_error?: boolean | null;
  inner_firing_error?: boolean | null;
  outer_movement_error?: boolean | null;
  outer_firing_error?: boolean | null;
};

type Props = {
  settings?: CrosshairSettings | null;
  crosshairs?: CrosshairSettings[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  isValorant?: boolean;
};

// Map color names to CSS colors (corrected to match Valorant in-game values)
export const COLOR_MAP: Record<string, string> = {
  'cyan': '#00FFFF',
  'green': '#00FF00',
  'white': '#FFFFFF',
  'yellow': '#FFFF00',
  'yellow green': '#7FFF00',
  'green yellow': '#DFFF00',
  'red': '#FF0000',
  'pink': '#FF00FF',
  'magenta': '#FF00FF',
  'blue': '#00A2FF',
  'black': '#000000',
  'custom': '#FFFFFF'
};

// Valorant Color code mapping (corrected to match in-game values)
export const VAL_COLOR_INDEX: Record<string, { hex: string; name: string }> = {
  '0': { hex: '#FFFFFF', name: 'White' },
  '1': { hex: '#00FF00', name: 'Green' },
  '2': { hex: '#7FFF00', name: 'Yellow Green' },
  '3': { hex: '#DFFF00', name: 'Green Yellow' },
  '4': { hex: '#FFFF00', name: 'Yellow' },
  '5': { hex: '#00FFFF', name: 'Cyan' },
  '6': { hex: '#FF00FF', name: 'Pink' },
  '7': { hex: '#FF0000', name: 'Red' },
  '8': { hex: '#FFFFFF', name: 'Custom' },  // Custom: read from 'u' token
};

/**
 * All recognized crosshair tokens
 */
const VALID_TOKENS = new Set([
  'c', 'u', 'h', 'd', 'z', 'o', 't', 'a', 'f', 's', 'p',
  '0b', '0t', '0l', '0v', '0g', '0o', '0a', '0m', '0f', '0s', '0e',
  '1b', '1t', '1l', '1v', '1g', '1o', '1a', '1m', '1f', '1s', '1e',
]);

/**
 * Section-aware parser for Valorant crosshair string.
 * Returns tokens for the Primary (P) section by default.
 */
export function parseValorantCodeMap(code: string, section: 'P' | 'A' | 'S' = 'P'): Record<string, string> {
  const map: Record<string, string> = {};
  const tokens = code.split(';').map(t => t.trim()).filter(Boolean);

  let inTargetSection = false;
  let pastFirstSection = false;

  for (let i = 0; i < tokens.length; i++) {
    const k = tokens[i];

    // Section markers
    if (k === 'P' || k === 'A' || k === 'S') {
      if (pastFirstSection && inTargetSection) break; // We've left our target section
      inTargetSection = k === section;
      pastFirstSection = true;
      continue;
    }

    // Global tokens (before any section) are always captured
    // Section tokens are only captured when in the target section
    if (VALID_TOKENS.has(k) && i + 1 < tokens.length) {
      const v = tokens[i + 1];
      if (!pastFirstSection || inTargetSection) {
        map[k] = v;
        i++; // skip value token
      } else {
        i++; // still skip value even if not our section
      }
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
  let dotOpacity = 1;
  let hasOutline = true;
  let outlineThickness = 1;
  let outlineOpacity = 0.5;
  let innerShow = true;
  let innerLength = 6;
  let innerVerticalLength = 6;
  let innerIndependent = false;
  let innerThickness = 2;
  let innerOffset = 3;
  let innerOpacity = 1;
  let outerShow = true;
  let outerLength = 2;
  let outerVerticalLength = 2;
  let outerIndependent = false;
  let outerThickness = 2;
  let outerOffset = 10;
  let outerOpacity = 1;
  let innerMovementError = false;
  let innerFiringError = false;
  let outerMovementError = false;
  let outerFiringError = false;

  const rawCode = (settings?.crosshair_code || '').trim();

  if (rawCode && rawCode.includes(';')) {
    const valMap = parseValorantCodeMap(rawCode);

    // Color — handle c;8 (Custom) by reading 'u' token
    if (valMap['c'] !== undefined) {
      const cVal = valMap['c'];
      if (cVal === '8' && valMap['u']) {
        // Custom color: RRGGBBAA format
        const raw = valMap['u'].replace(/^#/, '');
        color = `#${raw.substring(0, 6)}`;
        colorName = 'Custom';
      } else {
        const valObj = VAL_COLOR_INDEX[cVal];
        if (valObj) {
          color = valObj.hex;
          colorName = valObj.name;
        }
      }
    } else if (valMap['u']) {
      // Custom color without c;8 prefix
      const raw = valMap['u'].replace(/^#/, '');
      color = `#${raw.substring(0, 6)}`;
      colorName = 'Custom';
    }

    // Center Dot
    if (valMap['d'] !== undefined) {
      hasCenterDot = valMap['d'] === '1';
    }
    if (valMap['z'] !== undefined) {
      dotSize = parseFloat(valMap['z']) || 2;
    }
    // Center Dot Opacity (token 'a')
    if (valMap['a'] !== undefined) {
      dotOpacity = parseFloat(valMap['a']);
      if (isNaN(dotOpacity)) dotOpacity = 1;
    }

    // Outline
    if (valMap['h'] !== undefined) {
      // h=1 means outlines ON, h=0 means outlines OFF
      hasOutline = valMap['h'] === '1';
    }
    if (valMap['t'] !== undefined) {
      outlineThickness = parseFloat(valMap['t']) || 1;
    }
    if (valMap['o'] !== undefined) {
      const oVal = parseFloat(valMap['o']);
      if (!isNaN(oVal)) {
        outlineOpacity = oVal;
      }
    }

    // Inner lines
    if (valMap['0b'] !== undefined) {
      innerShow = valMap['0b'] === '1';
    }
    if (valMap['0l'] !== undefined) {
      innerLength = parseFloat(valMap['0l']) || 0;
      innerVerticalLength = innerLength; // default vertical = horizontal
    }
    if (valMap['0g'] !== undefined) {
      innerIndependent = valMap['0g'] === '1';
    }
    if (valMap['0v'] !== undefined && innerIndependent) {
      innerVerticalLength = parseFloat(valMap['0v']) || 0;
    }
    if (valMap['0t'] !== undefined) {
      innerThickness = parseFloat(valMap['0t']) || 1;
    }
    if (valMap['0o'] !== undefined) {
      innerOffset = parseFloat(valMap['0o']) || 0;
    }
    if (valMap['0a'] !== undefined) {
      innerOpacity = parseFloat(valMap['0a']);
      if (isNaN(innerOpacity)) innerOpacity = 1;
    }
    if (valMap['0m'] !== undefined) innerMovementError = valMap['0m'] === '1';
    if (valMap['0f'] !== undefined) {
      innerFiringError = valMap['0f'] === '1';
    } else if (valMap['0s'] !== undefined && (valMap['0s'] === '0' || valMap['0s'] === '1')) {
      innerFiringError = valMap['0s'] === '1';
    }

    // Outer lines
    if (valMap['1b'] !== undefined) {
      outerShow = valMap['1b'] === '1';
    }
    if (valMap['1l'] !== undefined) {
      outerLength = parseFloat(valMap['1l']) || 0;
      outerVerticalLength = outerLength;
    }
    if (valMap['1g'] !== undefined) {
      outerIndependent = valMap['1g'] === '1';
    }
    if (valMap['1v'] !== undefined && outerIndependent) {
      outerVerticalLength = parseFloat(valMap['1v']) || 0;
    }
    if (valMap['1t'] !== undefined) {
      outerThickness = parseFloat(valMap['1t']) || 1;
    }
    if (valMap['1o'] !== undefined) {
      outerOffset = parseFloat(valMap['1o']) || 0;
    }
    if (valMap['1a'] !== undefined) {
      outerOpacity = parseFloat(valMap['1a']);
      if (isNaN(outerOpacity)) outerOpacity = 1;
    }
    if (valMap['1m'] !== undefined) outerMovementError = valMap['1m'] === '1';
    if (valMap['1f'] !== undefined) {
      outerFiringError = valMap['1f'] === '1';
    } else if (valMap['1s'] !== undefined && (valMap['1s'] === '0' || valMap['1s'] === '1')) {
      outerFiringError = valMap['1s'] === '1';
    }

    if (!outerShow) {
      outerMovementError = false;
      outerFiringError = false;
    }
  } else {
    // Allow explicit structured fields to override/refine settings ONLY if no code was parsed
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
      const parts = dotStr.split(/[\/, ]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
      if (parts.length >= 2) {
        dotOpacity = parts[0];
        dotSize = parts[1];
      } else if (parts.length === 1) {
        dotSize = parts[0];
      }
    }
  }

  if (settings?.crosshair_outline) {
    const outlineStr = settings.crosshair_outline.toLowerCase().trim();
    if (outlineStr.includes('off') || outlineStr === '0') {
      hasOutline = false;
    } else if (outlineStr.includes('on') || outlineStr === '1' || outlineStr === 'true') {
      hasOutline = true;
      const parts = outlineStr.split(/[\/, ]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
      if (parts.length >= 2) {
        outlineOpacity = parts[0];
        outlineThickness = parts[1];
      } else if (parts.length === 1) {
        outlineOpacity = parts[0];
      }
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

  }

  // Allow explicit structured fields on settings object to refine error values if provided
  if (settings?.inner_movement_error !== undefined && settings.inner_movement_error !== null) {
    innerMovementError = Boolean(settings.inner_movement_error);
  }
  if (settings?.inner_firing_error !== undefined && settings.inner_firing_error !== null) {
    innerFiringError = Boolean(settings.inner_firing_error);
  }
  if (settings?.outer_movement_error !== undefined && settings.outer_movement_error !== null) {
    outerMovementError = Boolean(settings.outer_movement_error);
  }
  if (settings?.outer_firing_error !== undefined && settings.outer_firing_error !== null) {
    outerFiringError = Boolean(settings.outer_firing_error);
  }

  if (!outerShow) {
    outerMovementError = false;
    outerFiringError = false;
  }

  return {
    color,
    colorName,
    hasCenterDot,
    dotSize,
    dotOpacity,
    hasOutline,
    outlineThickness,
    outlineOpacity,
    innerShow,
    innerLength,
    innerVerticalLength,
    innerIndependent,
    innerThickness,
    innerOffset,
    innerOpacity,
    innerMovementError,
    innerFiringError,
    outerShow,
    outerLength,
    outerVerticalLength,
    outerIndependent,
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
    if (parsed.dotSize !== 2 || parsed.dotOpacity !== 1) {
      dotStr = `On / ${parsed.dotOpacity} / ${parsed.dotSize}`;
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
    crosshair_thickness: String(parsed.innerThickness),
    inner_movement_error: parsed.innerMovementError,
    inner_firing_error: parsed.innerFiringError,
    outer_movement_error: parsed.outerMovementError,
    outer_firing_error: parsed.outerFiringError,
  };
}

/**
 * Encodes parsed crosshair parameters into an exact 1:1 valid Valorant crosshair import code
 */
export function encodeValorantCrosshair(parsed: ReturnType<typeof parseCrosshairDetails>): string {
  let cIndex = '0';
  const cLower = (parsed.colorName || '').toLowerCase();
  if (cLower.includes('white')) cIndex = '0';
  else if (cLower.includes('yellow green')) cIndex = '2';
  else if (cLower.includes('green yellow')) cIndex = '3';
  else if (cLower.includes('green')) cIndex = '1';
  else if (cLower.includes('yellow')) cIndex = '4';
  else if (cLower.includes('cyan')) cIndex = '5';
  else if (cLower.includes('pink') || cLower.includes('magenta')) cIndex = '6';
  else if (cLower.includes('red')) cIndex = '7';
  else if (cLower.includes('custom')) cIndex = '8';

  const codeParts: string[] = ['0', 'P', 'c', cIndex];

  if (cIndex === '8' && parsed.color) {
    const hexClean = parsed.color.replace(/^#/, '').toUpperCase();
    codeParts.push('u', `${hexClean}FF`);
  }

  codeParts.push('h', parsed.hasOutline ? '1' : '0');
  if (parsed.hasOutline) {
    codeParts.push('t', String(parsed.outlineThickness));
    codeParts.push('o', String(parsed.outlineOpacity));
  }

  codeParts.push('d', parsed.hasCenterDot ? '1' : '0');
  if (parsed.hasCenterDot) {
    codeParts.push('z', String(parsed.dotSize));
    if (parsed.dotOpacity !== 1) {
      codeParts.push('a', String(parsed.dotOpacity));
    }
  }

  if (parsed.innerShow) {
    codeParts.push(
      '0b', '1',
      '0t', String(parsed.innerThickness),
      '0l', String(parsed.innerLength),
      '0o', String(parsed.innerOffset),
      '0a', String(parsed.innerOpacity)
    );
    if (parsed.innerIndependent && parsed.innerVerticalLength !== parsed.innerLength) {
      codeParts.push('0g', '1', '0v', String(parsed.innerVerticalLength));
    }
    codeParts.push('0m', parsed.innerMovementError ? '1' : '0');
    codeParts.push('0f', parsed.innerFiringError ? '1' : '0');
  } else {
    codeParts.push('0b', '0');
  }

  if (parsed.outerShow && parsed.outerLength > 0) {
    codeParts.push(
      '1b', '1',
      '1t', String(parsed.outerThickness),
      '1l', String(parsed.outerLength),
      '1o', String(parsed.outerOffset),
      '1a', String(parsed.outerOpacity)
    );
    if (parsed.outerIndependent && parsed.outerVerticalLength !== parsed.outerLength) {
      codeParts.push('1g', '1', '1v', String(parsed.outerVerticalLength));
    }
    codeParts.push('1m', parsed.outerMovementError ? '1' : '0');
    codeParts.push('1f', parsed.outerFiringError ? '1' : '0');
  } else {
    codeParts.push('1b', '0');
  }

  return codeParts.join(';');
}

/**
 * Generates an exact 1:1 valid Valorant crosshair import code
 */
export function getCrosshairExportCode(settings?: CrosshairSettings | null): string {
  if (!settings) return "0;P;c;5;h;0;f;0;0t;2;0l;4;0o;2;0a;1;0f;0;1b;0";

  if (settings.crosshair_code && settings.crosshair_code.trim().startsWith('CSGO-')) {
    return settings.crosshair_code.trim();
  }

  if (settings.crosshair_code && settings.crosshair_code.trim().includes(';')) {
    return settings.crosshair_code.trim();
  }

  const parsed = parseCrosshairDetails(settings);
  return encodeValorantCrosshair(parsed);
}

export default function CrosshairPreview({
  settings,
  crosshairs,
  currentIndex = 0,
  onIndexChange,
  isValorant = true
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

      // Center coordinates (at screen center seam)
      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);

      // True 1:1 In-Game Pixel Scale (1 unit in Valorant = 1 physical screen pixel)
      // Exactly matches the actual physical size seen on your monitor in Valorant
      const scale = 1;

      type Rect = { x: number; y: number; w: number; h: number };

      const outlineRects: Rect[] = [];
      const innerRects: Rect[] = [];
      const outerRects: Rect[] = [];
      let dotRect: Rect | null = null;

      const ot = parsed.hasOutline ? (parsed.outlineThickness || 1) : 0;

      // 1. Center Dot
      if (parsed.hasCenterDot && parsed.dotSize > 0) {
        const halfZ = Math.floor(parsed.dotSize / 2);
        dotRect = {
          x: cx - halfZ * scale,
          y: cy - halfZ * scale,
          w: parsed.dotSize * scale,
          h: parsed.dotSize * scale
        };
        if (ot > 0) {
          outlineRects.push({
            x: dotRect.x - ot * scale,
            y: dotRect.y - ot * scale,
            w: dotRect.w + 2 * ot * scale,
            h: dotRect.h + 2 * ot * scale
          });
        }
      }

      // 2. Inner Lines
      if (parsed.innerShow && (parsed.innerLength > 0 || (parsed.innerIndependent && parsed.innerVerticalLength > 0))) {
        const halfT = Math.floor(parsed.innerThickness / 2);
        const tScaled = parsed.innerThickness * scale;
        const hLenScaled = parsed.innerLength * scale;
        const vLenScaled = (parsed.innerIndependent ? parsed.innerVerticalLength : parsed.innerLength) * scale;
        const offsetScaled = parsed.innerOffset * scale;

        // Right
        if (parsed.innerLength > 0) {
          innerRects.push({
            x: cx + offsetScaled,
            y: cy - halfT * scale,
            w: hLenScaled,
            h: tScaled
          });
          // Left
          innerRects.push({
            x: cx - offsetScaled - hLenScaled,
            y: cy - halfT * scale,
            w: hLenScaled,
            h: tScaled
          });
        }

        // Bottom
        if (vLenScaled > 0) {
          innerRects.push({
            x: cx - halfT * scale,
            y: cy + offsetScaled,
            w: tScaled,
            h: vLenScaled
          });
          // Top
          innerRects.push({
            x: cx - halfT * scale,
            y: cy - offsetScaled - vLenScaled,
            w: tScaled,
            h: vLenScaled
          });
        }
      }

      // 3. Outer Lines
      if (parsed.outerShow && (parsed.outerLength > 0 || (parsed.outerIndependent && parsed.outerVerticalLength > 0))) {
        const halfT = Math.floor(parsed.outerThickness / 2);
        const tScaled = parsed.outerThickness * scale;
        const hLenScaled = parsed.outerLength * scale;
        const vLenScaled = (parsed.outerIndependent ? parsed.outerVerticalLength : parsed.outerLength) * scale;
        const offsetScaled = parsed.outerOffset * scale;

        // Right
        if (parsed.outerLength > 0) {
          outerRects.push({
            x: cx + offsetScaled,
            y: cy - halfT * scale,
            w: hLenScaled,
            h: tScaled
          });
          // Left
          outerRects.push({
            x: cx - offsetScaled - hLenScaled,
            y: cy - halfT * scale,
            w: hLenScaled,
            h: tScaled
          });
        }

        // Bottom
        if (vLenScaled > 0) {
          outerRects.push({
            x: cx - halfT * scale,
            y: cy + offsetScaled,
            w: tScaled,
            h: vLenScaled
          });
          // Top
          outerRects.push({
            x: cx - halfT * scale,
            y: cy - offsetScaled - vLenScaled,
            w: tScaled,
            h: vLenScaled
          });
        }
      }

      // Collect line outlines
      if (ot > 0) {
        for (const r of outerRects) {
          outlineRects.push({
            x: r.x - ot * scale,
            y: r.y - ot * scale,
            w: r.w + 2 * ot * scale,
            h: r.h + 2 * ot * scale
          });
        }
        for (const r of innerRects) {
          outlineRects.push({
            x: r.x - ot * scale,
            y: r.y - ot * scale,
            w: r.w + 2 * ot * scale,
            h: r.h + 2 * ot * scale
          });
        }
      }

      // DRAW ORDER:
      // Layer 1: Outlines (Pure Black, independent outlineOpacity, crisp integer coords)
      if (parsed.hasOutline && outlineRects.length > 0) {
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = Math.max(0, Math.min(1, parsed.outlineOpacity ?? 1));
        for (const r of outlineRects) {
          ctx.fillRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));
        }
      }

      // Layer 2: Outer Lines (Line color, outerOpacity)
      if (outerRects.length > 0) {
        ctx.fillStyle = parsed.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, parsed.outerOpacity ?? 1));
        for (const r of outerRects) {
          ctx.fillRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));
        }
      }

      // Layer 3: Inner Lines (Line color, innerOpacity)
      if (innerRects.length > 0) {
        ctx.fillStyle = parsed.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, parsed.innerOpacity ?? 1));
        for (const r of innerRects) {
          ctx.fillRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));
        }
      }

      // Layer 4: Center Dot (Line color, dotOpacity)
      if (dotRect) {
        ctx.fillStyle = parsed.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, parsed.dotOpacity ?? 1));
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
      className="relative border border-border-custom rounded-xl overflow-hidden mb-4 select-none group bg-[#0A0D14] flex items-center justify-center shadow-inner"
      style={{ aspectRatio: '16/9' }}
    >
      {/* Subtle center cross alignment guides for technical aesthetic */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.04]" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.04]" />
      </div>

      {/* Pixel-Perfect HTML5 Canvas Crosshair */}
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
