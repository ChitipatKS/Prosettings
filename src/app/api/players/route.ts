import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to generate search variations for leet-speak names (e.g. monesy <-> m0nesy, simple <-> s1mple)
function getSearchVariations(term: string): string[] {
  const variations = new Set<string>();
  variations.add(term);

  // Helper to recursively replace characters
  const replaceChars = (str: string, map: Record<string, string[]>) => {
    let results = [str];
    for (const [char, replacements] of Object.entries(map)) {
      const newResults: string[] = [];
      for (const res of results) {
        newResults.push(res);
        const regex = new RegExp(char, 'gi');
        if (regex.test(res)) {
          for (const rep of replacements) {
            newResults.push(res.replace(regex, rep));
          }
        }
      }
      results = newResults;
    }
    return results;
  };

  const mappings: Record<string, string[]> = {
    'o': ['0'],
    '0': ['o'],
    'i': ['1'],
    'l': ['1'],
    '1': ['i'],
    'e': ['3'],
    '3': ['e'],
    'a': ['4'],
    '4': ['a']
  };

  const allVariations = replaceChars(term.toLowerCase(), mappings);
  allVariations.forEach(v => variations.add(v));

  // Cap at 6 variations to ensure optimal database performance
  return Array.from(variations).slice(0, 6);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const game = searchParams.get('game') || '';
    const role = searchParams.get('role') || '';
    const team = searchParams.get('team') || '';
    const country = searchParams.get('country') || '';

    // Retrieve all players from players table for selection modal
    if (searchParams.get('all') === 'true') {
      const searchVal = searchParams.get('search') || '';
      let query = supabase
        .from('players')
        .select('id, username, real_name, team_id, team, profile_img_url, teams(name)')
        .order('username');

      if (searchVal.trim()) {
        query = query.or(`username.ilike.%${searchVal.trim()}%,real_name.ilike.%${searchVal.trim()}%`);
      }

      const { data: dbPlayers, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const mappedPlayers = (dbPlayers || []).map((p: any) => ({
        id: p.id,
        username: p.username,
        real_name: p.real_name,
        team_id: p.team_id,
        team: p.teams?.name || p.team,
        profile_img_url: p.profile_img_url
      }));

      return NextResponse.json({ players: mappedPlayers });
    }

    console.log('API GET /api/players called with:', {
      search,
      game,
      role,
      team,
      country
    });
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // คิวรีหลักเชื่อมตาราง player_game_settings เข้ากับ players และ games
    let query = supabase.from('player_game_settings').select(`
      id,
      game_role,
      mouse_dpi,
      mouse_hz,
      in_game_sens,
      edpi,
      resolution,
      aspect_ratio,
      refresh_rate,
      settings_data,
      players!inner (
        id,
        username,
        real_name,
        team,
        team_id,
        nationality,
        country_code,
        profile_img_url,
        teams(name)
      ),
      games!inner (
        id,
        name,
        slug
      )
    `, { count: 'exact' });

    // ค้นหาโดยกรองจากชื่อในเกม (username), ชื่อจริง (real_name) หรือชื่อทีม (team) ของเพลเยอร์
    // พร้อมรองรับการแปลงตัวสะกด leet-speak (เช่น monesy -> m0nesy, simple -> s1mple)
    if (search) {
      const searchVariations = getSearchVariations(search.trim());
      const conditions: string[] = [];
      searchVariations.forEach(variation => {
        conditions.push(`username.ilike.%${variation}%`);
        conditions.push(`real_name.ilike.%${variation}%`);
        conditions.push(`team.ilike.%${variation}%`);
      });
      query = query.or(conditions.join(','), { foreignTable: 'players' });
    }

    // กรองตามประเภทเกม (เช่น valorant, cs2)
    if (game) {
      query = query.eq('games.slug', game.toLowerCase());
    }

    // กรองตามทีมสังกัด
    if (team) {
      query = query.eq('players.team', team);
    }

    // กรองตามประเทศ
    if (country) {
      query = query.eq('players.country_code', country.toUpperCase());
    }

    // กรองตามบทบาทตำแหน่งในเกม
    if (role) {
      query = query.ilike('game_role', `%${role}%`);
    }

    // เรียงทีมก่อนเพื่อให้คนที่อยู่ทีมเดียวกันอยู่ติดกัน แล้วค่อยเรียงชื่อผู้เล่น
    const { data, error } = await query;
 
     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }
 
     // Group player settings by player ID to collapse multiple games into one profile card
     const playersMap = new Map<number, any>();

     for (const item of (data as any || [])) {
       const pId = item.players.id;
       const gameObj = {
         id: item.games.id,
         name: item.games.name,
         slug: item.games.slug,
         role: item.game_role,
         mouse_settings: {
           dpi: item.mouse_dpi,
           hz: item.mouse_hz,
           sens: item.in_game_sens,
           edpi: item.edpi
         },
         video_settings: {
           resolution: item.resolution,
           aspect_ratio: item.aspect_ratio,
           refresh_rate: item.refresh_rate
         },
         game_specific_settings: item.settings_data
       };

       if (playersMap.has(pId)) {
         playersMap.get(pId).games.push(gameObj);
       } else {
         playersMap.set(pId, {
           settings_id: item.id,
           player_id: pId,
           username: item.players.username,
           real_name: item.players.real_name,
           team: item.players.teams?.name || item.players.team,
           team_id: item.players.team_id,
           nationality: item.players.nationality,
           country_code: item.players.country_code,
           profile_img_url: item.players.profile_img_url,
           games: [gameObj]
         });
       }
     }

     const formattedPlayers = Array.from(playersMap.values());

     // เรียงทีมก่อนเพื่อให้คนที่อยู่ทีมเดียวกันอยู่ติดกัน แล้วค่อยเรียงชื่อผู้เล่น (Free Agent อยู่ท้ายสุด)
     formattedPlayers.sort((a: any, b: any) => {
       const teamA = (a.team || '').trim().toLowerCase();
       const teamB = (b.team || '').trim().toLowerCase();

       const isFreeA = teamA === '' || teamA === 'free agent' || teamA === 'none' || teamA === '—';
       const isFreeB = teamB === '' || teamB === 'free agent' || teamB === 'none' || teamB === '—';

       if (isFreeA && !isFreeB) return 1;
       if (!isFreeA && isFreeB) return -1;

       if (teamA !== teamB) {
         return teamA.localeCompare(teamB);
       }

       const userA = (a.username || '').trim().toLowerCase();
       const userB = (b.username || '').trim().toLowerCase();
       return userA.localeCompare(userB);
     });

     const totalCount = formattedPlayers.length;
     const paginatedPlayers = formattedPlayers.slice(from, to + 1);
 
     return NextResponse.json({
       players: paginatedPlayers,
       pagination: {
         total: totalCount,
         page,
         limit,
         pages: Math.ceil(totalCount / limit)
       }
     });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
