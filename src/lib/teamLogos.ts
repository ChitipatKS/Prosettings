// Team Logo Mapping Utility for Tier 1 Esports Teams (CS2 & VCT Leagues)
import customLogosData from '../../data/teams_custom_logos.json';

// Aliases mapping common team acronyms / short codes to standard team names
const TEAM_ALIASES: Record<string, string> = {
  'fs': 'full sense',
  'prx': 'paper rex',
  'geng': 'gen.g',
  'dfm': 'detonation focusme',
  'ge': 'global esports',
  'rrq': 'rex regum qeon',
  'sen': 'sentinels',
  '100t': '100 thieves',
  'edg': 'edward gaming',
  'eg': 'evil geniuses',
  'fpx': 'funplus phoenix',
  'kc': 'karmine corp',
  'kru': 'krü esports',
  'lev': 'leviatan',
  'th': 'team heretics',
  'tl': 'team liquid',
  'ts': 'team secret',
  'vit': 'team vitality',
  'vitality': 'team vitality',
  'navi': 'natus vincere',
  'spirit': 'team spirit',
  'falcons': 'team falcons',
  'furia': 'furia esports',
  'mouz': 'mouz',
  'mousesports': 'mouz',
  'faze': 'faze clan',
  'mongolz': 'the mongolz',
  'nip': 'ninjas in pyjamas',
  'fut': 'fut esports',
  'drx': 'drx',
  't1': 't1',
  'zeta': 'zeta division',
  'fnatic': 'fnatic',
  'fnc': 'fnatic',
  'c9': 'cloud9',
  'loud': 'loud',
  'nrg': 'nrg',
  'astralis': 'astralis',
  'heroic': 'heroic',
  'tyloo': 'tyloo',
  'vp': 'virtus.pro',
  'virtus pro': 'virtus.pro'
};

// Initialize with static custom logos from JSON so SSR and initial client render have instant logos
const initialCustomMap: Record<string, string> = {};
if (customLogosData && typeof customLogosData === 'object') {
  Object.entries(customLogosData).forEach(([team, url]) => {
    if (team && url) {
      initialCustomMap[team.toLowerCase().trim()] = url as string;
    }
  });
}

let customLogosMap: Record<string, string> = { ...initialCustomMap };
let isFetchingLogos = false;
let hasFetchedLogos = false;

export async function loadCustomTeamLogos(): Promise<Record<string, string>> {
  if (hasFetchedLogos || isFetchingLogos) return customLogosMap;
  isFetchingLogos = true;
  try {
    const res = await fetch('/api/teams');
    const data = await res.json();
    if (data.teamObjects) {
      data.teamObjects.forEach((t: any) => {
        if (t.name && t.logo_url) {
          customLogosMap[t.name.toLowerCase().trim()] = t.logo_url;
        }
      });
    }
  } catch (e) {
    // Ignore error
  } finally {
    isFetchingLogos = false;
    hasFetchedLogos = true;
  }
  return customLogosMap;
}

export function getCustomLogoMap(): Record<string, string> {
  return customLogosMap;
}

export function setCustomLogoMap(map: Record<string, string>) {
  customLogosMap = { ...initialCustomMap, ...map };
  hasFetchedLogos = true;
}

/**
 * Returns the transparent PNG logo URL for a given team name, or undefined if not mapped.
 */
export function getTeamLogo(teamName: string | null | undefined, dbLogoUrl?: string | null): string | undefined {
  if (dbLogoUrl && dbLogoUrl.trim()) {
    return dbLogoUrl.trim();
  }
  if (!teamName) return undefined;
  const normalized = teamName.toLowerCase().trim();

  // 1. Direct match in custom logo map
  if (customLogosMap[normalized]) {
    return customLogosMap[normalized];
  }

  // 2. Check alias map
  const aliasTarget = TEAM_ALIASES[normalized];
  if (aliasTarget && customLogosMap[aliasTarget]) {
    return customLogosMap[aliasTarget];
  }

  // 3. Substring matching for resilience (e.g. "Full Sense Academy" -> "full sense")
  for (const [key, path] of Object.entries(customLogosMap)) {
    if (key.length > 2 && (normalized.includes(key) || key.includes(normalized))) {
      return path;
    }
  }

  return undefined;
}
