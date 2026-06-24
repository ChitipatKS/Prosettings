const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load env variables manually from .env.local
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

// Utility functions for parsing
function parseNumber(val) {
  if (!val) return null;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseIntNumber(val) {
  if (!val) return null;
  const cleaned = val.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

async function run() {
  const jsonPath = path.join(__dirname, '..', 'data', 'scraped-players.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Scraped players JSON not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${rawData.length} player records from JSON`);

  // --- Step 1: Initialize Games ---
  console.log("\nInitializing games in database...");
  const gamesToInsert = [
    { name: 'VALORANT', slug: 'valorant' },
    { name: 'CS2', slug: 'cs2' }
  ];
  
  const { data: dbGames, error: gamesErr } = await supabase.from('games').upsert(gamesToInsert, { onConflict: 'slug' }).select();
  if (gamesErr) {
    console.error("❌ Error inserting games:", gamesErr.message);
    process.exit(1);
  }
  
  const gamesMap = {};
  dbGames.forEach(g => {
    gamesMap[g.slug] = g.id;
  });
  console.log("Games initialized:", gamesMap);

  // --- Step 2: Extract and Bulk Insert Unique Products ---
  console.log("\nProcessing unique products...");
  const productKeys = [
    { key: 'mouse', category: 'mouse', type: 'gear' },
    { key: 'keyboard', category: 'keyboard', type: 'gear' },
    { key: 'mousepad', category: 'mousepad', type: 'gear' },
    { key: 'headset', category: 'headset', type: 'gear' },
    { key: 'monitor', category: 'monitor', type: 'hardware' },
    { key: 'gpu', category: 'gpu', type: 'hardware' }
  ];

  const uniqueProductsMap = new Map(); // name -> { name, category, product_type }
  
  rawData.forEach(row => {
    productKeys.forEach(({ key, category, type }) => {
      const productName = row[key];
      if (productName && productName.trim() && productName !== '-') {
        const cleanedName = productName.trim();
        uniqueProductsMap.set(cleanedName, {
          name: cleanedName,
          category,
          product_type: type
        });
      }
    });
  });

  const productsList = Array.from(uniqueProductsMap.values());
  console.log(`Found ${productsList.length} unique products. Bulk inserting...`);

  // Chunk products insertion because Supabase limit might apply
  const chunkSize = 100;
  let dbProducts = [];
  for (let i = 0; i < productsList.length; i += chunkSize) {
    const chunk = productsList.slice(i, i + chunkSize);
    const { data, error } = await supabase.from('products').upsert(chunk, { onConflict: 'name' }).select();
    if (error) {
      console.error(`❌ Error inserting products chunk ${i}:`, error.message);
      process.exit(1);
    }
    dbProducts = dbProducts.concat(data);
  }

  const productsMap = {};
  dbProducts.forEach(p => {
    productsMap[p.name] = p.id;
  });
  console.log(`Products initialized: ${dbProducts.length} entries`);

  // --- Step 3: Bulk Insert Unique Players ---
  console.log("\nProcessing unique players...");
  const uniquePlayers = new Set();
  const playerTeams = {};
  rawData.forEach(row => {
    if (row.player) {
      const username = row.player.trim();
      uniquePlayers.add(username);
      if (row.team && row.team.trim() !== '-') {
        playerTeams[username] = row.team.trim();
      }
    }
  });

  const playersList = Array.from(uniquePlayers).map(username => ({
    username,
    real_name: null,
    birth_date: null,
    nationality: null,
    team: playerTeams[username] || null
  }));

  console.log(`Found ${playersList.length} unique players. Bulk inserting...`);
  let dbPlayers = [];
  for (let i = 0; i < playersList.length; i += chunkSize) {
    const chunk = playersList.slice(i, i + chunkSize);
    const { data, error } = await supabase.from('players').upsert(chunk, { onConflict: 'username' }).select();
    if (error) {
      console.error(`❌ Error inserting players chunk ${i}:`, error.message);
      process.exit(1);
    }
    dbPlayers = dbPlayers.concat(data);
  }

  const playersMap = {};
  dbPlayers.forEach(p => {
    playersMap[p.username] = p.id;
  });
  console.log(`Players initialized: ${dbPlayers.length} entries`);

  // --- Step 4: Prepare Settings and Relations ---
  console.log("\nPreparing player game settings and gear relationships...");
  const uniqueSettings = new Map();
  const uniqueRelations = new Set();
  const relationsList = [];

  rawData.forEach(row => {
    const playerUsername = row.player ? row.player.trim() : '';
    const gameSlug = row.game;
    
    const playerId = playersMap[playerUsername];
    const gameId = gamesMap[gameSlug];

    if (!playerId || !gameId) return;

    // A. Parse Settings
    const isValorant = gameSlug === 'valorant';
    
    // settings_data JSONB specific settings
    const settingsData = {};
    if (isValorant) {
      if (row['scoped sens']) settingsData.scoped_sens = parseNumber(row['scoped sens']);
    } else {
      if (row['zoom sens']) settingsData.zoom_sens = parseNumber(row['zoom sens']);
      if (row['scaling mode']) settingsData.scaling_mode = row['scaling mode'];
    }

    const settingsKey = `${playerId}_${gameId}`;
    uniqueSettings.set(settingsKey, {
      player_id: playerId,
      game_id: gameId,
      game_role: row['role'] || null,
      mouse_dpi: parseNumber(row['dpi']),
      mouse_hz: parseIntNumber(row['hz']),
      in_game_sens: parseNumber(row['sens']),
      edpi: parseNumber(row['edpi']),
      resolution: row['resolution'] || null,
      aspect_ratio: row['aspect ratio'] || null,
      refresh_rate: null, // Scraped data didn't have refresh rate directly
      settings_data: settingsData
    });

    // B. Parse Product Relations
    productKeys.forEach(({ key }) => {
      const productName = row[key];
      if (productName && productName.trim() && productName !== '-') {
        const productId = productsMap[productName.trim()];
        if (productId) {
          const relationKey = `${playerId}_${productId}`;
          if (!uniqueRelations.has(relationKey)) {
            uniqueRelations.add(relationKey);
            relationsList.push({
              player_id: playerId,
              product_id: productId
            });
          }
        }
      }
    });
  });

  const settingsList = Array.from(uniqueSettings.values());

  // --- Step 5: Insert Settings ---
  console.log(`\nInserting ${settingsList.length} player settings...`);
  for (let i = 0; i < settingsList.length; i += chunkSize) {
    const chunk = settingsList.slice(i, i + chunkSize);
    const { error } = await supabase.from('player_game_settings').upsert(chunk, { onConflict: 'player_id,game_id' });
    if (error) {
      console.error(`❌ Error inserting settings chunk ${i}:`, error.message);
      // We don't exit here, just warn, but let's check
    }
  }

  // --- Step 6: Insert Relations ---
  console.log(`Inserting ${relationsList.length} player-product relationships...`);
  // For relations, we insert in chunks and ignore conflicts (since composite key handles duplicate rows)
  for (let i = 0; i < relationsList.length; i += chunkSize) {
    const chunk = relationsList.slice(i, i + chunkSize);
    const { error } = await supabase.from('player_products').upsert(chunk, { onConflict: 'player_id,product_id' });
    if (error) {
      console.error(`❌ Error inserting relations chunk ${i}:`, error.message);
    }
  }

  console.log("\n🎉 Database seeding completed successfully!");
}

run().catch(console.error);
