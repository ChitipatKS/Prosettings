const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Supabase env
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
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to make HTTPS requests with compression & custom User-Agent
function fetchLiquipedia(apiPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'liquipedia.net',
      path: apiPath,
      headers: {
        'User-Agent': 'ProSettingsApp/1.0 (https://prosettings.example.com; contact@prosettings.example.com)',
        'Accept-Encoding': 'gzip, deflate'
      }
    };

    const req = https.get(options, (res) => {
      if (res.statusCode === 429) {
        return reject(new Error('Rate limited (429)'));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];
        const processBody = (raw) => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(e);
          }
        };

        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) return reject(err);
            processBody(decoded.toString());
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (err, decoded) => {
            if (err) return reject(err);
            processBody(decoded.toString());
          });
        } else {
          processBody(buffer.toString());
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Clean birth date into YYYY-MM-DD
function formatBirthDate(raw) {
  if (!raw) return null;
  // Match YYYY-MM-DD or YYYY-M-D
  const match = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return raw.replace(/\{\{[^}]+\}\}/g, '').trim() || null;
}

// Clean wikitext name
function cleanName(raw) {
  if (!raw) return '';
  return raw
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

async function fetchPlayerDetails(username) {
  try {
    const json = await fetchLiquipedia(`/counterstrike/api.php?action=parse&page=${encodeURIComponent(username)}&prop=wikitext&format=json`);
    const wikitext = json?.parse?.wikitext?.['*'] || '';

    if (!wikitext) return null;

    const romNameMatch = wikitext.match(/\|\s*romanizedname\s*=\s*([^|\n]+)/i);
    const nameMatch = wikitext.match(/\|\s*name\s*=\s*([^|\n]+)/i);
    const birthMatch = wikitext.match(/\|\s*birth_date\s*=\s*([^|\n]+)/i);
    const imageMatch = wikitext.match(/\|\s*image\s*=\s*([^|\n]+)/i);

    const romanized = cleanName(romNameMatch ? romNameMatch[1] : '');
    const regular = cleanName(nameMatch ? nameMatch[1] : '');
    const real_name = romanized || regular || null;
    const birth_date = formatBirthDate(birthMatch ? birthMatch[1] : null);
    const image_file = imageMatch ? imageMatch[1].trim() : null;

    return {
      real_name,
      birth_date,
      image_file
    };
  } catch (err) {
    return null;
  }
}

async function run() {
  const jsonPath = path.join(__dirname, '../data/vrs-top55-cs2.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Error: data/vrs-top55-cs2.json not found.');
    process.exit(1);
  }

  const vrsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const teams = vrsData.teams || [];

  console.log(`🚀 Starting enrichment of ${vrsData.total_players} players from Top 55 Teams...\n`);

  let processedCount = 0;
  let successRealNames = 0;
  let successBirthDates = 0;

  for (let tIdx = 0; tIdx < teams.length; tIdx++) {
    const team = teams[tIdx];
    console.log(`[Team ${tIdx + 1}/55] ${team.name} (${team.players.length} players)`);

    for (let pIdx = 0; pIdx < team.players.length; pIdx++) {
      const player = team.players[pIdx];
      processedCount++;

      const details = await fetchPlayerDetails(player.username);
      if (details) {
        if (details.real_name) {
          player.real_name = details.real_name;
          successRealNames++;
        }
        if (details.birth_date) {
          player.birth_date = details.birth_date;
          successBirthDates++;
        }
        console.log(`  ✓ (${processedCount}/${vrsData.total_players}) ${player.username} -> ${player.real_name || '-'} | Born: ${player.birth_date || '-'}`);
      } else {
        console.log(`  - (${processedCount}/${vrsData.total_players}) ${player.username} -> Not found on Liquipedia`);
      }

      // Sync directly to Supabase if connected
      if (supabase) {
        const updatePayload = {};
        if (player.real_name) updatePayload.Full_name = player.real_name;
        if (player.birth_date) updatePayload.birth_date = player.birth_date;
        if (player.country_code) updatePayload.country_code = player.country_code;
        if (player.nationality) updatePayload.nationality = player.nationality;
        if (team.name) updatePayload.team = team.name;

        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from('players')
            .upsert({
              username: player.username,
              ...updatePayload
            }, { onConflict: 'username' });
        }
      }

      // Polite rate limit (250ms)
      await new Promise(r => setTimeout(r, 250));
    }

    // Save progress after each team
    fs.writeFileSync(jsonPath, JSON.stringify(vrsData, null, 2));
  }

  console.log(`\n🎉 Enrichment Complete!`);
  console.log(`- Total Players Processed: ${processedCount}`);
  console.log(`- Real Names Found: ${successRealNames}`);
  console.log(`- Birth Dates Found: ${successBirthDates}`);
  console.log(`- Saved to: data/vrs-top55-cs2.json and Supabase database.`);
}

run();
