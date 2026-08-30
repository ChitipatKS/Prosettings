const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load env variables
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
  console.error('Error: Supabase environment variables missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dataPath = path.join(__dirname, '../data/vrs-top55-cs2.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Error: data/vrs-top55-cs2.json not found. Run fetch_vrs_top55.js first.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const teams = raw.teams || [];

  console.log(`🚀 Starting sync of ${teams.length} Teams and ${raw.total_players} Players to Supabase...\n`);

  // Ensure CS2 game exists in games table
  const { data: gameData } = await supabase
    .from('games')
    .select('id')
    .eq('slug', 'cs2')
    .maybeSingle();

  const cs2GameId = gameData?.id || 3;

  let insertedTeams = 0;
  let insertedPlayers = 0;

  for (const team of teams) {
    // 1. Upsert Team
    const { data: teamRecord, error: teamErr } = await supabase
      .from('teams')
      .upsert({
        name: team.name,
        logo_url: team.logo_url || null,
        region: team.region || null,
        games: 'cs2'
      }, { onConflict: 'name' })
      .select()
      .maybeSingle();

    if (teamErr) {
      console.warn(`[WARN] Team upsert failed for ${team.name}:`, teamErr.message);
    } else {
      insertedTeams++;
    }

    // 2. Upsert Players
    for (const p of team.players) {
      const { data: playerRecord, error: playerErr } = await supabase
        .from('players')
        .upsert({
          username: p.username,
          team: team.name,
          country_code: p.country_code || null,
          nationality: p.nationality || null
        }, { onConflict: 'username' })
        .select()
        .maybeSingle();

      if (playerErr) {
        console.warn(`  [WARN] Player ${p.username} failed:`, playerErr.message);
        continue;
      }

      if (playerRecord) {
        insertedPlayers++;
        
        // 3. Ensure player_game_settings for CS2
        await supabase
          .from('player_game_settings')
          .upsert({
            player_id: playerRecord.id,
            game_id: cs2GameId,
            in_game_sens: 1.0,
            mouse_dpi: 800,
            mouse_hz: 1000,
            resolution: '1280x960',
            aspect_ratio: '4:3',
            settings_data: {}
          }, { onConflict: 'player_id,game_id' });
      }
    }
  }

  console.log(`\n🎉 Successfully synced to database:`);
  console.log(`- Teams: ${insertedTeams}`);
  console.log(`- Players: ${insertedPlayers}`);
}

run();
