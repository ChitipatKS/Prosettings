// Team Logo Mapping Utility for Tier 1 Esports Teams (CS2 & VCT Leagues)

const TEAM_LOGO_MAP: Record<string, string> = {
  // CS2 & Shared
  'vitality': '/images/teams/vitality.png',
  'team vitality': '/images/teams/vitality.png',

  'navi': '/images/teams/navi.png',
  'natus vincere': '/images/teams/navi.png',

  'spirit': '/images/teams/spirit.png',
  'team spirit': '/images/teams/spirit.png',

  'falcons': '/images/teams/falcons.png',
  'falcons esports': '/images/teams/falcons.png',
  'team falcons': '/images/teams/falcons.png',

  'furia': '/images/teams/furia.png',
  'furia esports': '/images/teams/furia.png',

  'mouz': '/images/teams/mouz.png',
  'mousesports': '/images/teams/mouz.png',

  'g2': '/images/teams/g2.png',
  'g2 esports': '/images/teams/g2.png',
  'g2 gozen': '/images/teams/g2.png',

  'faze': '/images/teams/faze.png',
  'faze clan': '/images/teams/faze.png',

  'mongolz': '/images/teams/mongolz.png',
  'the mongolz': '/images/teams/mongolz.png',

  'astralis': '/images/teams/astralis.png',

  'liquid': '/images/teams/liquid.png',
  'team liquid': '/images/teams/liquid.png',

  'nip': '/images/teams/nip.png',
  'ninjas in pyjamas': '/images/teams/nip.png',

  'fut': '/images/teams/fut.png',
  'fut esports': '/images/teams/fut.png',

  'gamerlegion': '/images/teams/gamerlegion.png',
  'legacy': '/images/teams/legacy.png',

  'betboom': '/images/teams/betboom.png',
  'betboom team': '/images/teams/betboom.png',

  'aurora': '/images/teams/aurora.png',
  'parivision': '/images/teams/parivision.png',

  'mibr': '/images/teams/mibr.png',
  '9z': '/images/teams/9z.png',
  '9z team': '/images/teams/9z.png',

  // VCT Pacific
  'prx': '/images/teams/paper-rex.png',
  'paper rex': '/images/teams/paper-rex.png',

  'geng': '/images/teams/geng.png',
  'gen.g': '/images/teams/geng.png',
  'gen.g esports': '/images/teams/geng.png',

  'drx': '/images/teams/drx.png',
  't1': '/images/teams/t1.png',

  'zeta': '/images/teams/zeta.png',
  'zeta division': '/images/teams/zeta.png',

  'dfm': '/images/teams/dfm.png',
  'detonation focusme': '/images/teams/dfm.png',

  'team secret': '/images/teams/team-secret.png',
  'secret': '/images/teams/team-secret.png',

  'global esports': '/images/teams/global-esports.png',
  'ge': '/images/teams/global-esports.png',

  'rrq': '/images/teams/rrq.png',
  'rex regum qeon': '/images/teams/rrq.png',

  'full sense': '/images/teams/full-sense.png',

  'nongshim': '/images/teams/nongshim.png',
  'nongshim redforce': '/images/teams/nongshim.png',

  'varrel': '/images/teams/varrel.png',

  // VCT Americas
  'sentinels': '/images/teams/sentinels.png',
  'sen': '/images/teams/sentinels.png',

  'loud': '/images/teams/loud.png',
  'nrg': '/images/teams/nrg.png',

  'leviatan': '/images/teams/leviatan.png',
  '100 thieves': '/images/teams/100-thieves.png',

  'cloud9': '/images/teams/cloud9.png',
  'c9': '/images/teams/cloud9.png',

  'evil geniuses': '/images/teams/evil-geniuses.png',
  'eg': '/images/teams/evil-geniuses.png',

  'kru': '/images/teams/kru.png',
  'krü esports': '/images/teams/kru.png',
  'kru esports': '/images/teams/kru.png',

  'envy': '/images/teams/envy.png',
  'team envy': '/images/teams/envy.png',

  // VCT EMEA
  'fnatic': '/images/teams/fnatic.png',
  'fnc': '/images/teams/fnatic.png',

  'team heretics': '/images/teams/team-heretics.png',
  'heretics': '/images/teams/team-heretics.png',

  'karmine corp': '/images/teams/karmine-corp.png',
  'kc': '/images/teams/karmine-corp.png',

  'bbl': '/images/teams/bbl.png',
  'bbl esports': '/images/teams/bbl.png',

  'giantx': '/images/teams/giantx.png',
  'gentle mates': '/images/teams/gentle-mates.png',
  'm8': '/images/teams/gentle-mates.png',

  'eternal fire': '/images/teams/eternal-fire.png',
  'ef': '/images/teams/eternal-fire.png',

  // VCT China
  'edg': '/images/teams/edg.png',
  'edward gaming': '/images/teams/edg.png',

  'blg': '/images/teams/bilibili.png',
  'bilibili gaming': '/images/teams/bilibili.png',

  'fpx': '/images/teams/fpx.png',
  'funplus phoenix': '/images/teams/fpx.png',

  'te': '/images/teams/trace-esports.png',
  'trace esports': '/images/teams/trace-esports.png',

  'tyl': '/images/teams/tyloo.png',
  'tyloo': '/images/teams/tyloo.png',

  'tec': '/images/teams/tec.png',
  'titan esports club': '/images/teams/tec.png',

  'nova': '/images/teams/nova-esports.png',
  'nova esports': '/images/teams/nova-esports.png',

  'wol': '/images/teams/wolves.png',
  'wolves esports': '/images/teams/wolves.png',
  'wolves': '/images/teams/wolves.png',

  'jdg': '/images/teams/jdg.png',
  'jd gaming': '/images/teams/jdg.png',

  'ag': '/images/teams/all-gamers.png',
  'all gamers': '/images/teams/all-gamers.png',

  'drg': '/images/teams/drg.png',
  'dragon ranger gaming': '/images/teams/drg.png',

  'xlg': '/images/teams/xlg.png',
  'xlg esports': '/images/teams/xlg.png'
};

let customLogosMap: Record<string, string> = {};
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
  customLogosMap = map;
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

  // 0. Check loaded custom DB logo map
  if (customLogosMap[normalized]) {
    return customLogosMap[normalized];
  }

  // 1. Direct key match
  if (TEAM_LOGO_MAP[normalized]) {
    return TEAM_LOGO_MAP[normalized];
  }

  // 2. Substring matching for resilience (e.g., "100 Thieves Academy" -> "100-thieves.png")
  for (const [key, path] of Object.entries(TEAM_LOGO_MAP)) {
    if (key.length > 2 && (normalized.includes(key) || key.includes(normalized))) {
      return path;
    }
  }

  return undefined;
}
