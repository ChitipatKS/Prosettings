import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Query unique team values from the players table
    const { data, error } = await supabase
      .from('players')
      .select('team')
      .not('team', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out blank, null, or '-' names, then grab unique values and sort alphabetically
    const teamSet = new Set<string>();
    data.forEach((item: any) => {
      const name = item.team ? item.team.trim() : '';
      if (name && name !== '-') {
        teamSet.add(name);
      }
    });

    const uniqueTeams = Array.from(teamSet).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ teams: uniqueTeams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
