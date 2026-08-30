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
        .select('id, username, Full_name, team_id, team, profile_img_url, teams(name)')
        .order('username');

      if (searchVal.trim()) {
        query = query.or(`username.ilike.%${searchVal.trim()}%,Full_name.ilike.%${searchVal.trim()}%`);
      }

      const { data: dbPlayers, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const mappedPlayers = (dbPlayers || []).map((p: any) => ({
        id: p.id,
        username: p.username,
        real_name: p.Full_name || p.full_name || p.real_name || null,
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

    // คิวรีหลักจากตาราง players พร้อมดึง player_game_settings และ games
    let query = supabase.from('players').select(`
      id,
      username,
      Full_name,
      team,
      team_id,
      nationality,
      country_code,
      profile_img_url,
      teams (
        name
      ),
      player_game_settings (
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
        games (
          id,
          name,
          slug
        )
      )
    `);

    // ค้นหาโดยกรองจากชื่อในเกม (username), ชื่อจริง (Full_name) หรือชื่อทีม (team) ของเพลเยอร์
    // พร้อมรองรับการแปลงตัวสะกด leet-speak (เช่น monesy -> m0nesy, simple -> s1mple)
    if (search) {
      const searchVariations = getSearchVariations(search.trim());
      const conditions: string[] = [];
      searchVariations.forEach(variation => {
        conditions.push(`username.ilike.%${variation}%`);
        conditions.push(`Full_name.ilike.%${variation}%`);
        conditions.push(`team.ilike.%${variation}%`);
      });
      query = query.or(conditions.join(','));
    }

    // กรองตามทีมสังกัด
    if (team) {
      query = query.eq('team', team);
    }

    // กรองตามประเทศ
    if (country) {
      query = query.eq('country_code', country.toUpperCase());
    }

    // ดึงข้อมูลผู้เล่น
    const { data, error } = await query;
 
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
 
    // ปรับโครงสร้างข้อมูล
    let formattedPlayers = (data as any || []).map((item: any) => {
      const games = (item.player_game_settings || [])
        .filter((s: any) => s.games)
        .map((s: any) => ({
          id: s.games.id,
          name: s.games.name,
          slug: s.games.slug,
          role: s.game_role,
          mouse_settings: {
            dpi: s.mouse_dpi,
            hz: s.mouse_hz,
            sens: s.in_game_sens,
            edpi: s.edpi
          },
          video_settings: {
            resolution: s.resolution,
            aspect_ratio: s.aspect_ratio,
            refresh_rate: s.refresh_rate
          },
          game_specific_settings: s.settings_data
        }));

      return {
        settings_id: item.player_game_settings?.[0]?.id || item.id,
        player_id: item.id,
        username: item.username,
        real_name: item.Full_name || item.full_name || item.real_name || null,
        team: item.teams?.name || item.team,
        team_id: item.team_id,
        nationality: item.nationality,
        country_code: item.country_code,
        profile_img_url: item.profile_img_url,
        games
      };
    });

    // กรองตามเกม (ถ้าเลือกเกมเฉพาะ เช่น cs2, valorant)
    if (game && game.toLowerCase() !== 'all') {
      formattedPlayers = formattedPlayers.filter((p: any) =>
        p.games.some((g: any) => g.slug.toLowerCase() === game.toLowerCase())
      );
    }

    // กรองตาม role
    if (role) {
      formattedPlayers = formattedPlayers.filter((p: any) =>
        p.games.some((g: any) => (g.role || '').toLowerCase().includes(role.toLowerCase()))
      );
    }

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
