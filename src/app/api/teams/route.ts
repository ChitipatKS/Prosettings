import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOCAL_MAP_FILE = path.join(process.cwd(), 'data/teams_custom_logos.json');
const EXTENDED_DATA_FILE = path.join(process.cwd(), 'data/teams_extended.json');

function getLocalLogosMap(): Record<string, string> {
  try {
    if (fs.existsSync(LOCAL_MAP_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_MAP_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveLocalLogosMap(map: Record<string, string>) {
  try {
    const dir = path.dirname(LOCAL_MAP_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_MAP_FILE, JSON.stringify(map, null, 2));
  } catch (e) {
    console.error('Error saving local logo map:', e);
  }
}

function getExtendedData(): Record<string, any> {
  try {
    if (fs.existsSync(EXTENDED_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(EXTENDED_DATA_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveExtendedData(data: Record<string, any>) {
  try {
    const dir = path.dirname(EXTENDED_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EXTENDED_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving extended team data:', e);
  }
}

function normalizeGames(games: any): string[] {
  if (!games) return [];
  const rawList = Array.isArray(games)
    ? games
    : typeof games === 'string'
    ? games.split(',')
    : [String(games)];
  const result: string[] = [];
  const seen = new Set<string>();

  rawList.forEach(item => {
    const trimmed = (item || '').trim();
    if (!trimmed) return;
    let canonical = trimmed;
    if (trimmed.toLowerCase() === 'cs2' || trimmed.toLowerCase() === 'csgo') {
      canonical = 'CS2';
    } else if (trimmed.toUpperCase() === 'VALORANT') {
      canonical = 'VALORANT';
    }
    const lowerKey = canonical.toLowerCase();
    if (!seen.has(lowerKey)) {
      seen.add(lowerKey);
      result.push(canonical);
    }
  });

  return result;
}

export async function GET() {
  try {
    const localMap = getLocalLogosMap();
    const extendedMap = getExtendedData();

    // 1. Try querying Supabase 'teams' table
    const { data: dbTeams, error: dbError } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    // 2. Fetch all players with team assignment (paginated to bypass 1000-row limit)
    let playerData: any[] = [];
    let pageNum = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error } = await supabase
        .from('players')
        .select('id, username, Full_name, team, profile_img_url')
        .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

      if (error || !batch || batch.length === 0) {
        hasMore = false;
      } else {
        playerData = [...playerData, ...batch];
        if (batch.length < pageSize) {
          hasMore = false;
        } else {
          pageNum++;
        }
      }
    }

    const playersByTeam = new Map<string, any[]>();

    (playerData || []).forEach((p: any) => {
      const t = p.team ? p.team.trim() : '';
      if (t && t !== '-') {
        const key = t.toLowerCase();
        if (!playersByTeam.has(key)) {
          playersByTeam.set(key, []);
        }
        playersByTeam.get(key)!.push({
          id: p.id,
          username: p.username,
          real_name: p.Full_name || p.full_name || null,
          profile_img_url: p.profile_img_url
        });
      }
    });

    const teamObjectsMap = new Map<string, any>(); // keyed by lowercase team name

    // 1. Add teams from DB (highest priority)
    if (!dbError && dbTeams) {
      dbTeams.forEach((t: any) => {
        if (!t.name || !t.name.trim()) return;
        const key = t.name.toLowerCase().trim();
        const ext = extendedMap[t.name] || {};
        teamObjectsMap.set(key, {
          id: t.id,
          name: t.name,
          logo_url: t.logo_url || localMap[t.name] || ext.logo_url || null,
          description: t.description || ext.description || '',
          games: normalizeGames(t.games || ext.games),
          region: t.region || ext.region || null,
          players: playersByTeam.get(key) || []
        });
      });
    }

    // 2. Add remaining teams from extendedMap
    Object.keys(extendedMap).forEach(name => {
      if (!name || !name.trim()) return;
      const key = name.toLowerCase().trim();
      if (!teamObjectsMap.has(key)) {
        const ext = extendedMap[name] || {};
        teamObjectsMap.set(key, {
          id: null,
          name,
          logo_url: localMap[name] || ext.logo_url || null,
          description: ext.description || '',
          games: normalizeGames(ext.games),
          region: ext.region || null,
          players: playersByTeam.get(key) || []
        });
      }
    });

    // 3. Add remaining teams from player assignments
    (playerData || []).forEach((p: any) => {
      const t = p.team ? p.team.trim() : '';
      if (t && t !== '-') {
        const key = t.toLowerCase();
        if (!teamObjectsMap.has(key)) {
          const ext = extendedMap[t] || {};
          teamObjectsMap.set(key, {
            id: null,
            name: t,
            logo_url: localMap[t] || ext.logo_url || null,
            description: ext.description || '',
            games: normalizeGames(ext.games),
            region: ext.region || null,
            players: playersByTeam.get(key) || []
          });
        }
      }
    });

    const teamObjects = Array.from(teamObjectsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    const uniqueTeams = teamObjects.map(t => t.name);

    return NextResponse.json(
      {
        teams: uniqueTeams,
        teamObjects
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, logo_url, description, games, region, assigned_player_ids } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const cleanName = name.trim();

    // 1. Update Local Map & Extended JSON
    const localMap = getLocalLogosMap();
    if (logo_url) localMap[cleanName] = logo_url;
    saveLocalLogosMap(localMap);

    const normalizedGames = normalizeGames(games);

    const extendedMap = getExtendedData();
    extendedMap[cleanName] = {
      name: cleanName,
      logo_url,
      description: description || '',
      games: normalizedGames,
      region: region || ''
    };
    saveExtendedData(extendedMap);

    // 2. Try Supabase insert first to get the ID
    const gamesStr = normalizedGames.join(',');
    const { data: dbTeam, error: dbErr } = await supabase
      .from('teams')
      .upsert({ name: cleanName, logo_url, description, games: gamesStr, region }, { onConflict: 'name' })
      .select()
      .single();

    if (dbErr) throw dbErr;
    const teamId = dbTeam?.id || null;

    // 3. Assign Players
    if (Array.isArray(assigned_player_ids)) {
      await supabase
        .from('players')
        .update({ team: null, team_id: null })
        .ilike('team', cleanName);

      if (teamId) {
        await supabase
          .from('players')
          .update({ team: null, team_id: null })
          .eq('team_id', teamId);
      }

      if (assigned_player_ids.length > 0) {
        await supabase
          .from('players')
          .update({ team: cleanName, team_id: teamId })
          .in('id', assigned_player_ids);
      }
    }

    return NextResponse.json({
      success: true,
      team: dbTeam || { name: cleanName, logo_url, description, games }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, old_name, name, logo_url, description, games, region, assigned_player_ids } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const oldCleanName = old_name ? old_name.trim() : '';
    const isRenamed = oldCleanName && oldCleanName.toLowerCase() !== cleanName.toLowerCase();

    // 1. Update Local Map & Extended JSON
    const localMap = getLocalLogosMap();
    if (isRenamed) {
      const oldLower = oldCleanName.toLowerCase();
      for (const k of Object.keys(localMap)) {
        if (k.toLowerCase().trim() === oldLower) {
          delete localMap[k];
        }
      }
    }
    if (logo_url !== undefined) {
      if (logo_url) localMap[cleanName] = logo_url;
      else delete localMap[cleanName];
      saveLocalLogosMap(localMap);
    }

    const extendedMap = getExtendedData();
    let prevExtData: any = {};
    if (isRenamed) {
      const oldLower = oldCleanName.toLowerCase();
      for (const k of Object.keys(extendedMap)) {
        if (k.toLowerCase().trim() === oldLower) {
          prevExtData = extendedMap[k] || {};
          delete extendedMap[k];
        }
      }
    }
    const normalizedGames =
      games !== undefined
        ? normalizeGames(games)
        : normalizeGames(extendedMap[cleanName]?.games || prevExtData.games || []);

    extendedMap[cleanName] = {
      name: cleanName,
      logo_url: logo_url || extendedMap[cleanName]?.logo_url || prevExtData.logo_url,
      description: description !== undefined ? description : (extendedMap[cleanName]?.description || prevExtData.description || ''),
      games: normalizedGames,
      region: region !== undefined ? region : (extendedMap[cleanName]?.region || prevExtData.region || '')
    };
    saveExtendedData(extendedMap);

    // 2. Update Supabase 'teams' table
    const gamesStr = normalizedGames.join(',');
    let dbResult = null;
    if (id) {
      const { data, error } = await supabase
        .from('teams')
        .update({ name: cleanName, logo_url, description, games: gamesStr, region })
        .eq('id', id)
        .select()
        .single();
      if (error) console.error('Error updating team by id:', error);
      dbResult = data;
    } else if (isRenamed) {
      const { data, error } = await supabase
        .from('teams')
        .update({ name: cleanName, logo_url, description, games: gamesStr, region })
        .ilike('name', oldCleanName)
        .select()
        .single();
      if (error || !data) {
        const { data: upsertData } = await supabase
          .from('teams')
          .upsert({ name: cleanName, logo_url, description, games: gamesStr, region }, { onConflict: 'name' })
          .select()
          .single();
        dbResult = upsertData;
      } else {
        dbResult = data;
      }
    } else {
      const { data } = await supabase
        .from('teams')
        .upsert({ name: cleanName, logo_url, description, games: gamesStr, region }, { onConflict: 'name' })
        .select()
        .single();
      dbResult = data;
    }

    const teamId = dbResult?.id || id || null;

    // 3. Assign Players if provided, or update renamed players
    if (Array.isArray(assigned_player_ids)) {
      await supabase
        .from('players')
        .update({ team: null, team_id: null })
        .ilike('team', cleanName);

      if (isRenamed) {
        await supabase
          .from('players')
          .update({ team: null, team_id: null })
          .ilike('team', oldCleanName);
      }

      if (teamId) {
        await supabase
          .from('players')
          .update({ team: null, team_id: null })
          .eq('team_id', teamId);
      }

      if (assigned_player_ids.length > 0) {
        await supabase
          .from('players')
          .update({ team: cleanName, team_id: teamId })
          .in('id', assigned_player_ids);
      }
    } else if (isRenamed) {
      // If player list wasn't modified, cascade rename to all existing players in old team
      await supabase
        .from('players')
        .update({ team: cleanName })
        .ilike('team', oldCleanName);

      if (teamId) {
        await supabase
          .from('players')
          .update({ team: cleanName })
          .eq('team_id', teamId);
      }
    }

    return NextResponse.json({
      success: true,
      team: dbResult || { name: cleanName, logo_url, description, games }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');

    if (!id && !name) {
      return NextResponse.json({ error: 'Team ID or name is required' }, { status: 400 });
    }

    const cleanName = name ? name.trim() : '';

    // 1. Remove from local logo map and extended data (case-insensitively)
    if (cleanName) {
      const targetLower = cleanName.toLowerCase();

      const localMap = getLocalLogosMap();
      let localChanged = false;
      for (const k of Object.keys(localMap)) {
        if (k.toLowerCase().trim() === targetLower) {
          delete localMap[k];
          localChanged = true;
        }
      }
      if (localChanged) saveLocalLogosMap(localMap);

      const extendedMap = getExtendedData();
      let extendedChanged = false;
      for (const k of Object.keys(extendedMap)) {
        if (k.toLowerCase().trim() === targetLower) {
          delete extendedMap[k];
          extendedChanged = true;
        }
      }
      if (extendedChanged) saveExtendedData(extendedMap);
    }

    // 2. Unassign all players associated with this team
    if (cleanName) {
      const { error: pErr1 } = await supabase
        .from('players')
        .update({ team: null, team_id: null })
        .ilike('team', cleanName);
      if (pErr1) console.error('Error unassigning players by team name:', pErr1);
    }

    if (id) {
      const { error: pErr2 } = await supabase
        .from('players')
        .update({ team: null, team_id: null })
        .eq('team_id', id);
      if (pErr2) console.error('Error unassigning players by team_id:', pErr2);
    }

    // 3. Delete from Supabase 'teams' table
    if (id) {
      const { error: dErr1 } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);
      if (dErr1) console.error('Error deleting team by id:', dErr1);
    }

    if (cleanName) {
      const { error: dErr2 } = await supabase
        .from('teams')
        .delete()
        .ilike('name', cleanName);
      if (dErr2) console.error('Error deleting team by name:', dErr2);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete team:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
