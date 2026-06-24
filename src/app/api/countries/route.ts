import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Query unique nationality and country_code from players table
    const { data, error } = await supabase
      .from('players')
      .select('country_code, nationality')
      .not('country_code', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Deduplicate country codes and map them to their nationality labels
    const countryMap = new Map<string, string>();
    data.forEach((item: any) => {
      const code = item.country_code ? item.country_code.trim().toUpperCase() : '';
      const nat = item.nationality ? item.nationality.trim() : '';
      if (code && code !== '-') {
        countryMap.set(code, nat || code);
      }
    });

    const uniqueCountries = Array.from(countryMap.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ countries: uniqueCountries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
