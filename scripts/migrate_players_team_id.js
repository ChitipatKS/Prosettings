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
  console.log('Starting players team_id relational migration...');

  // 1. Fetch all teams to map name -> id
  const { data: dbTeams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name');

  if (teamsError) {
    console.error('Error fetching teams:', teamsError.message);
    process.exit(1);
  }

  const teamMap = new Map();
  dbTeams.forEach(t => {
    teamMap.set(t.name.toLowerCase().trim(), t.id);
  });
  console.log(`Loaded ${teamMap.size} teams from database.`);

  // 2. Fetch all players to link them page by page
  let players = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error: playerError } = await supabase
      .from('players')
      .select('id, username, team')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (playerError) {
      console.error('Error fetching players:', playerError.message);
      process.exit(1);
    }

    if (!batch || batch.length === 0) {
      hasMore = false;
    } else {
      players = [...players, ...batch];
      if (batch.length < pageSize) hasMore = false;
      else page++;
    }
  }
  console.log(`Fetched ${players.length} players to process.`);

  // 3. Update player team_id in database
  let updatedCount = 0;
  for (const player of players) {
    const rawTeam = player.team ? player.team.trim() : '';
    if (rawTeam && rawTeam !== '-') {
      const teamId = teamMap.get(rawTeam.toLowerCase());
      if (teamId) {
        const { error: updateError } = await supabase
          .from('players')
          .update({ team_id: teamId })
          .eq('id', player.id);

        if (updateError) {
          console.warn(`[WARN] Failed to update player ${player.username}:`, updateError.message);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`✓ Relational migration completed! Successfully linked ${updatedCount} players to their team_id.`);
}

run();
