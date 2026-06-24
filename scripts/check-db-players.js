const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env variables manually from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach((line) => {
    const matchUrl = line.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const matchKey = line.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
    if (matchUrl) supabaseUrl = matchUrl[1].trim();
    if (matchKey) supabaseAnonKey = matchKey[1].trim();
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: Supabase credentials not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Connecting to Supabase...");
  
  // Get total players
  const { count: totalCount, error: countErr } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true });
    
  if (countErr) {
    console.error("❌ Error counting players:", countErr.message);
    process.exit(1);
  }
  
  // Get players missing real name
  const { data: missingPlayers, error: missingErr } = await supabase
    .from('players')
    .select('id, username, real_name')
    .is('real_name', null);
    
  if (missingErr) {
    console.error("❌ Error fetching missing players:", missingErr.message);
    process.exit(1);
  }

  // Get players with real name
  const { data: populatedPlayers, error: populatedErr } = await supabase
    .from('players')
    .select('id, username, real_name')
    .not('real_name', 'is', null);

  if (populatedErr) {
    console.error("❌ Error fetching populated players:", populatedErr.message);
    process.exit(1);
  }

  console.log(`\n=== Database Status ===`);
  console.log(`Total Players: ${totalCount}`);
  console.log(`Players with Real Name: ${populatedPlayers.length}`);
  console.log(`Players missing Real Name: ${missingPlayers.length}`);
  
  if (missingPlayers.length > 0) {
    console.log(`\nSample players missing real name:`, missingPlayers.slice(0, 10).map(p => p.username).join(', '));
  }
  if (populatedPlayers.length > 0) {
    console.log(`\nSample players with real name:`, populatedPlayers.slice(0, 10).map(p => `${p.username} (${p.real_name})`).join(', '));
  }
}

run();
