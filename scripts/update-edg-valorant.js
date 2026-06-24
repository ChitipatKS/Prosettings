const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
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

const countryNameToCode = {
  'china': 'CN',
  'united states': 'US',
  'canada': 'CA',
  'south korea': 'KR',
  'russia': 'RU',
  'ukraine': 'UA',
  'france': 'FR',
  'germany': 'DE',
  'united kingdom': 'GB',
  'thailand': 'TH',
  'indonesia': 'ID',
  'singapore': 'SG',
  'malaysia': 'MY',
  'philippines': 'PH',
  'japan': 'JP',
  'brazil': 'BR',
  'sweden': 'SE',
  'denmark': 'DK',
  'finland': 'FI',
  'norway': 'NO',
  'poland': 'PL',
  'turkey': 'TR',
  'uk': 'GB',
  'usa': 'US',
  'vietnam': 'VN',
  'taiwan': 'TW',
  'hong kong': 'HK',
  'australia': 'AU',
  'new zealand': 'NZ',
  'netherlands': 'NL',
  'belgium': 'BE',
  'spain': 'ES',
  'portugal': 'PT',
  'italy': 'IT',
  'austria': 'AT',
  'switzerland': 'CH',
  'mongolia': 'MN',
  'argentina': 'AR',
  'chile': 'CL',
  'peru': 'PE',
  'mexico': 'MX',
  'colombia': 'CO',
  'belarus': 'BY',
  'kazakhstan': 'KZ',
  'palestine': 'PS',
  'hungary': 'HU',
  'albania': 'AL',
  'north macedonia': 'MK',
  'romania': 'RO',
  'bulgaria': 'BG',
  'slovakia': 'SK',
  'czechia': 'CZ',
  'czech republic': 'CZ',
  'serbia': 'RS',
  'croatia': 'HR',
  'lithuania': 'LT',
  'latvia': 'LV',
  'estonia': 'EE'
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseBirthDate(val) {
  if (!val) return null;
  const datePart = val.split('(')[0].trim().replace(/\s+/g, ' ');
  const months = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };
  
  const match = datePart.match(/([a-zA-Z]+)\s+(\d+),\s+(\d{4})/);
  if (match) {
    const monthName = match[1].toLowerCase();
    const day = match[2].padStart(2, '0');
    const year = match[3];
    const month = months[monthName];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

async function scrapePlayerLiquipedia(username) {
  const url = `https://liquipedia.net/valorant/${encodeURIComponent(username)}`;
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'ProSettingsClone/1.0 (contact: admin@prosettingsclone.com) NodeScraperPolite',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      timeout: 10000
    });

    const $ = cheerio.load(data);
    
    let nativeName = null;
    let romanizedName = null;
    let birthDateRaw = null;
    let nationality = null;

    $('div.infobox-description').each((i, el) => {
      const label = $(el).text().trim().toLowerCase();
      const valueEl = $(el).next();
      const value = valueEl.text().trim();
      
      if (label === 'name:') {
        nativeName = value;
      } else if (label === 'romanized name:') {
        romanizedName = value;
      } else if (label === 'born:') {
        birthDateRaw = value;
      } else if (label === 'nationality:') {
        nationality = value;
      }
    });

    const realName = romanizedName || nativeName || null;
    const birthDate = parseBirthDate(birthDateRaw);
    const countryCode = nationality ? (countryNameToCode[nationality.toLowerCase()] || null) : null;

    return {
      realName,
      birthDate,
      nationality,
      countryCode
    };
  } catch (e) {
    if (e.response && e.response.status === 404) {
      return { error: '404 Not Found' };
    }
    return { error: e.message };
  }
}

async function run() {
  console.log("Fetching VALORANT players from EDward Gaming...");
  
  // Find EDward Gaming players who play VALORANT
  const { data: players, error } = await supabase
    .from('players')
    .select(`
      id,
      username,
      team,
      player_game_settings!inner (
        games!inner (
          slug
        )
      )
    `)
    .ilike('team', 'edward gaming')
    .eq('player_game_settings.games.slug', 'valorant');

  if (error) {
    console.error("❌ Error fetching players:", error.message);
    process.exit(1);
  }

  console.log(`Found ${players.length} players associated with EDward Gaming in VALORANT.`);
  if (players.length === 0) {
    console.log("No players found in database. Check spelling of team name.");
    process.exit(0);
  }

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const username = player.username;
    
    console.log(`\n[${i + 1}/${players.length}] Scraping ${username} ...`);
    const result = await scrapePlayerLiquipedia(username);
    
    if (result.error) {
      console.log(`⚠️  Could not scrape ${username}: ${result.error}`);
    } else {
      const payload = {};
      if (result.realName) payload.real_name = result.realName;
      if (result.birthDate) payload.birth_date = result.birthDate;
      if (result.nationality) payload.nationality = result.nationality;
      if (result.countryCode) payload.country_code = result.countryCode;

      if (Object.keys(payload).length > 0) {
        const { error: updateErr } = await supabase
          .from('players')
          .update(payload)
          .eq('id', player.id);

        if (updateErr) {
          console.error(`❌ Failed to update ${username}:`, updateErr.message);
        } else {
          console.log(`✅ Updated ${username} -> Real Name: "${result.realName || '-'}", Country: "${result.nationality || '-'}" (${result.countryCode || '-'})`);
        }
      } else {
        console.log(`ℹ️  No data found in infobox for ${username}`);
      }
    }

    // Wait 2.5 seconds to be polite
    if (i < players.length - 1) {
      await delay(2500);
    }
  }

  console.log("\n🎉 EDward Gaming VALORANT players update completed!");
}

run().catch(console.error);
