import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTeamLogo } from '@/lib/teamLogos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({
        players: [],
        teams: [],
        gears: [],
        community: [],
      });
    }

    // Parallel fetch across databases
    const [playersRes, teamsRes, gearsRes, communityRes] = await Promise.all([
      // 1. Pro Players
      supabase
        .from('players')
        .select('id, username, Full_name, team, profile_img_url')
        .or(`username.ilike.%${query}%,Full_name.ilike.%${query}%`)
        .limit(5),

      // 2. Teams
      supabase
        .from('teams')
        .select('id, name, logo_url')
        .ilike('name', `%${query}%`)
        .limit(4),

      // 3. Gears & Products
      supabase
        .from('products')
        .select('id, name, category, product_type, image_url')
        .ilike('name', `%${query}%`)
        .limit(4),

      // 4. Community Members
      supabase
        .from('user_profiles')
        .select('id, username, real_name, social_links')
        .or(`username.ilike.%${query}%,real_name.ilike.%${query}%`)
        .not('username', 'is', null)
        .limit(3),
    ]);

    // Map Pro Players
    const players = (playersRes.data || []).map((p: any) => ({
      id: p.id,
      username: p.username,
      real_name: p.Full_name || null,
      team: p.team || null,
      team_logo_url: p.team ? getTeamLogo(p.team) : null,
      avatar_url: p.profile_img_url || null,
      href: `/players/${encodeURIComponent(p.username)}`,
      type: 'pro_player',
    }));

    // Map Teams
    const teams = (teamsRes.data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      logo_url: t.logo_url || getTeamLogo(t.name) || null,
      href: `/teams?team=${encodeURIComponent(t.name)}`,
      type: 'team',
    }));

    // Map Gears
    const gears = (gearsRes.data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      category: g.category || 'Gear',
      product_type: g.product_type || 'gear',
      image_url: g.image_url || null,
      href: `/players?gear=${encodeURIComponent(g.name)}`,
      type: 'gear',
    }));

    // Map Community
    const community = (communityRes.data || [])
      .filter((c: any) => !!c.username)
      .map((c: any) => ({
        id: c.id,
        username: c.username,
        real_name: c.real_name || null,
        avatar_url: c.social_links?.profile_img_url || null,
        href: `/players/${encodeURIComponent(c.username)}`,
        type: 'community_member',
      }));

    return NextResponse.json({
      players,
      teams,
      gears,
      community,
      total_count: players.length + teams.length + gears.length + community.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
