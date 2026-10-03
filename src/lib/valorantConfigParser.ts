/**
 * Valorant Config File Parser
 * Parses %LOCALAPPDATA%\VALORANT\Saved\Config directory or files:
 * - RiotUserSettings.ini
 * - GameUserSettings.ini
 * - BackupKeybinds.json
 * 
 * Works 100% locally in the browser with zero external API calls.
 */

export interface ParsedValorantAccountOption {
  accountId: string;
  accountName: string;
  activeCrosshairProfileName: string;
  crosshairCount: number;
  mouseSensitivity: number;
  resolution: string;
  lastModified: number;
  settings: ParsedValorantSettings;
}

export interface ParsedValorantSettings {
  // General & Mouse
  mouseSensitivity: number;
  scopedSens: number;
  adsSens: number;

  // Video - General
  displayMode: string;
  resolution: string;
  aspectRatio: string;
  vsync: string;
  frameRateLimit: string;
  nvidiaReflex: string;

  // Video - Graphics Quality
  materialQuality: string;
  textureQuality: string;
  detailQuality: string;
  uiQuality: string;
  vignette: string;
  antiAliasing: string;
  anisotropicFiltering: string;
  improveClarity: string;
  bloom: string;
  distortion: string;
  castShadows: string;
  multithreadedRendering: string;

  // Accessibility
  enemyHighlightColor: string;

  // Minimap
  minimapRotate: string;
  minimapFixedOrientation: string;
  minimapKeepCentered: string;
  minimapSize: string;
  minimapZoom: string;
  minimapVisionCones: string;

  // Crosshairs
  activeCrosshairProfileName: string;
  crosshairCode: string;
  crosshairProfiles: {
    name: string;
    code: string;
    raw: any;
  }[];

  // Controls / Keybinds
  keybinds: {
    Weapons?: Record<string, string>;
    Movement?: Record<string, string>;
    Abilities?: Record<string, string>;
    Communication?: Record<string, string>;
    Interface?: Record<string, string>;
    [key: string]: Record<string, string> | undefined;
  };

  // Meta
  accountFolder?: string;
  availableAccounts?: ParsedValorantAccountOption[];
}

// Default Valorant keybindings map (Matching canonical order requested by user)
export const DEFAULT_KEYBINDS: Record<string, Record<string, string>> = {
  Weapons: {
    'Fire': 'L-Click',
    'Alternate Fire': 'R-Click',
    'Toggle Zoom Level': 'Middle Mouse Button',
    'Aim Down Sights': 'Toggle',
    'Sniper Rifle Aim': 'Toggle',
    'Operator Zoom': 'Cycle',
    'Operator Zoom Mode': 'Cycle',
    'Auto Re-enter Scope': 'Off',
    'Reload': 'R',
    'Inspect Weapon': 'Y',
    'Equip Primary Weapon': '1',
    'Equip Secondary Weapon': '2',
    'Equip Melee Weapon': '3',
    'Equip Spike': '4',
    'Cycle to Next Weapon': 'Mouse Wheel Up',
    'Cycle to Previous Weapon': 'Mouse Wheel Down',
    'Drop Equipped Item': 'G',
    'Use / Defuse Object': 'F'
  },
  Movement: {
    'Forward': 'W',
    'Strafe Left': 'A',
    'Back': 'S',
    'Strafe Right': 'D',
    'Jump': 'Space',
    'Walk': 'L-Shift',
    'Crouch': 'L-Ctrl'
  },
  Abilities: {
    'Ability 1': 'C',
    'Ability 2': 'Q',
    'Ability 3 (Signature)': 'E',
    'Ultimate Ability': 'X'
  },
  Communication: {
    'Ping': 'Z',
    'Team Push to Talk': 'V',
    'Party Push to Talk': 'U'
  },
  Interface: {
    'Show Map': 'M',
    'Show Scoreboard': 'Tab'
  }
};

// Normalize key names for display
function formatKeyName(rawKey: string): string {
  if (!rawKey || rawKey === 'None') return 'None';
  const map: Record<string, string> = {
    'LeftMouseButton': 'L-Click',
    'RightMouseButton': 'R-Click',
    'MiddleMouseButton': 'Middle Mouse Button',
    'ThumbMouseButton': 'Mouse 4',
    'ThumbMouseButton2': 'Mouse 5',
    'Mouse4': 'Mouse 4',
    'Mouse5': 'Mouse 5',
    'MouseScrollUp': 'Mouse Wheel Up',
    'MouseScrollDown': 'Mouse Wheel Down',
    'MouseWheelUp': 'Mouse Wheel Up',
    'MouseWheelDown': 'Mouse Wheel Down',
    'LeftShift': 'L-Shift',
    'RightShift': 'R-Shift',
    'LeftControl': 'L-Ctrl',
    'RightControl': 'R-Ctrl',
    'LeftAlt': 'L-Alt',
    'RightAlt': 'R-Alt',
    'SpaceBar': 'Space',
    'CapsLock': 'Caps',
    'Escape': 'Esc',
    'Comma': ',',
    'Period': '.',
    'Slash': '/',
    'Backslash': '\\',
    'Semicolon': ';',
    'Quote': "'",
    'Tilde': '~',
    'Minus': '-',
    'Equals': '=',
    'Delete': 'Del',
    'Insert': 'Ins',
    'PageUp': 'Page Up',
    'PageDown': 'Page Down'
  };
  return map[rawKey] || rawKey;
}

// Calculate standard aspect ratio from resolution numbers
export function calculateAspectRatio(w: number, h: number): string {
  if (!w || !h) return '16:9';
  const ratio = w / h;
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(ratio - 16 / 10) < 0.05) return '16:10';
  if (Math.abs(ratio - 5 / 4) < 0.05) return '5:4';
  if (Math.abs(ratio - 21 / 9) < 0.08) return '21:9';
  return `${w}:${h}`;
}

// Encode profile object to official Valorant crosshair share code
export function profileToValorantCode(profile: any): string {
  if (!profile || !profile.primary) return '';
  const p = profile.primary;
  const parts: string[] = ['0', 'P'];

  // Color handling
  if (p.bUseCustomColor && p.colorCustom) {
    const hex = ((p.colorCustom.r << 16) | (p.colorCustom.g << 8) | p.colorCustom.b).toString(16).padStart(6, '0') + 'FF';
    parts.push('c', '8', 'u', hex.toUpperCase());
  } else if (p.color) {
    const r = p.color.r, g = p.color.g, b = p.color.b;
    let cIndex = '0';
    if (r === 0 && g === 255 && b === 255) cIndex = '5';
    else if (r === 0 && g === 255 && b === 0) cIndex = '1';
    else if (r === 255 && g === 255 && b === 0) cIndex = '4';
    else if (r === 255 && g === 0 && b === 0) cIndex = '7';
    else if (r === 255 && g === 0 && b === 255) cIndex = '6';
    else if (r === 255 && g === 255 && b === 255) cIndex = '0';
    else {
      const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0') + 'FF';
      parts.push('c', '8', 'u', hex.toUpperCase());
      cIndex = '';
    }
    if (cIndex) parts.push('c', cIndex);
  }

  // Outline
  if (p.bHasOutline === false) {
    parts.push('h', '0');
  } else {
    if (p.outlineThickness !== undefined && p.outlineThickness !== 1) {
      parts.push('t', String(p.outlineThickness));
    }
    if (p.outlineOpacity !== undefined && p.outlineOpacity !== 1) {
      parts.push('o', String(Math.round(p.outlineOpacity * 100) / 100));
    }
  }

  // Center Dot
  if (p.bDisplayCenterDot) {
    parts.push('d', '1');
    if (p.centerDotSize !== undefined && p.centerDotSize !== 1) {
      parts.push('z', String(Math.round(p.centerDotSize)));
    }
    if (p.centerDotOpacity !== undefined && p.centerDotOpacity !== 1) {
      parts.push('a', String(Math.round(p.centerDotOpacity * 100) / 100));
    }
  }

  // Inner lines
  const inner = p.innerLines;
  if (inner) {
    if (inner.bShowLines === false) {
      parts.push('0b', '0');
    } else {
      if (inner.lineThickness !== undefined) parts.push('0t', String(inner.lineThickness));
      if (inner.lineLength !== undefined) parts.push('0l', String(inner.lineLength));
      if (inner.lineLengthVertical !== undefined && inner.lineLengthVertical !== inner.lineLength) {
        parts.push('0v', String(inner.lineLengthVertical));
      }
      if (inner.lineOffset !== undefined) parts.push('0o', String(inner.lineOffset));
      if (inner.opacity !== undefined) parts.push('0a', String(Math.round(inner.opacity * 100) / 100));
      if (inner.bShowMovementError === false) parts.push('0m', '0');
      else if (inner.bShowMovementError === true) parts.push('0m', '1');
      if (inner.bShowShootingError === false) parts.push('0f', '0');
      else if (inner.bShowShootingError === true) parts.push('0f', '1');
    }
  }

  // Outer lines
  const outer = p.outerLines;
  if (outer) {
    if (outer.bShowLines === false || outer.opacity < 0.01) {
      parts.push('1b', '0');
    } else {
      if (outer.lineThickness !== undefined) parts.push('1t', String(outer.lineThickness));
      if (outer.lineLength !== undefined) parts.push('1l', String(outer.lineLength));
      if (outer.lineLengthVertical !== undefined && outer.lineLengthVertical !== outer.lineLength) {
        parts.push('1v', String(outer.lineLengthVertical));
      }
      if (outer.lineOffset !== undefined) parts.push('1o', String(outer.lineOffset));
      if (outer.opacity !== undefined && outer.opacity > 0.001) parts.push('1a', String(Math.round(outer.opacity * 100) / 100));
      if (outer.bShowMovementError === false) parts.push('1m', '0');
      else if (outer.bShowMovementError === true) parts.push('1m', '1');
      if (outer.bShowShootingError === false) parts.push('1f', '0');
      else if (outer.bShowShootingError === true) parts.push('1f', '1');
    }
  }

  return parts.join(';');
}

/**
 * Main parser function: takes the text content of the 3 key files
 */
export function parseValorantConfigContents(
  riotUserSettingsText: string,
  gameUserSettingsText?: string,
  backupKeybindsJsonText?: string
): ParsedValorantSettings {
  // Helper to extract INI keys
  const getIniValue = (text: string, key: string): string | null => {
    const match = text.match(new RegExp(`${key}=([^\\r\\n]+)`));
    return match ? match[1].trim() : null;
  };

  const getQualityLabel = (val: string | null): string => {
    if (val === '0') return 'Low';
    if (val === '1') return 'Medium';
    if (val === '2') return 'High';
    return 'Low';
  };

  // 1. Mouse / Sensitivity
  const rawSens = getIniValue(riotUserSettingsText, 'EAresFloatSettingName::MouseSensitivity');
  const mouseSensitivity = rawSens ? parseFloat(parseFloat(rawSens).toFixed(3)) : 0.35;

  const rawZoomSens = getIniValue(riotUserSettingsText, 'EAresFloatSettingName::MouseSensitivityZoomed');
  const scopedSens = rawZoomSens ? parseFloat(parseFloat(rawZoomSens).toFixed(2)) : 1.0;

  const rawAdsSens = getIniValue(riotUserSettingsText, 'EAresFloatSettingName::MouseSensitivityADS');
  const adsSens = rawAdsSens ? parseFloat(parseFloat(rawAdsSens).toFixed(2)) : 1.0;

  // 2. Video - General
  let displayMode = 'Fullscreen';
  let resolution = '1920x1080';
  let aspectRatio = '16:9';
  let vsync = 'Off';
  let frameRateLimit = 'Unlimited';
  let nvidiaReflex = 'On';

  if (gameUserSettingsText) {
    const fsMode = getIniValue(gameUserSettingsText, 'LastConfirmedFullscreenMode');
    if (fsMode === '0') displayMode = 'Fullscreen';
    else if (fsMode === '1') displayMode = 'Windowed Fullscreen';
    else if (fsMode === '2') displayMode = 'Windowed';

    const resX = parseInt(getIniValue(gameUserSettingsText, 'ResolutionSizeX') || '1920', 10);
    const resY = parseInt(getIniValue(gameUserSettingsText, 'ResolutionSizeY') || '1080', 10);
    resolution = `${resX}x${resY}`;
    aspectRatio = calculateAspectRatio(resX, resY);

    const rawVsync = getIniValue(gameUserSettingsText, 'bUseVSync');
    vsync = rawVsync && rawVsync.toLowerCase() === 'true' ? 'On' : 'Off';

    const rawFps = getIniValue(gameUserSettingsText, 'FrameRateLimit');
    if (rawFps && parseFloat(rawFps) > 0) {
      frameRateLimit = `${Math.round(parseFloat(rawFps))} FPS`;
    }
  }

  const rawReflex = getIniValue(riotUserSettingsText, 'EAresIntSettingName::NvidiaReflexLowLatencySetting');
  if (rawReflex === '0') nvidiaReflex = 'Off';
  else if (rawReflex === '1') nvidiaReflex = 'On';
  else if (rawReflex === '2') nvidiaReflex = 'On + Boost';

  // 3. Video - Graphics Quality
  const materialQuality = getQualityLabel(getIniValue(riotUserSettingsText, 'EAresIntSettingName::MaterialQuality'));
  const textureQuality = getQualityLabel(getIniValue(riotUserSettingsText, 'EAresIntSettingName::TextureQuality'));
  const detailQuality = getQualityLabel(getIniValue(riotUserSettingsText, 'EAresIntSettingName::DetailQuality'));
  const uiQuality = getQualityLabel(getIniValue(riotUserSettingsText, 'EAresIntSettingName::UIQuality'));

  const rawVignette = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::VignetteEnabled');
  const vignette = rawVignette && rawVignette.toLowerCase() === 'true' ? 'On' : 'Off';

  const rawAA = getIniValue(riotUserSettingsText, 'EAresIntSettingName::AntiAliasing');
  let antiAliasing = 'None';
  if (rawAA === '1') antiAliasing = 'FXAA';
  else if (rawAA === '2') antiAliasing = 'MSAA 2x';
  else if (rawAA === '3') antiAliasing = 'MSAA 4x';

  const rawAF = getIniValue(riotUserSettingsText, 'EAresIntSettingName::AnisotropicFiltering');
  let anisotropicFiltering = '1x';
  if (rawAF === '2') anisotropicFiltering = '2x';
  else if (rawAF === '4') anisotropicFiltering = '4x';
  else if (rawAF === '8') anisotropicFiltering = '8x';
  else if (rawAF === '16') anisotropicFiltering = '16x';

  const rawBloom = getIniValue(riotUserSettingsText, 'EAresIntSettingName::BloomQuality');
  const bloom = rawBloom && rawBloom !== '0' ? 'On' : 'Off';

  const rawDistortion = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::DisableDistortion');
  const distortion = rawDistortion && rawDistortion.toLowerCase() === 'true' ? 'Off' : 'On';

  const rawShadows = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::ShadowsEnabled');
  const castShadows = rawShadows && rawShadows.toLowerCase() === 'true' ? 'On' : 'Off';

  const multithreadedRendering = 'On';
  const improveClarity = 'On';

  // 4. Accessibility (ColorBlindMode)
  // 0 = Red (Default), 1 = Purple (Protanopia), 2 = Yellow (Deuteranopia), 3 = Yellow (Protanopia)
  const rawColorBlind = getIniValue(riotUserSettingsText, 'EAresIntSettingName::ColorBlindMode');
  let enemyHighlightColor = 'Red (Default)';
  if (rawColorBlind === '1') {
    enemyHighlightColor = 'Purple';
  } else if (rawColorBlind === '2') {
    enemyHighlightColor = 'Yellow (Deuteranopia)';
  } else if (rawColorBlind === '3') {
    enemyHighlightColor = 'Yellow (Protanopia)';
  }

  // 5. Minimap
  const rawMinimapTranslates = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::MinimapTranslates');
  const minimapRotate = rawMinimapTranslates && rawMinimapTranslates.toLowerCase() === 'false' ? 'Fixed' : 'Rotate';
  const minimapFixedOrientation = 'Based on Side';
  const minimapKeepCentered = 'On';

  const rawMinimapSize = getIniValue(riotUserSettingsText, 'EAresFloatSettingName::MinimapSize');
  const minimapSize = rawMinimapSize ? parseFloat(rawMinimapSize).toFixed(2) : '1.00';

  const rawMinimapZoom = getIniValue(riotUserSettingsText, 'EAresFloatSettingName::MinimapZoom');
  const minimapZoom = rawMinimapZoom ? parseFloat(rawMinimapZoom).toFixed(2) : '0.90';

  const minimapVisionCones = 'On';

  // 6. Crosshairs
  let activeCrosshairProfileName = getIniValue(riotUserSettingsText, 'EAresStringSettingName::CrosshairProfileName') || 'Primary';
  let crosshairCode = '';
  const crosshairProfiles: { name: string; code: string; raw: any }[] = [];

  const rawProfileData = getIniValue(riotUserSettingsText, 'EAresStringSettingName::SavedCrosshairProfileData');
  if (rawProfileData) {
    try {
      let cleaned = rawProfileData;
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      cleaned = cleaned.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.profiles)) {
        for (const prof of parsed.profiles) {
          const profName = prof.profileName || 'Crosshair';
          const code = profileToValorantCode(prof);
          crosshairProfiles.push({
            name: profName,
            code,
            raw: prof
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse SavedCrosshairProfileData:', e);
    }
  }

  // Match active profile or pick first
  const activeProf = crosshairProfiles.find(p => p.name.toLowerCase() === activeCrosshairProfileName.toLowerCase()) || crosshairProfiles[0];
  if (activeProf) {
    activeCrosshairProfileName = activeProf.name;
    crosshairCode = activeProf.code;
  }

  // 7. Controls / Keybinds
  // Deep clone default keybinds
  const keybinds: Record<string, Record<string, string>> = JSON.parse(JSON.stringify(DEFAULT_KEYBINDS));

  // Extract Scope / ADS / Zoom settings from RiotUserSettings.ini
  const rawAdsHold = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::HoldInputForADS');
  if (rawAdsHold !== null) {
    keybinds.Weapons['Aim Down Sights'] = rawAdsHold.toLowerCase() === 'true' ? 'Hold' : 'Toggle';
  }

  const rawSniperHold = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::HoldInputForSniperScopes');
  if (rawSniperHold !== null) {
    keybinds.Weapons['Sniper Rifle Aim'] = rawSniperHold.toLowerCase() === 'true' ? 'Hold' : 'Toggle';
  }

  const rawCycleSniper = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::CycleThroughSniperZoomLevels');
  if (rawCycleSniper !== null) {
    keybinds.Weapons['Operator Zoom'] = rawCycleSniper.toLowerCase() === 'false' ? 'Toggle' : 'Cycle';
  }

  const rawSniperMode = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::SniperToggleHoldInputCycles');
  if (rawSniperMode !== null) {
    keybinds.Weapons['Operator Zoom Mode'] = rawSniperMode.toLowerCase() === 'false' ? 'Toggle' : 'Cycle';
  }

  const rawRescope = getIniValue(riotUserSettingsText, 'EAresBoolSettingName::AutoRescopeSniper');
  if (rawRescope !== null) {
    keybinds.Weapons['Auto Re-enter Scope'] = rawRescope.toLowerCase() === 'false' ? 'Off' : 'On';
  }

  // Extract custom bindings from BackupKeybinds.json
  if (backupKeybindsJsonText) {
    try {
      const parsedBinds = JSON.parse(backupKeybindsJsonText);
      if (Array.isArray(parsedBinds.actionMappings)) {
        // Sort mappings so agent-specific profiles run first, and global ('None' / empty) runs last,
        // ensuring global profile settings take ultimate precedence.
        const sortedMappings = [...parsedBinds.actionMappings].sort((a, b) => {
          const aIsGlobal = !a.characterName || a.characterName === 'None' ? 1 : 0;
          const bIsGlobal = !b.characterName || b.characterName === 'None' ? 1 : 0;
          return aIsGlobal - bIsGlobal;
        });

        for (const mapping of sortedMappings) {
          const actionName = (mapping.name || '').trim();
          const cleanName = actionName.toLowerCase();
          const formattedKey = formatKeyName(mapping.key);
          if (!formattedKey || formattedKey === 'None') continue;

          // 1. Weapons
          if (cleanName === 'primaryfire' || cleanName === 'fire') {
            keybinds.Weapons['Fire'] = formattedKey;
          } else if (cleanName === 'altfire' || cleanName === 'alternatefire' || cleanName === 'secondaryfire') {
            keybinds.Weapons['Alternate Fire'] = formattedKey;
          } else if (
            cleanName === 'togglezoomlevel' ||
            cleanName === 'togglezoom' ||
            cleanName === 'zoom' ||
            cleanName === 'cyclezoomlevel' ||
            cleanName === 'togglezoomskipfirstlevel'
          ) {
            keybinds.Weapons['Toggle Zoom Level'] = formattedKey;
          } else if (cleanName === 'reload') {
            keybinds.Weapons['Reload'] = formattedKey;
          } else if (cleanName === 'inspect' || cleanName === 'inspectweapon' || cleanName === 'inspectitem') {
            keybinds.Weapons['Inspect Weapon'] = formattedKey;
          } else if (cleanName === 'equipprimary' || cleanName === 'equipprimaryweapon' || cleanName === 'equipslot1') {
            keybinds.Weapons['Equip Primary Weapon'] = formattedKey;
          } else if (cleanName === 'equipsecondary' || cleanName === 'equipsecondaryweapon' || cleanName === 'equipslot2') {
            keybinds.Weapons['Equip Secondary Weapon'] = formattedKey;
          } else if (cleanName === 'equipmelee' || cleanName === 'equipmeleeweapon' || cleanName === 'equipslot3') {
            keybinds.Weapons['Equip Melee Weapon'] = formattedKey;
          } else if (cleanName === 'equipbomb' || cleanName === 'equipspike' || cleanName === 'equipslot4') {
            keybinds.Weapons['Equip Spike'] = formattedKey;
          } else if (
            cleanName === 'nextweapon' ||
            cleanName === 'equipnext' ||
            cleanName === 'cyclenext' ||
            cleanName === 'cyclenextweapon'
          ) {
            keybinds.Weapons['Cycle to Next Weapon'] = formattedKey;
          } else if (
            cleanName === 'prevweapon' ||
            cleanName === 'equipprev' ||
            cleanName === 'cycleprev' ||
            cleanName === 'cycleprevweapon'
          ) {
            keybinds.Weapons['Cycle to Previous Weapon'] = formattedKey;
          } else if (
            cleanName === 'dropequippable' ||
            cleanName === 'drop' ||
            cleanName === 'dropequippeditem' ||
            cleanName === 'dropitem'
          ) {
            keybinds.Weapons['Drop Equipped Item'] = formattedKey;
          } else if (
            cleanName === 'use' ||
            cleanName === 'useobject' ||
            cleanName === 'interact' ||
            cleanName === 'usealternateobject' ||
            cleanName === 'useagentabilityobject'
          ) {
            keybinds.Weapons['Use / Defuse Object'] = formattedKey;
          }

          // 2. Movement
          else if (cleanName === 'forward') {
            keybinds.Movement['Forward'] = formattedKey;
          } else if (cleanName === 'strafeleft') {
            keybinds.Movement['Strafe Left'] = formattedKey;
          } else if (cleanName === 'back' || cleanName === 'backward') {
            keybinds.Movement['Back'] = formattedKey;
          } else if (cleanName === 'straferight') {
            keybinds.Movement['Strafe Right'] = formattedKey;
          } else if (cleanName === 'jump') {
            if (mapping.bindIndex === 1) {
              const current = keybinds.Movement['Jump'] || 'Space';
              if (!current.includes(formattedKey)) {
                keybinds.Movement['Jump'] = `${current} / ${formattedKey}`;
              }
            } else {
              keybinds.Movement['Jump'] = formattedKey;
            }
          } else if (cleanName === 'walk') {
            keybinds.Movement['Walk'] = formattedKey;
          } else if (cleanName === 'crouch') {
            keybinds.Movement['Crouch'] = formattedKey;
          }

          // 3. Abilities (VALORANT ShooterGame internal mapping: GrenadeAbility = Slot 0 / Ability 1 (C), Ability1 = Slot 1 / Ability 2 (Q), Ability2 = Slot 2 / Ability 3 Signature (E), Ultimate = Slot 3 / Ultimate (X))
          else if (
            cleanName === 'grenadeability' ||
            cleanName === 'activate_grenadeability' ||
            cleanName === 'equipgrenade' ||
            cleanName === 'equipability1'
          ) {
            keybinds.Abilities['Ability 1'] = formattedKey;
          } else if (
            cleanName === 'ability1' ||
            cleanName === 'activate_ability1' ||
            cleanName === 'equipq' ||
            cleanName === 'abilityone' ||
            cleanName === 'equipability2'
          ) {
            keybinds.Abilities['Ability 2'] = formattedKey;
          } else if (
            cleanName === 'ability2' ||
            cleanName === 'activate_ability2' ||
            cleanName === 'equipe' ||
            cleanName === 'abilitytwo' ||
            cleanName === 'ability3' ||
            cleanName === 'abilitythree' ||
            cleanName === 'signatureability' ||
            cleanName === 'equipability3'
          ) {
            keybinds.Abilities['Ability 3 (Signature)'] = formattedKey;
          } else if (
            cleanName === 'ultimate' ||
            cleanName === 'ultimateability' ||
            cleanName === 'activate_ultimateability' ||
            cleanName === 'equipultimate' ||
            cleanName === 'abilityultimate'
          ) {
            keybinds.Abilities['Ultimate Ability'] = formattedKey;
          }

          // 4. Communication
          else if (cleanName === 'ping') {
            keybinds.Communication['Ping'] = formattedKey;
          } else if (cleanName === 'voice_teampttaction' || cleanName === 'teampushtotalk') {
            keybinds.Communication['Team Push to Talk'] = formattedKey;
          } else if (cleanName === 'voice_partypttaction' || cleanName === 'partypushtotalk') {
            keybinds.Communication['Party Push to Talk'] = formattedKey;
          }

          // 5. Interface
          else if (cleanName === 'showmap' || cleanName === 'togglemap' || cleanName === 'openmegamap') {
            keybinds.Interface['Show Map'] = formattedKey;
          } else if (cleanName === 'showscoreboard' || cleanName === 'togglescoreboard') {
            keybinds.Interface['Show Scoreboard'] = formattedKey;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse BackupKeybinds.json:', e);
    }
  }

  // Filter and order keybinds strictly according to requested schema
  const cleanedKeybinds: Record<string, Record<string, string>> = {};
  const categoryOrder = ['Weapons', 'Movement', 'Abilities', 'Communication', 'Interface'];

  for (const cat of categoryOrder) {
    const rawCat = keybinds[cat];
    if (!rawCat || typeof rawCat !== 'object') continue;

    const orderedActions = Object.keys(DEFAULT_KEYBINDS[cat] || {});
    const catBinds: Record<string, string> = {};

    for (const action of orderedActions) {
      const val = rawCat[action];
      if (val && typeof val === 'string' && val.trim() !== '' && val !== 'None') {
        catBinds[action] = val.trim();
      }
    }

    if (Object.keys(catBinds).length > 0) {
      cleanedKeybinds[cat] = catBinds;
    }
  }

  return {
    mouseSensitivity,
    scopedSens,
    adsSens,
    displayMode,
    resolution,
    aspectRatio,
    vsync,
    frameRateLimit,
    nvidiaReflex,
    materialQuality,
    textureQuality,
    detailQuality,
    uiQuality,
    vignette,
    antiAliasing,
    anisotropicFiltering,
    improveClarity,
    bloom,
    distortion,
    castShadows,
    multithreadedRendering,
    enemyHighlightColor,
    minimapRotate,
    minimapFixedOrientation,
    minimapKeepCentered,
    minimapSize,
    minimapZoom,
    minimapVisionCones,
    activeCrosshairProfileName,
    crosshairCode,
    crosshairProfiles,
    keybinds: cleanedKeybinds
  };
}

interface ScannedFileInfo {
  file: File;
  name: string;
  path: string;
}

/**
 * Traverses a FileSystemEntry (drag and dropped directory) recursively
 */
async function scanDirectoryEntries(
  entry: any,
  fileList: ScannedFileInfo[],
  currentPath = ''
): Promise<void> {
  const fullPath = entry.fullPath || (currentPath ? `${currentPath}/${entry.name}` : `/${entry.name}`);
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file: File) => {
        fileList.push({
          file,
          name: file.name.toLowerCase(),
          path: fullPath
        });
        resolve();
      });
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    const readEntries = (): Promise<any[]> =>
      new Promise((resolve) => {
        reader.readEntries((entries: any[]) => resolve(entries));
      });

    let entries = await readEntries();
    while (entries && entries.length > 0) {
      for (const child of entries) {
        await scanDirectoryEntries(child, fileList, fullPath);
      }
      entries = await readEntries();
    }
  }
}

/**
 * Helper to identify account UUID / folder name from file path
 */
function extractAccountFolder(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  // Match folder preceding /Windows/ or /WindowsClient/
  const m = normalized.match(/([^\/]+)\/(?:Windows|WindowsClient)\//i);
  if (m && m[1]) {
    const folder = m[1];
    const lower = folder.toLowerCase();
    if (lower !== 'saved' && lower !== 'config' && lower !== 'crashreportclient') {
      return folder;
    }
  }
  // Check if any UUID pattern exists in the path
  const uuidMatch = normalized.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?:-[a-zA-Z0-9]+)?)/);
  if (uuidMatch) {
    return uuidMatch[1];
  }
  return 'default';
}

/**
 * Helper to extract files from a .zip archive (e.g. friend's Config.zip)
 */
async function extractZipEntries(zipFile: File, fileList: ScannedFileInfo[]): Promise<void> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipFile);
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const lowerName = relativePath.split('/').pop()?.toLowerCase() || '';
        if (
          lowerName === 'riotusersettings.ini' ||
          lowerName === 'gameusersettings.ini' ||
          lowerName === 'backupkeybinds.json'
        ) {
          const blob = await zipEntry.async('blob');
          const unzippedFile = new File([blob], lowerName, {
            lastModified: zipEntry.date ? zipEntry.date.getTime() : Date.now()
          });
          fileList.push({
            file: unzippedFile,
            name: lowerName,
            path: relativePath.startsWith('/') ? relativePath : `/${relativePath}`
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to extract zip file:', err);
  }
}

/**
 * Universal browser-level parser:
 * Accepts DataTransferItemList (drag-and-drop folder), FileList, or File[]
 */
export async function parseValorantConfigFromDrop(
  dataTransferItems?: DataTransferItemList | null,
  fileList?: FileList | File[] | null
): Promise<ParsedValorantSettings> {
  const scannedFiles: ScannedFileInfo[] = [];

  // 1. Try webkitGetAsEntry (Chrome, Edge, Firefox drag folder support)
  if (dataTransferItems && dataTransferItems.length > 0) {
    const scanPromises: Promise<void>[] = [];
    for (let i = 0; i < dataTransferItems.length; i++) {
      const item = dataTransferItems[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          if (entry.isFile && entry.name.toLowerCase().endsWith('.zip')) {
            scanPromises.push(
              new Promise<void>((resolve) => {
                (entry as any).file(async (f: File) => {
                  await extractZipEntries(f, scannedFiles);
                  resolve();
                });
              })
            );
          } else {
            scanPromises.push(scanDirectoryEntries(entry, scannedFiles));
          }
        }
      } else if (item.getAsFile) {
        const f = item.getAsFile();
        if (f) {
          if (f.name.toLowerCase().endsWith('.zip')) {
            scanPromises.push(extractZipEntries(f, scannedFiles));
          } else {
            scannedFiles.push({ file: f, name: f.name.toLowerCase(), path: `/${f.name}` });
          }
        }
      }
    }
    await Promise.all(scanPromises);
  }

  // 2. Fallback to standard files array/list
  if (scannedFiles.length === 0 && fileList && fileList.length > 0) {
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (f.name.toLowerCase().endsWith('.zip')) {
        await extractZipEntries(f, scannedFiles);
      } else {
        const relPath = (f as any).webkitRelativePath || f.name;
        scannedFiles.push({
          file: f,
          name: f.name.toLowerCase(),
          path: relPath.startsWith('/') ? relPath : `/${relPath}`
        });
      }
    }
  }

  if (scannedFiles.length === 0) {
    throw new Error('ไม่พบไฟล์ใดๆ ในโฟลเดอร์ที่อัปโหลด กรุณาลองใหม่อีกครั้ง');
  }

  // Filter relevant files
  const riotFiles = scannedFiles.filter(s => s.name === 'riotusersettings.ini');
  const gameFiles = scannedFiles.filter(s => s.name === 'gameusersettings.ini');
  const keybindsFiles = scannedFiles.filter(s => s.name === 'backupkeybinds.json');

  // If no RiotUserSettings.ini found, provide helpful diagnostics
  if (riotFiles.length === 0) {
    if (gameFiles.length > 0) {
      throw new Error(
        'ตรวจพบเฉพาะไฟล์ GameUserSettings.ini (จากโฟลเดอร์ WindowsClient) ซึ่งมีเฉพาะการตั้งค่าภาพหน้าจอ (Video Settings) เท่านั้น แต่ไม่พบไฟล์ RiotUserSettings.ini หรือ BackupKeybinds.json\n\n' +
        'การตั้งค่าเป้า (Crosshair), ความไวเมาส์, สี Accessibility และปุ่มควบคุม (Keybinds) ของ VALORANT จะอยู่ในโฟลเดอร์รหัสบัญชีของคุณ (เช่น [รหัส-UUID]/Windows/)\n\n' +
        '👉 วิธีแก้ไข: กรุณาลากโฟลเดอร์ "Config" ทั้งหมด (หรือลากโฟลเดอร์รหัสบัญชีของคุณโดยตรง) จาก %LOCALAPPDATA%\\VALORANT\\Saved'
      );
    } else {
      throw new Error(
        'ไม่พบไฟล์ RiotUserSettings.ini หรือ GameUserSettings.ini กรุณาลากโฟลเดอร์ "Config" จาก %LOCALAPPDATA%\\VALORANT\\Saved'
      );
    }
  }

  // Find global / shared GameUserSettings.ini (e.g. from root WindowsClient folder)
  let globalGameFile = gameFiles.find(g => {
    const p = g.path.toLowerCase().replace(/\\/g, '/');
    return (p.includes('/config/windowsclient/') || p.includes('/windowsclient/')) &&
           !p.match(/[0-9a-f]{8}-[0-9a-f]{4}/);
  })?.file;
  if (!globalGameFile && gameFiles.length > 0) {
    globalGameFile = [...gameFiles].sort((a, b) => b.file.size - a.file.size)[0].file;
  }

  // Group accounts by folder
  const accountGroups = new Map<string, {
    accountId: string;
    riotFile: File;
    gameFile?: File;
    keybindsFile?: File;
  }>();

  for (const rf of riotFiles) {
    const accountId = extractAccountFolder(rf.path);
    // Find matching gameFile in the same account folder
    const matchingGame = gameFiles.find(g => extractAccountFolder(g.path) === accountId)?.file || globalGameFile;
    // Find matching keybindsFile in the same account folder
    const matchingKeybinds = keybindsFiles.find(k => extractAccountFolder(k.path) === accountId)?.file || keybindsFiles[0]?.file;

    accountGroups.set(accountId, {
      accountId,
      riotFile: rf.file,
      gameFile: matchingGame,
      keybindsFile: matchingKeybinds
    });
  }

  // Parse each detected account
  const parsedAccounts: Array<{
    accountId: string;
    lastModified: number;
    riotFileSize: number;
    settings: ParsedValorantSettings;
  }> = [];

  for (const [accountId, group] of accountGroups.entries()) {
    try {
      const riotText = await group.riotFile.text();
      const gameText = group.gameFile ? await group.gameFile.text() : undefined;
      const keybindsText = group.keybindsFile ? await group.keybindsFile.text() : undefined;

      const parsed = parseValorantConfigContents(riotText, gameText, keybindsText);
      parsed.accountFolder = accountId;

      parsedAccounts.push({
        accountId,
        lastModified: group.riotFile.lastModified || 0,
        riotFileSize: group.riotFile.size || 0,
        settings: parsed
      });
    } catch (err) {
      console.warn(`Failed to parse account ${accountId}:`, err);
    }
  }

  if (parsedAccounts.length === 0) {
    throw new Error('ไม่สามารถอ่านข้อมูลจากการตั้งค่า VALORANT ได้');
  }

  // Sort accounts by quality and activity:
  // 1. Has crosshair profiles (real configured account vs empty 1KB stub)
  // 2. Has custom keybinds
  // 3. Most recently modified (LastWriteTime)
  // 4. File size (more configured settings)
  parsedAccounts.sort((a, b) => {
    const aHasCrosshairs = a.settings.crosshairProfiles.length > 0 ? 1 : 0;
    const bHasCrosshairs = b.settings.crosshairProfiles.length > 0 ? 1 : 0;
    if (aHasCrosshairs !== bHasCrosshairs) {
      return bHasCrosshairs - aHasCrosshairs;
    }

    const aHasKeybinds = Object.keys(a.settings.keybinds.Weapons || {}).length > 0 ? 1 : 0;
    const bHasKeybinds = Object.keys(b.settings.keybinds.Weapons || {}).length > 0 ? 1 : 0;
    if (aHasKeybinds !== bHasKeybinds) {
      return bHasKeybinds - aHasKeybinds;
    }

    if (b.lastModified !== a.lastModified) {
      return b.lastModified - a.lastModified;
    }

    return b.riotFileSize - a.riotFileSize;
  });

  const availableAccounts: ParsedValorantAccountOption[] = parsedAccounts.map(p => ({
    accountId: p.accountId,
    accountName: p.accountId === 'default' ? 'Default Profile' : p.accountId,
    activeCrosshairProfileName: p.settings.activeCrosshairProfileName,
    crosshairCount: p.settings.crosshairProfiles.length,
    mouseSensitivity: p.settings.mouseSensitivity,
    resolution: p.settings.resolution,
    lastModified: p.lastModified,
    settings: p.settings
  }));

  const primary = {
    ...parsedAccounts[0].settings,
    availableAccounts
  };

  return primary;
}
