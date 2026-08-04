const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val) process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Seeding Supabase teams table from local data/teams_extended.json...');

  // 1. Load teams from extended JSON
  const extendedPath = path.join(__dirname, '../data/teams_extended.json');
  if (!fs.existsSync(extendedPath)) {
    console.error('Error: data/teams_extended.json not found!');
    process.exit(1);
  }

  const extendedData = JSON.parse(fs.readFileSync(extendedPath, 'utf8'));
  const teamsArray = Object.values(extendedData);

  console.log(`Found ${teamsArray.length} teams in data/teams_extended.json.`);

  // 2. Insert into teams table
  let inserted = 0;
  for (const team of teamsArray) {
    const gamesStr = Array.isArray(team.games) ? team.games.join(',') : (team.games || '');
    const { error: insertError } = await supabase
      .from('teams')
      .upsert({
        name: team.name,
        logo_url: team.logo_url || null,
        description: team.description || null,
        games: gamesStr || null,
        region: team.region || null
      }, { onConflict: 'name' });

    if (insertError) {
      console.warn(`[WARN] Could not upsert team ${team.name}:`, insertError.message);
    } else {
      inserted++;
    }
  }

  console.log(`✓ Seeded ${inserted}/${teamsArray.length} teams into Supabase teams table successfully!`);
}

run();
