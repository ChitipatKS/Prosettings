import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      // Return sample community members / active users if no query
      const { data: topProfiles } = await supabase
        .from('user_profiles')
        .select('id, username, real_name, is_admin, social_links')
        .not('username', 'is', null)
        .limit(8);

      const users = (topProfiles || [])
        .filter(p => !!p.username)
        .map(p => ({
          id: p.id,
          username: p.username,
          display_name: p.real_name || p.username,
          avatar_url: p.social_links?.profile_img_url || null,
          type: 'community' as const,
          is_admin: Boolean(p.is_admin),
        }));

      return NextResponse.json({ users });
    }

    // Search user_profiles
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('id, username, real_name, is_admin, social_links')
      .or(`username.ilike.%${query}%,real_name.ilike.%${query}%`)
      .limit(6);

    // Search players
    const { data: players } = await supabase
      .from('players')
      .select('id, username, real_name, profile_img_url')
      .or(`username.ilike.%${query}%,real_name.ilike.%${query}%`)
      .limit(6);

    const communityUsers = (userProfiles || [])
      .filter(p => !!p.username)
      .map(p => ({
        id: p.id,
        username: p.username,
        display_name: p.real_name || p.username,
        avatar_url: p.social_links?.profile_img_url || null,
        type: 'community' as const,
        is_admin: Boolean(p.is_admin),
      }));

    const proPlayers = (players || [])
      .filter(p => !!p.username)
      .map(p => ({
        id: String(p.id),
        username: p.username,
        display_name: p.real_name ? `${p.username} (${p.real_name})` : p.username,
        avatar_url: p.profile_img_url || null,
        type: 'pro' as const,
        is_admin: false,
      }));

    // Combine and deduplicate by lowercase username
    const seen = new Set<string>();
    const users: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      type: 'community' | 'pro';
      is_admin?: boolean;
    }> = [];

    for (const u of [...communityUsers, ...proPlayers]) {
      const lower = u.username.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        users.push(u);
      }
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
