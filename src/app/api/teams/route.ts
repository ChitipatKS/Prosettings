import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

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
    const teamNamesSet = new Set<string>();

    (playerData || []).forEach((p: any) => {
      const t = p.team ? p.team.trim() : '';
      if (t && t !== '-') {
        teamNamesSet.add(t);
        if (!playersByTeam.has(t.toLowerCase())) {
          playersByTeam.set(t.toLowerCase(), []);
        }
        playersByTeam.get(t.toLowerCase())!.push({
          id: p.id,
          username: p.username,
          real_name: p.Full_name || p.full_name || null,
          profile_img_url: p.profile_img_url
        });
      }
    });

    const teamObjectsMap = new Map<string, any>();

    // Add teams from DB
    if (!dbError && dbTeams) {
      dbTeams.forEach((t: any) => {
        teamNamesSet.add(t.name);
        const ext = extendedMap[t.name] || {};
        teamObjectsMap.set(t.name, {
          id: t.id,
          name: t.name,
          logo_url: t.logo_url || localMap[t.name] || ext.logo_url || null,
          description: t.description || ext.description || '',
          games: t.games ? (typeof t.games === 'string' ? t.games.split(',') : t.games) : (ext.games || []),
          region: t.region || ext.region || null,
          players: playersByTeam.get(t.name.toLowerCase()) || []
        });
      });
    }

    // Add remaining teams from players list / extended map
    Object.keys(extendedMap).forEach(n => teamNamesSet.add(n));

    teamNamesSet.forEach(name => {
      if (!teamObjectsMap.has(name)) {
        const ext = extendedMap[name] || {};
        teamObjectsMap.set(name, {
          id: null,
          name,
          logo_url: localMap[name] || ext.logo_url || null,
          description: ext.description || '',
          games: ext.games || [],
          region: ext.region || null,
          players: playersByTeam.get(name.toLowerCase()) || []
        });
      }
    });

    const uniqueTeams = Array.from(teamNamesSet).sort((a, b) => a.localeCompare(b));
    const teamObjects = uniqueTeams.map(name => teamObjectsMap.get(name));

    return NextResponse.json({
      teams: uniqueTeams,
      teamObjects
    });
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

    const extendedMap = getExtendedData();
    extendedMap[cleanName] = {
      name: cleanName,
      logo_url,
      description: description || '',
      games: Array.isArray(games) ? games : (games ? [games] : []),
      region: region || ''
    };
    saveExtendedData(extendedMap);

    // 2. Try Supabase insert first to get the ID
    const gamesStr = Array.isArray(games) ? games.join(',') : (games || '');
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
    const { id, name, logo_url, description, games, region, assigned_player_ids } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const cleanName = name.trim();

    // 1. Update Local Map & Extended JSON
    const localMap = getLocalLogosMap();
    if (logo_url !== undefined) {
      if (logo_url) localMap[cleanName] = logo_url;
      else delete localMap[cleanName];
      saveLocalLogosMap(localMap);
    }

    const extendedMap = getExtendedData();
    extendedMap[cleanName] = {
      name: cleanName,
      logo_url: logo_url || extendedMap[cleanName]?.logo_url,
      description: description !== undefined ? description : (extendedMap[cleanName]?.description || ''),
      games: games !== undefined ? (Array.isArray(games) ? games : [games]) : (extendedMap[cleanName]?.games || []),
      region: region !== undefined ? region : (extendedMap[cleanName]?.region || '')
    };
    saveExtendedData(extendedMap);

    // 2. Try Supabase update first to get the ID
    const gamesStr = Array.isArray(games) ? games.join(',') : (games || '');
    let dbResult = null;
    if (id) {
      const { data } = await supabase
        .from('teams')
        .update({ logo_url, description, games: gamesStr, region })
        .eq('id', id)
        .select()
        .single();
      dbResult = data;
    } else {
      const { data } = await supabase
        .from('teams')
        .upsert({ name: cleanName, logo_url, description, games: gamesStr, region }, { onConflict: 'name' })
        .select()
        .single();
      dbResult = data;
    }

    const teamId = dbResult?.id || id || null;

    // 3. Assign Players if provided
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

    if (name) {
      const localMap = getLocalLogosMap();
      delete localMap[name];
      saveLocalLogosMap(localMap);

      const extendedMap = getExtendedData();
      delete extendedMap[name];
      saveExtendedData(extendedMap);
    }

    if (id) {
      await supabase.from('teams').delete().eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
